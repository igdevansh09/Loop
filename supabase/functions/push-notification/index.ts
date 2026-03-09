import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, record, old_record } = payload;

    // Initialize Supabase Admin Client to bypass RLS and fetch data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let targetUserId = null;
    let pushTitle = '';
    let pushBody = '';

    // 🚀 SCENARIO 1: User Applies (INSERT) -> Notify Founder
    if (type === 'INSERT' && record.status === 'pending') {
      // 1. Get the team name and who the founder is
      const { data: team } = await supabase.from('teams').select('project_name, founder_id').eq('id', record.team_id).single();
      
      // 2. Get the applicant's github handle
      const { data: profile } = await supabase.from('profiles').select('github_handle').eq('id', record.swiper_id).single();

      targetUserId = team?.founder_id;
      pushTitle = 'INBOUND SIGNAL //';
      pushBody = `@${profile?.github_handle || 'Unknown'} applied to join ${team?.project_name?.toUpperCase()} hackathon.`;
    } 
    
    // 🚀 SCENARIO 2: Status Changes (UPDATE) -> Notify Applicant
    else if (type === 'UPDATE' && record.status !== old_record?.status) {
      // 1. Get the team name
      const { data: team } = await supabase.from('teams').select('project_name').eq('id', record.team_id).single();

      targetUserId = record.swiper_id; // The applicant

      if (record.status === 'accepted') {
        pushTitle = 'UPLINK SECURED //';
        pushBody = `Your deployment to ${team?.project_name?.toUpperCase()} was APPROVED.`;
      } else if (record.status === 'rejected') {
        pushTitle = 'SIGNAL VOID //';
        pushBody = `Your application to ${team?.project_name?.toUpperCase()} was DENIED.`;
      } else {
        return new Response("Status ignored", { status: 200 }); // Ignore "withdrawn" etc.
      }
    } 
    
    // Ignore anything else
    else {
      return new Response("No action required", { status: 200 });
    }

    // --- EXECUTE THE PUSH ---
    if (!targetUserId) return new Response("Missing target user", { status: 400 });

    // Fetch the target user's tokens array
    const { data: userData } = await supabase.from('users').select('push_tokens').eq('id', targetUserId).single();
    const tokens = userData?.push_tokens || [];

    if (tokens.length === 0) {
      return new Response("Target has no push tokens", { status: 200 });
    }

    // Construct the Expo Push Messages
    const messages = tokens.map((token: string) => ({
      to: token,
      sound: 'default',
      title: pushTitle,
      body: pushBody,
      data: { route: 'ledger' }, // Optional data to handle when they tap the notification
    }));

    // Fire to Expo Servers
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const expoReceipt = await expoResponse.json();
    return new Response(JSON.stringify(expoReceipt), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Transmission Failure:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});