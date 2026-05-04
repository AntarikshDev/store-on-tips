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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const secret = Deno.env.get("THEME_INGEST_SECRET")!;
    const raw = await req.text();
    if ((req.headers.get("x-agent-signature") || "") !== await hmacHex(secret, raw)) {
      return new Response(JSON.stringify({ error: "Bad signature" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { entries = [] } = JSON.parse(raw);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const rows = entries.map((e: any) => ({
      category: e.category, archetype: e.archetype, hero_style: e.hero_style,
      planned_for: e.planned_for, status: "planned",
      expected_cost_inr: e.expected_cost_inr || 0, research_brief: e.research_brief || {},
    }));
    if (rows.length) await admin.from("theme_release_calendar").insert(rows);
    return new Response(JSON.stringify({ ok: true, count: rows.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
