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

    const { token, action = "validate", password, full_name } = await req.json();
    if (!token) throw new Error("token required");
    const tokenHash = await sha256Hex(token);

    const { data: invite, error: iErr } = await admin
      .from("partner_invites")
      .select("id, partner_id, email, expires_at, accepted_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (iErr) throw iErr;
    if (!invite) throw new Error("Invalid or expired invite");
    if (invite.accepted_at) throw new Error("Invite already used");
    if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error("Invite has expired");

    const { data: partner } = await admin
      .from("partners")
      .select("id, name, partner_type, user_id")
      .eq("id", invite.partner_id)
      .single();

    if (action === "validate") {
      return new Response(JSON.stringify({
        success: true,
        email: invite.email,
        partner_name: partner?.name,
        partner_type: partner?.partner_type,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "accept") {
      if (!password || String(password).length < 8) throw new Error("Password must be at least 8 characters");

      // Try to find an existing auth user by email
      let userId: string | null = null;
      const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 });
      const found = existing?.users?.find((u: any) => u.email?.toLowerCase() === invite.email.toLowerCase());
      if (found) {
        userId = found.id;
        await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
      } else {
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email: invite.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: full_name || partner?.name, is_partner: true },
        });
        if (cErr) throw cErr;
        userId = created.user!.id;
      }

      // Assign partner role (idempotent)
      await admin.from("user_roles").upsert(
        { user_id: userId, role: "partner" },
        { onConflict: "user_id,role", ignoreDuplicates: true }
      );

      // Link partner row to user, mark active
      await admin.from("partners").update({
        user_id: userId,
        invite_status: "active",
      }).eq("id", invite.partner_id);

      // Mark invite consumed
      await admin.from("partner_invites").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);

      return new Response(JSON.stringify({ success: true, email: invite.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (err: any) {
    console.error("partner-accept error", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
