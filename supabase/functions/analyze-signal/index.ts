import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) throw new Error("No architecture description provided.");
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY in Supabase secrets.");

    // Phase 1: The Bouncer
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
    
    // 🚀 THE SCRUBBER: Strips Markdown formatting so JSON.parse doesn't crash
    let rawText = analyzeData.candidates[0].content.parts[0].text;
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const llmResponse = JSON.parse(rawText);
    
    const score = llmResponse.score;
    const feedback = llmResponse.feedback;
    let vector = null;

    // Phase 2: The Math
    if (score > 85) {
       // 🚀 UPGRADE: Pointing to the new gemini-embedding-001 model
       const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           model: "models/gemini-embedding-001",
           content: { parts: [{ text }] },
           outputDimensionality: 768 // 🚀 CRITICAL: Compresses the 3072D vector down to 768D to perfectly fit your Postgres schema
         })
       });
       
       const embedData = await embedRes.json();
       if (embedData.error) throw new Error(`Gemini Embedding Error: ${embedData.error.message}`);
       
       vector = embedData.embedding.values; 
    }

    return new Response(JSON.stringify({ score, feedback, vector }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    // 🚀 THE LOGGER: Forces the actual error to print in your Supabase Dashboard
    console.error("[CRITICAL SYSTEM ERROR]:", error.message);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});