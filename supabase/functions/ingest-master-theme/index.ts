import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-agent-signature",
};

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const secret = Deno.env.get("THEME_INGEST_SECRET");
    if (!secret) throw new Error("THEME_INGEST_SECRET not configured");
    const raw = await req.text();
    const sig = req.headers.get("x-agent-signature") || "";
    const expected = await hmacHex(secret, raw);
    if (sig !== expected) {
      return new Response(JSON.stringify({ error: "Bad signature" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const body = JSON.parse(raw);
    const {
      master_theme_id, name, category, payload, preview_image,
      generation_cost_inr = 0, tokens_used = 0, reuse_ratio = 0,
      reused_components = 0, reused_images = 0, source_research = {},
      price_inr = 0, auto_publish = false,
    } = body;
    if (!name || !payload) throw new Error("name and payload required");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Create theme_pack
    const { data: pack, error: pErr } = await admin.from("theme_packs").insert({
      name, category: category || "general",
      description: payload?.description || null,
      thumbnail: preview_image || null,
      pages: payload?.pages || {},
      theme_config: payload?.theme_config || {},
      price: price_inr,
      ai_generation_cost: generation_cost_inr,
      is_published: auto_publish,
    }).select().single();
    if (pErr) throw pErr;

    const { data: delivery, error: dErr } = await admin.from("master_theme_deliveries").insert({
      master_id: master_theme_id || null,
      theme_pack_id: pack.id,
      name, category, payload, preview_image,
      generation_cost_inr, tokens_used, reuse_ratio,
      reused_components, reused_images, source_research,
      status: auto_publish ? "published" : "pending",
    }).select().single();
    if (dErr) throw dErr;

    await admin.from("theme_generation_metrics").insert({
      theme_pack_id: pack.id, delivery_id: delivery.id,
      category, tokens_used, cost_inr: generation_cost_inr, reuse_ratio,
    });

    return new Response(JSON.stringify({ ok: true, theme_pack_id: pack.id, delivery_id: delivery.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ingest-master-theme:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
