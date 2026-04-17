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
      .from('stores').select('id, user_id, cloudflare_hostname_id').eq('id', store_id).maybeSingle();
    if (!store || store.user_id !== user.id) return jsonError('Forbidden', 403);

    if (store.cloudflare_hostname_id) {
      const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')!;
      const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID')!;
      await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames/${store.cloudflare_hostname_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiToken}` },
      }).catch(() => {});
    }

    await supabase.from('stores').update({
      custom_domain: null,
      cloudflare_hostname_id: null,
      ssl_status: null,
      ssl_last_checked_at: null,
    }).eq('id', store_id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
