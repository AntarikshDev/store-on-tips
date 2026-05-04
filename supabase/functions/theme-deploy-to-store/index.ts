import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Missing auth");
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { store_id, theme_pack_id } = await req.json();
    if (!store_id || !theme_pack_id) throw new Error("store_id and theme_pack_id required");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify store ownership
    const { data: store } = await admin.from("stores").select("id,user_id,theme").eq("id", store_id).maybeSingle();
    if (!store || store.user_id !== user.id) throw new Error("Forbidden");

    const { data: pack } = await admin.from("theme_packs").select("*").eq("id", theme_pack_id).maybeSingle();
    if (!pack) throw new Error("Theme pack not found");

    // If premium, check purchase
    if ((pack.price || 0) > 0) {
      const { data: purchase } = await admin.from("theme_purchases").select("id")
        .eq("store_id", store_id).eq("theme_pack_id", theme_pack_id).maybeSingle();
      if (!purchase) {
        return new Response(JSON.stringify({ error: "PURCHASE_REQUIRED", price: pack.price }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const newTheme = {
      ...(store.theme as Record<string, unknown> || {}),
      theme_pack_id: pack.id,
      name: pack.name,
      ...(pack.theme_config as Record<string, unknown>),
      pages: pack.pages,
      installed_at: new Date().toISOString(),
    };
    const { error: uErr } = await admin.from("stores").update({ theme: newTheme }).eq("id", store_id);
    if (uErr) throw uErr;

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
