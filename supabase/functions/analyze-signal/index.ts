import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight for React Native
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) throw new Error("No architecture description provided.");
    if (!GEMINI_API_KEY) throw new Error("Missing Gemini API Key in environment.");

    // Phase 1: The Bouncer (Generative LLM)
    const analyzeRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ 
            text: `You are an elite senior software engineer vetting a hackathon project proposal. 
            Evaluate the technical depth (signal) of the following description. 
            Ignore marketing fluff. Look for specific architecture, databases, tech stacks, and hard technical problems.
            Respond STRICTLY in valid JSON format with two keys:
            1. "score" (integer between 0-100)
            2. "feedback" (string, max 2 sentences. If score is under 85, explicitly state what technical details are missing. Be brutally honest.)
            
            Description: ${text}` 
          }] 
        }],
        generationConfig: { 
          responseMimeType: "application/json" 
        }
      })
    });

    const analyzeData = await analyzeRes.json();
    if (analyzeData.error) throw new Error(`Gemini LLM Error: ${analyzeData.error.message}`);
    
    // Parse the structured JSON response
    const llmResponse = JSON.parse(analyzeData.candidates[0].content.parts[0].text);
    const score = llmResponse.score;
    const feedback = llmResponse.feedback;

    let vector = null;

    // Phase 2: The Math (Embedding LLM)
    // Only burn embedding compute if the founder proved they know what they are building
    if (score > 85) {
       const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           model: "models/text-embedding-004",
           content: { parts: [{ text }] }
         })
       });
       
       const embedData = await embedRes.json();
       if (embedData.error) throw new Error(`Gemini Embedding Error: ${embedData.error.message}`);
       
       vector = embedData.embedding.values; // Exactly 768 dimensions
    }

    return new Response(JSON.stringify({ score, feedback, vector }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});