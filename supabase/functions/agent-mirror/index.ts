import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-agent-signature",
};

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(s)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Mirrors a message from the Master Bazaar agent into Pic To Cart's chat log.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const secret = Deno.env.get("THEME_INGEST_SECRET")!;
    const raw = await req.text();
    if ((req.headers.get("x-agent-signature") || "") !== await hmacHex(secret, raw)) {
      return new Response(JSON.stringify({ error: "Bad signature" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { author = "agent", message, scoped_theme_id = null, intent = null, attachments = [], cost_inr = 0 } = JSON.parse(raw);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await admin.from("agent_admin_messages").insert({
      author, message, scoped_theme_id, intent, attachments, cost_inr,
    }).select().single();
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, id: data.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
