import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonError('Unauthorized', 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return jsonError('Unauthorized', 401);

    const { store_id } = await req.json();
    if (!store_id) return jsonError('store_id required', 400);

    const { data: store } = await supabase
      .from('stores').select('id, user_id, custom_domain, cloudflare_hostname_id').eq('id', store_id).maybeSingle();
    if (!store || store.user_id !== user.id) return jsonError('Forbidden', 403);
    if (!store.cloudflare_hostname_id) return jsonError('No hostname provisioned', 400);

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')!;
    const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID')!;

    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames/${store.cloudflare_hostname_id}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    const cfData = await cfRes.json();
    if (!cfRes.ok || !cfData.success) {
      return jsonError(cfData.errors?.[0]?.message ?? 'Cloudflare API error', 400);
    }

    const sslStatus = cfData.result.ssl?.status ?? 'pending';
    const hostnameStatus = cfData.result.status ?? 'pending';
    const verificationErrors = cfData.result.verification_errors ?? [];
    const sslVerificationErrors = cfData.result.ssl?.validation_errors ?? [];

    await supabase.from('stores').update({
      ssl_status: sslStatus,
      ssl_last_checked_at: new Date().toISOString(),
    }).eq('id', store_id);

    return new Response(JSON.stringify({
      success: true,
      domain: store.custom_domain,
      hostname_status: hostnameStatus,
      ssl_status: sslStatus,
      is_active: hostnameStatus === 'active' && sslStatus === 'active',
      verification_errors: verificationErrors,
      ssl_validation_errors: sslVerificationErrors,
      ownership_verification: cfData.result.ownership_verification,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return jsonError(err.message ?? 'Server error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
