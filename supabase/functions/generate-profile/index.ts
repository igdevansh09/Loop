import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-user-gemini-key, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, github_handle } = await req.json();

    if (!user_id || !github_handle) {
      throw new Error("Missing user_id or github_handle");
    }

    console.log(`Starting Scrape for: ${github_handle}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const userProvidedKey = req.headers.get("x-user-gemini-key");
    let geminiKey = "";
    let isUsingFreeTier = false;

    if (userProvidedKey) {
      console.log("User provided their own API key.");
      geminiKey = userProvidedKey;
    } else {
      console.log("No key provided. Checking free tier eligibility...");
      const { data: userRecord, error: fetchError } = await supabaseClient
        .from("users")
        .select("free_profile_generated")
        .eq("id", user_id)
        .single();

      if (fetchError) throw new Error("Failed to verify user tier.");

      if (userRecord.free_profile_generated === true) {
        console.warn("User already exhausted free tier. Rejecting.");
        return new Response(JSON.stringify({ error: "FREE_LIMIT_EXHAUSTED" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 402, 
        });
      }

      console.log("User is eligible for free tier. Using Server Key.");
      geminiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
      isUsingFreeTier = true;
    }

    if (!geminiKey) throw new Error("No valid Gemini API Key found.");

    const githubToken = Deno.env.get("GITHUB_ACCESS_TOKEN");
    const headers = {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    };

    const userRes = await fetch(
      `https://api.github.com/users/${github_handle}`,
      { headers },
    );
    if (!userRes.ok)
      throw new Error(`GitHub User API failed: ${userRes.statusText}`);
    const userData = await userRes.json();

    const developerStats = {
      bio: userData.bio,
      followers: userData.followers,
      total_public_repos: userData.public_repos,
    };

    const reposRes = await fetch(
      `https://api.github.com/users/${github_handle}/repos?sort=pushed&per_page=30`,
      { headers },
    );
    if (!reposRes.ok)
      throw new Error(`GitHub Repo API failed: ${reposRes.statusText}`);
    const rawRepos = await reposRes.json();

    const originalRepos = rawRepos.filter((repo: any) => !repo.fork);

    const sortedForDeepDive = [...originalRepos].sort(
      (a, b) =>
        b.stargazers_count * 1000 +
        b.size -
        (a.stargazers_count * 1000 + a.size),
    );
    const top3Repos = sortedForDeepDive.slice(0, 3);

    const recentMetadata = originalRepos.slice(0, 10).map((repo: any) => ({
      name: repo.name,
      description: repo.description,
      size: repo.size,
    }));

    console.log(
      `Deep diving into Top 3 repos: ${top3Repos.map((r) => r.name).join(", ")}`,
    );

    const deepDivePromises = top3Repos.map(async (repo) => {
      let languages = {};
      try {
        const langRes = await fetch(repo.languages_url, { headers });
        if (langRes.ok) languages = await langRes.json();
      } catch (e) {
        console.warn(`Failed to fetch languages for ${repo.name}`);
      }

      let readme = "NO_README_FOUND";
      try {
        const readmeRes = await fetch(
          `https://api.github.com/repos/${github_handle}/${repo.name}/readme`,
          { headers: { ...headers, Accept: "application/vnd.github.v3.raw" } },
        );
        if (readmeRes.ok) {
          const rawReadme = await readmeRes.text();
          readme =
            rawReadme.substring(0, 800) +
            (rawReadme.length > 800 ? "...[TRUNCATED]" : "");
        }
      } catch (e) {
        console.warn(`Failed to fetch README for ${repo.name}`);
      }

      return {
        name: repo.name,
        stars: repo.stargazers_count,
        languages_byte_breakdown: languages,
        readme_snippet: readme,
      };
    });

    const deepDiveResults = await Promise.all(deepDivePromises);

    const payloadForAI = {
      overall_stats: developerStats,
      recent_activity: recentMetadata,
      flagship_projects_analysis: deepDiveResults,
    };

    const genAI = new GoogleGenerativeAI(geminiKey);
    const textModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      You are a ruthless, highly technical recruiter evaluating a developer for a matching platform.
      Analyze their overall stats, recent repo metadata, and a deep-dive into their Top 3 flagship projects.

      Developer Data:
      ${JSON.stringify(payloadForAI, null, 2)}
      
      RULES FOR JUDGMENT (THE "RUTHLESS" PROTOCOL):
      1. Documentation Penalty: Look at the 'readme_snippet' of their flagship projects. If it says "NO_README_FOUND" or is just a default CRA/Next.js/Expo template, PENALIZE THEM heavily. Real engineers write docs.
      2. Stack Truth: Look at the 'languages_byte_breakdown'. Ignore the repo name. If a project is 90% HTML and 10% JS, they are not a backend master.
      3. Fluff Check: If their 'recent_activity' consists of empty tutorial clones with tiny sizes, call it out directly.

      You MUST respond with a valid JSON object exactly matching this structure:
      {
        "ai_assessment": "A brutally honest, 3-sentence technical profile summarizing their ACTUAL skills and documentation habits.",
        "ai_primary_stack": "STRICTLY a comma-separated list of primary technologies/languages (e.g., 'JavaScript, React Native, Firebase'). NO paragraphs. NO sentences. NO explanations.",
        "ai_weekend_build": "The hard truth of what they are actually capable of building this weekend from scratch."
      }
    `;

    console.log("Generating AI JSON with exponential backoff...");
    let rawResponse = "";
    let apiSuccess = false;

    for (let i = 0; i < 3; i++) {
      try {
        const aiResult = await textModel.generateContent(prompt);
        rawResponse = aiResult.response.text();
        apiSuccess = true;
        break;
      } catch (error: any) {
        if (error.message?.includes("API key not valid")) {
          throw new Error("INVALID_CUSTOM_KEY");
        }

        if (error.message?.includes("503") || error.message?.includes("429")) {
          const waitTime = Math.pow(2, i);
          console.warn(`Gemini overloaded. Retrying in ${waitTime} seconds...`);
          await new Promise((res) => setTimeout(res, waitTime * 1000));
        } else {
          throw error;
        }
      }
    }

    if (!apiSuccess)
      throw new Error("Gemini API failed after maximum retries.");

    let parsedTruth;
    try {
      parsedTruth = JSON.parse(rawResponse);
      console.log("Successfully parsed AI Truth:", parsedTruth);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON:", rawResponse);
      throw new Error("AI returned malformed data. Execution halted.");
    }

    console.log("Converting Profile to Vector Embedding...");
    const textToEmbed = `Assessment: ${parsedTruth.ai_assessment} Stack: ${parsedTruth.ai_primary_stack} Capability: ${parsedTruth.ai_weekend_build}`;

    const embeddingModel = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });
    const embeddingResult = await embeddingModel.embedContent(textToEmbed);
    const profileVector = embeddingResult.embedding.values.slice(0, 768);

    const updatePayload: any = {
      raw_github_data: originalRepos.slice(0, 15).map((repo: any) => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
      })),
      ai_assessment: parsedTruth.ai_assessment,
      ai_primary_stack: parsedTruth.ai_primary_stack,
      ai_weekend_build: parsedTruth.ai_weekend_build,
      profile_embedding: profileVector,
    };

    if (isUsingFreeTier) {
      updatePayload.free_profile_generated = true;
    }

    const { error: updateError } = await supabaseClient
      .from("users")
      .update(updatePayload)
      .eq("id", user_id);

    if (updateError) throw updateError;

    console.log("Profile, Structured Data, and Vector successfully injected.");

    return new Response(
      JSON.stringify({ success: true, profile: parsedTruth }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("Scraper Error:", error.message);

    const status = error.message === "INVALID_CUSTOM_KEY" ? 401 : 400;

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: status,
    });
  }
});
