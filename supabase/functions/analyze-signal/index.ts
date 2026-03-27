import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // We expect this to be called by a Supabase Webhook on the 'teams' table
    const record = payload.record;

    if (!record || !record.id) {
      throw new Error("Invalid payload: Missing record data");
    }

    console.log(`[ANALYZE-SIGNAL] Igniting Forge for Team ID: ${record.id}`);

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("Missing Gemini API Key");

    const genAI = new GoogleGenerativeAI(geminiKey);

    // 1. Construct the Semantic Text Payload
    // Hum sirf tags nahi, pura context embed karenge.
    const textToEmbed = `
      Project Name: ${record.project_name}
      Description: ${record.project_description}
      Required Skills: ${record.required_skills}
    `.trim();

    console.log("[ANALYZE-SIGNAL] Generating Vector Embedding...");

    // 2. Call Gemini Embedding Model
    const embeddingModel = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });
    const embeddingResult = await embeddingModel.embedContent(textToEmbed);

    // Gemini returns a 768-dimensional float array
    const requirementVector = embeddingResult.embedding.values.slice(0, 768);

    // 3. Inject Vector back into the Database
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabaseClient
      .from("teams")
      .update({ requirement_embedding: requirementVector })
      .eq("id", record.id);

    if (updateError) throw updateError;

    console.log(
      `[ANALYZE-SIGNAL] Vector successfully injected for Team ID: ${record.id}`,
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[ANALYZE-SIGNAL] Fatal Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
