import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const payload = await req.json();
    // 🚀 FIXED: Added 'table' to the extraction payload
    const { type, table, record, old_record } = payload;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let pushTitle = "";
    let pushBody = "";
    let targetRoute = "";
    let tokens: string[] = [];

    // ==========================================
    // PROTOCOL 1: NEW TEAM LAUNCHED (BROADCAST)
    // ==========================================
    if (table === "teams" && type === "INSERT") {
      pushTitle = "NEW MISSION AVAILABLE //";
      pushBody = `A new project '${record.project_name.toUpperCase()}' was just launched in the Arena.`;
      targetRoute = "index"; // Route to the main Arena

      // Fetch all tokens EXCEPT the founder who just created the team
      const { data: users } = await supabase
        .from("users")
        .select("push_tokens")
        .neq("id", record.founder_id);

      if (users) {
        users.forEach((u) => {
          if (u.push_tokens && Array.isArray(u.push_tokens)) {
            tokens.push(...u.push_tokens);
          }
        });
      }
    }

    // ==========================================
    // PROTOCOL 2: SWIPE INTERACTIONS
    // ==========================================
    else if (table === "swipes") {
      let targetUserId = null;

      // Scenario A: New Inbound Application
      if (type === "INSERT" && record.status === "pending") {
        const { data: team } = await supabase
          .from("teams")
          .select("project_name, founder_id")
          .eq("id", record.team_id)
          .single();

        const { data: profile } = await supabase
          .from("users")
          .select("github_handle")
          .eq("id", record.swiper_id)
          .single();

        targetUserId = team?.founder_id;
        pushTitle = "INBOUND SIGNAL //";
        pushBody = `@${profile?.github_handle || "Unknown"} applied to join ${team?.project_name?.toUpperCase()}.`;
        targetRoute = "inbound";
      }

      // Scenario B: Application Accepted/Rejected
      else if (type === "UPDATE" && record.status !== old_record?.status) {
        const { data: team } = await supabase
          .from("teams")
          .select("project_name")
          .eq("id", record.team_id)
          .single();

        targetUserId = record.swiper_id;
        targetRoute = "outbound";

        if (record.status === "accepted") {
          pushTitle = "UPLINK SECURED //";
          pushBody = `Your deployment to ${team?.project_name?.toUpperCase()} was APPROVED.`;
        } else if (record.status === "rejected") {
          pushTitle = "SIGNAL VOID //";
          pushBody = `Your application to ${team?.project_name?.toUpperCase()} was DENIED.`;
        } else {
          return new Response("Status ignored", { status: 200 });
        }
      } else {
        return new Response("No action required", { status: 200 });
      }

      // Fetch the specific target's tokens
      if (targetUserId) {
        const { data: userData } = await supabase
          .from("users")
          .select("push_tokens")
          .eq("id", targetUserId)
          .single();

        if (userData?.push_tokens && Array.isArray(userData.push_tokens)) {
          tokens.push(...userData.push_tokens);
        }
      }
    }

    // ==========================================
    // EXECUTE TRANSMISSION
    // ==========================================
    if (tokens.length === 0) {
      return new Response("Target(s) have no push tokens", { status: 200 });
    }

    const messages = tokens.map((token: string) => ({
      to: token,
      sound: "default",
      title: pushTitle,
      body: pushBody,
      data: { route: targetRoute },
    }));

    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const expoReceipt = await expoResponse.json();
    return new Response(JSON.stringify(expoReceipt), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Transmission Failure:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
