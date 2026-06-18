import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { token, action = "validate", password } = await req.json();
    if (!token) throw new Error("token required");
    const tokenHash = await sha256Hex(token);

    const { data: handover } = await admin
      .from("store_handovers")
      .select("id, store_id, partner_id, client_email, plan, expires_at, accepted_at, status")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (!handover) throw new Error("Invalid or expired invite");
    if (handover.accepted_at) throw new Error("Invite already used");
    if (new Date(handover.expires_at).getTime() < Date.now()) throw new Error("Invite has expired");

    const { data: store } = await admin.from("stores").select("id, name, slug").eq("id", handover.store_id).single();

    if (action === "validate") {
      return new Response(JSON.stringify({
        success: true,
        email: handover.client_email,
        store_name: store?.name,
        plan: handover.plan,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "accept") {
      if (!password || String(password).length < 8) throw new Error("Password must be at least 8 characters");

      let userId: string | null = null;
      const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 });
      const found = existing?.users?.find((u: any) => u.email?.toLowerCase() === handover.client_email.toLowerCase());
      if (found) {
        userId = found.id;
        await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
      } else {
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email: handover.client_email,
          password,
          email_confirm: true,
          user_metadata: { is_seller: true },
        });
        if (cErr) throw cErr;
        userId = created.user!.id;
      }

      // Transfer store ownership via security-definer RPC
      const { error: tErr } = await admin.rpc("transfer_store_to_client", {
        _store_id: handover.store_id,
        _client_user_id: userId,
        _handover_id: handover.id,
      });
      if (tErr) throw tErr;

      return new Response(JSON.stringify({
        success: true,
        email: handover.client_email,
        store_slug: store?.slug,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Invalid action");
  } catch (err: any) {
    console.error("partner-handover-accept error", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
