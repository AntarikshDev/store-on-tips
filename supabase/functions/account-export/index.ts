import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const [profile, stores, invoices, deletionReqs] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('stores').select('*').eq('user_id', user.id),
      supabase.from('platform_invoices').select('*').eq('user_id', user.id),
      supabase.from('account_deletion_requests').select('*').eq('user_id', user.id),
    ]);

    const storeIds = (stores.data ?? []).map((s: any) => s.id);
    let products: any[] = [], orders: any[] = [], wallets: any[] = [];
    if (storeIds.length) {
      const [p, o, w] = await Promise.all([
        supabase.from('products').select('*').in('store_id', storeIds),
        supabase.from('orders').select('*').in('store_id', storeIds),
        supabase.from('ai_credit_wallets').select('*').in('store_id', storeIds),
      ]);
      products = p.data ?? [];
      orders = o.data ?? [];
      wallets = w.data ?? [];
    }

    const payload = {
      exported_at: new Date().toISOString(),
      user: { id: user.id, email: user.email, created_at: user.created_at },
      profile: profile.data,
      stores: stores.data ?? [],
      products,
      orders,
      wallets,
      invoices: invoices.data ?? [],
      deletion_requests: deletionReqs.data ?? [],
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="pictocart-export-${user.id.slice(0, 8)}.json"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
