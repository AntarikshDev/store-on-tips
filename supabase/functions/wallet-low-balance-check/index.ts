// Cron: scan wallets and email sellers when AI credit balance is low/critical/zero.
// Schedule via Supabase scheduled trigger (e.g., every 6 hours).
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data: settings } = await supabase
    .from('platform_credit_settings').select('low_balance_threshold, critical_balance_threshold').eq('id', 1).maybeSingle()
  const LOW = settings?.low_balance_threshold ?? 200
  const CRIT = settings?.critical_balance_threshold ?? 50

  const { data: wallets } = await supabase
    .from('ai_credit_wallets')
    .select('store_id, balance, stores(name, user_id)')
    .lte('balance', LOW)

  let sent = 0
  const cooldownHours = 24
  const cutoff = new Date(Date.now() - cooldownHours * 3600 * 1000).toISOString()

  for (const w of wallets || []) {
    const store: any = (w as any).stores
    if (!store?.user_id) continue
    const balance = w.balance as number
    const threshold: 'zero' | 'critical' | 'low' = balance <= 0 ? 'zero' : balance <= CRIT ? 'critical' : 'low'

    const { data: recent } = await supabase
      .from('low_balance_alerts')
      .select('id').eq('store_id', w.store_id).eq('threshold_type', threshold).gte('sent_at', cutoff).maybeSingle()
    if (recent) continue

    const { data: userResp } = await supabase.auth.admin.getUserById(store.user_id)
    const email = userResp?.user?.email
    const fullName = (userResp?.user?.user_metadata as any)?.full_name as string | undefined
    if (!email) continue

    const { error: invokeError } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'low-balance',
        recipientEmail: email,
        idempotencyKey: `low-balance-${w.store_id}-${threshold}-${new Date().toISOString().slice(0, 10)}`,
        templateData: { name: fullName, storeName: store.name, balance, threshold },
      },
    })
    if (invokeError) { console.error('send error', invokeError); continue }

    await supabase.from('low_balance_alerts').insert({
      store_id: w.store_id, threshold_type: threshold, balance_at_alert: balance,
    })
    sent++
  }

  return new Response(JSON.stringify({ ok: true, scanned: wallets?.length ?? 0, sent }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})
