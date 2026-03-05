import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

export const evaluateCandidate = action({
  args: {
    applicationId: v.id("applications"),
    githubUsername: v.string(),
    techStack: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // 1. The Evidence: Fetch recent public repositories from GitHub
      const githubRes = await fetch(`https://api.github.com/users/${args.githubUsername}/repos?sort=updated&per_page=10`);
      
      if (!githubRes.ok) {
        throw new Error(`GitHub API rejected the request for ${args.githubUsername}`);
      }
      
      const repos = await githubRes.json();

      // Filter the bloat. We only care about language, description, and stars.
      const repoSummary = repos.map((r: any) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count
      }));

      // 2. The Filter: Gemini API Call
      const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is missing from environment variables.");
      }

      const prompt = `
        You are a ruthless technical auditor evaluating a candidate for a project requiring this specific tech stack: ${args.techStack.join(", ")}.
        Here is the candidate's recent public GitHub repository footprint:
        ${JSON.stringify(repoSummary)}

        Task: Provide a strict, minified 2-sentence summary evaluating their actual footprint against the required stack. 
        Rules: Do not be polite. Be highly objective. If there is no evidence of the required languages, state that explicitly as a high risk. Do not hallucinate skills not present in the repository data.
      `;

      // Standard REST fetch to Gemini 2.5 Flash for high-speed, low-latency text generation
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!geminiRes.ok) throw new Error("Gemini API evaluation failed.");
      
      const geminiData = await geminiRes.json();
      const aiSummary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "AI evaluation failed to generate text.";

      // 3. The Resolution: Write the summary back to the database
      await ctx.runMutation(api.applications.patchAISummary, {
        applicationId: args.applicationId,
        aiSummary: aiSummary.trim(),
      });

    } catch (error: any) {
      console.error("AI Pipeline Error:", error);
      
      // Failsafe: If GitHub or Gemini goes down, do not leave the application in limbo.
      await ctx.runMutation(api.applications.patchAISummary, {
        applicationId: args.applicationId,
        aiSummary: `System Audit Failed: ${error.message || "Unknown error during verification."}`,
      });
    }
  },
});