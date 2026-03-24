import { serve } from 'https:
import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, github_handle } = await req.json();

    if (!user_id || !github_handle) {
      throw new Error('Missing user_id or github_handle');
    }

    console.log(`Starting scrape for: ${github_handle}`);

    
    
    
    const githubToken = Deno.env.get('GITHUB_ACCESS_TOKEN');
    const githubRes = await fetch(`https://api.github.com/users/${github_handle}/repos?sort=pushed&per_page=15`, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!githubRes.ok) throw new Error(`GitHub API failed: ${githubRes.statusText}`);
    const repos = await githubRes.json();

    const strippedRepos = repos.map((repo: any) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
    }));

    
    
    
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) throw new Error('Missing Gemini API Key');
    
    const genAI = new GoogleGenerativeAI(geminiKey);
    
    
    const textModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      You are a ruthless technical recruiter. Analyze these recent public GitHub repositories:
      ${JSON.stringify(strippedRepos, null, 2)}
      
      You MUST respond with a valid JSON object exactly matching this structure:
      {
        "ai_assessment": "A brutally honest, 3-sentence technical profile summarizing their actual skills based purely on their repos. Strip away boilerplate and fluff.",
        "ai_primary_stack": "Their primary language and framework (e.g., 'JavaScript & React Native').",
        "ai_weekend_build": "The hard truth of what they are actually capable of building this weekend from scratch."
      }
    `;

    console.log('Generating AI Profile JSON...');
    const aiResult = await textModel.generateContent(prompt);
    const rawResponse = aiResult.response.text();
    
    
    let parsedTruth;
    try {
      parsedTruth = JSON.parse(rawResponse);
      console.log("Successfully parsed AI Truth:", parsedTruth);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON:", rawResponse);
      throw new Error("AI returned malformed data. Execution halted.");
    }

    
    
    
    console.log('Converting Profile to Vector Embedding...');
    
    const textToEmbed = `Assessment: ${parsedTruth.ai_assessment} Stack: ${parsedTruth.ai_primary_stack} Capability: ${parsedTruth.ai_weekend_build}`;
    
    
    const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const embeddingResult = await embeddingModel.embedContent(textToEmbed);
    
    
    const profileVector = embeddingResult.embedding.values.slice(0, 768);

    
    
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        raw_github_data: strippedRepos,
        ai_assessment: parsedTruth.ai_assessment,
        ai_primary_stack: parsedTruth.ai_primary_stack,
        ai_weekend_build: parsedTruth.ai_weekend_build,
        profile_embedding: profileVector 
      })
      .eq('id', user_id);

    if (updateError) throw updateError;

    console.log('Profile, Structured Data, and Vector successfully injected.');

    return new Response(JSON.stringify({ success: true, profile: parsedTruth }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Scraper Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});