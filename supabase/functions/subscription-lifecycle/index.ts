// Daily cron: sends renewal reminders, sets grace, and blocks expired stores.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

async function notify(storeId: string, kind: string, data: Record<string, unknown>) {
  try {
    const { data: store } = await admin
      .from('stores').select('user_id, name').eq('id', storeId).maybeSingle()
    if (!store?.user_id) return
    const { data: u } = await admin.auth.admin.getUserById(store.user_id)
    const email = u?.user?.email
    if (!email) return
    await admin.functions.invoke('send-order-notification', {
      body: {
        kind,
        recipient: email,
        store_name: store.name,
        ...data,
      },
    })
  } catch (e) {
    console.error('notify failed', kind, e)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const now = new Date()
  const summary = { renewal_reminders: 0, grace_started: 0, grace_warnings: 0, blocked: 0 }

  // 1) Renewal reminder — current_period_end within next 5 days, not free, not yet notified this cycle
  {
    const in5 = new Date(now.getTime() + 5 * 86400_000).toISOString()
    const { data: subs } = await admin.from('subscriptions')
      .select('store_id, current_period_end, plan, expiry_notified_at')
      .neq('plan', 'free')
      .lte('current_period_end', in5)
      .gte('current_period_end', now.toISOString())
    for (const s of subs ?? []) {
      if (s.expiry_notified_at && new Date(s.expiry_notified_at) > new Date(now.getTime() - 7 * 86400_000)) continue
      await notify(s.store_id, 'subscription_renewal_upcoming', {
        renews_at: s.current_period_end, plan: s.plan,
      })
      await admin.from('subscriptions').update({ expiry_notified_at: now.toISOString() })
        .eq('store_id', s.store_id)
      summary.renewal_reminders++
    }
  }

  // 2) Start grace — past current_period_end, status not active, no grace yet
  {
    const { data: subs } = await admin.from('subscriptions')
      .select('store_id, current_period_end, plan')
      .neq('plan', 'free')
      .lt('current_period_end', now.toISOString())
      .is('grace_period_end', null)
    for (const s of subs ?? []) {
      const graceEnd = new Date(new Date(s.current_period_end!).getTime() + 15 * 86400_000).toISOString()
      await admin.from('subscriptions').update({
        status: 'past_due', grace_period_end: graceEnd,
      }).eq('store_id', s.store_id)
      await notify(s.store_id, 'subscription_payment_failed', { grace_period_end: graceEnd })
      summary.grace_started++
    }
  }

  // 3) Grace warning — grace ends in ≤ 3 days
  {
    const in3 = new Date(now.getTime() + 3 * 86400_000).toISOString()
    const { data: subs } = await admin.from('subscriptions')
      .select('store_id, grace_period_end, grace_warning_notified_at')
      .eq('is_blocked', false)
      .not('grace_period_end', 'is', null)
      .lte('grace_period_end', in3)
      .gte('grace_period_end', now.toISOString())
    for (const s of subs ?? []) {
      if (s.grace_warning_notified_at) continue
      await notify(s.store_id, 'subscription_grace_warning', { grace_period_end: s.grace_period_end })
      await admin.from('subscriptions').update({ grace_warning_notified_at: now.toISOString() })
        .eq('store_id', s.store_id)
      summary.grace_warnings++
    }
  }

  // 4) Block — grace ended unpaid
  {
    const { data: subs } = await admin.from('subscriptions')
      .select('store_id, grace_period_end, blocked_notified_at')
      .eq('is_blocked', false)
      .not('grace_period_end', 'is', null)
      .lt('grace_period_end', now.toISOString())
    for (const s of subs ?? []) {
      await admin.from('subscriptions').update({
        is_blocked: true, blocked_notified_at: now.toISOString(),
      }).eq('store_id', s.store_id)
      await notify(s.store_id, 'subscription_blocked', { blocked_at: now.toISOString() })
      summary.blocked++
    }
  }

  return new Response(JSON.stringify({ ok: true, summary }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
