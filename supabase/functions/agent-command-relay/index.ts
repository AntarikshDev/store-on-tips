import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(s)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Admin types in Pic To Cart's /admin/agent. We:
//  1. Persist their message locally.
//  2. Forward (HMAC-signed) to the Master Bazaar agent webhook.
//  3. Return immediately — the agent's reply will come back via /agent-mirror.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Admin required");

    const { message, scoped_theme_id = null, intent = null, attachments = [] } = await req.json();
    if (!message?.trim()) throw new Error("message required");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await admin.from("agent_admin_messages").insert({
      author: "admin", message, scoped_theme_id, intent, attachments,
    });

    const bazaarUrl = Deno.env.get("BAZAAR_AGENT_URL"); // e.g. https://<bazaar-project>.supabase.co/functions/v1/agent-webhook
    const secret = Deno.env.get("THEME_INGEST_SECRET");
    let forwarded = false;
    if (bazaarUrl && secret) {
      const payload = JSON.stringify({ message, scoped_theme_id, intent, attachments, source: "pictocart" });
      const sig = await hmacHex(secret, payload);
      try {
        const res = await fetch(bazaarUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-agent-signature": sig },
          body: payload,
        });
        forwarded = res.ok;
      } catch (err) {
        console.error("forward to bazaar failed:", err);
      }
    }

    return new Response(JSON.stringify({ ok: true, forwarded }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("agent-command-relay:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
