import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9.1/mod.ts";

async function getAccessToken(serviceAccountJsonStr: string) {
  const serviceAccount = JSON.parse(serviceAccountJsonStr);

  const jwtHeader = { alg: "RS256", typ: "JWT" };
  const jwtPayload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: getNumericDate(3600), 
    iat: getNumericDate(0),
  };

  const privateKeyPem = serviceAccount.private_key.replace(/\\n/g, "\n");

  const keyData = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");

  const binaryDer = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const jwt = await create(jwtHeader, jwtPayload, cryptoKey);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(
      `Failed to get access token: ${tokenData.error_description || JSON.stringify(tokenData)}`,
    );
  }
  return tokenData.access_token;
}

serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let pushTitle = "";
    let pushBody = "";
    let targetRoute = "";
    let tokens: string[] = [];

    // PROTOCOL 1: NEW TEAM LAUNCHED (BROADCAST)
    if (table === "teams" && type === "INSERT") {
      pushTitle = "NEW MISSION AVAILABLE //";
      pushBody = `A new project '${record.project_name.toUpperCase()}' was just launched in the Arena.`;
      targetRoute = `dossier?id=${record.id}`;

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

    // PROTOCOL 2: SWIPE INTERACTIONS
    else if (table === "swipes") {
      let targetUserId = null;

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
        targetRoute = "/(drawer)/(tabs)/inbound";
      } else if (type === "UPDATE" && record.status !== old_record?.status) {
        const { data: team } = await supabase
          .from("teams")
          .select("project_name")
          .eq("id", record.team_id)
          .single();

        targetUserId = record.swiper_id;
        targetRoute = "/(drawer)/outbound";

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

    // EXECUTE TRANSMISSION (FCM V1 API)
    if (tokens.length === 0) {
      return new Response("Target(s) have no push tokens", { status: 200 });
    }

    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable");
    }

    const projectId = JSON.parse(serviceAccountJson).project_id;
    const accessToken = await getAccessToken(serviceAccountJson);

    const fcmRequests = tokens.map((token) => {
      const fcmMessage = {
        message: {
          token: token,
          notification: {
            title: pushTitle,
            body: pushBody,
          },
          data: {
            route: targetRoute,
          },
        },
      };

      return fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fcmMessage),
        },
      ).then((res) => res.json());
    });

    const results = await Promise.all(fcmRequests);

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Transmission Failure:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
