// Autonomous Cloudflare Auto-Pilot agent.
// Runs every 5 min via pg_cron. Public (no JWT) — protected by being cron-only
// in practice; safe because it only reads/writes platform-internal data and
// never accepts user input that affects routing.
//
// For each store with a custom_domain, it:
//   1. Syncs hostname state with Cloudflare (re-provisions if missing).
//   2. Performs an HTTPS health probe (HEAD).
//   3. Updates consecutive_failures, downtime_started_at, downtime_notified_at.
//   4. Sends downtime / recovery emails to the merchant.
//   5. Logs to domain_health_log + agent_incidents (realtime feed).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN')!;
  const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID')!;
  const fallback = Deno.env.get('CLOUDFLARE_FALLBACK_TARGET') ?? 'fallback.pictocart.in';

  const { data: settings } = await supabase.from('admin_settings').select('*').eq('id', 1).maybeSingle();
  const downtimeThresholdMin = settings?.downtime_threshold_minutes ?? 10;
  const autoHeal = settings?.auto_heal_enabled ?? true;
  const notifyMerchants = settings?.notify_merchants ?? true;
  const alertEmail = settings?.alert_email ?? null;

  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, slug, user_id, custom_domain, cloudflare_hostname_id, ssl_status, consecutive_failures, downtime_started_at, downtime_notified_at')
    .not('custom_domain', 'is', null);

  const summary: any[] = [];

  for (const store of stores ?? []) {
    try {
      const result = await processStore(store, {
        supabase, apiToken, zoneId, fallback,
        autoHeal, notifyMerchants, alertEmail, downtimeThresholdMin,
      });
      summary.push({ domain: store.custom_domain, ...result });
    } catch (err: any) {
      console.error('agent error', store.custom_domain, err?.message);
      summary.push({ domain: store.custom_domain, error: err?.message });
    }
  }

  return new Response(JSON.stringify({ success: true, processed: summary.length, summary }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

async function processStore(store: any, ctx: any) {
  const { supabase, apiToken, zoneId, fallback, autoHeal, notifyMerchants, alertEmail, downtimeThresholdMin } = ctx;
  const domain = store.custom_domain as string;

  // --- A. Sync with Cloudflare ---
  let cfStatus: any = null;
  if (store.cloudflare_hostname_id) {
    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames/${store.cloudflare_hostname_id}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    const cfData = await cfRes.json();
    if (cfRes.ok && cfData.success) cfStatus = cfData.result;
  }

  // Auto re-provision if missing in CF but we have a domain
  if (!cfStatus && autoHeal) {
    const provisionRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/custom_hostnames`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostname: domain,
        ssl: { method: 'http', type: 'dv', settings: { min_tls_version: '1.2' } },
        custom_origin_server: fallback,
      }),
    });
    const pData = await provisionRes.json();
    if (provisionRes.ok && pData.success) {
      await supabase.from('stores').update({
        cloudflare_hostname_id: pData.result.id,
        ssl_status: pData.result.ssl?.status ?? 'pending',
      }).eq('id', store.id);
      await logIncident(supabase, store, 'reprovisioned', 'info', { hostname_id: pData.result.id });
      cfStatus = pData.result;
    } else {
      await logIncident(supabase, store, 'escalated', 'error', { reason: 'reprovision_failed', error: pData.errors });
    }
  }

  const sslStatus = cfStatus?.ssl?.status ?? store.ssl_status ?? 'pending';

  // --- B. Health probe ---
  const start = Date.now();
  let httpCode: number | null = null;
  let healthy = false;
  let errorMessage: string | null = null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(`https://${domain}`, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(timer);
    httpCode = res.status;
    healthy = res.status < 500;
  } catch (err: any) {
    errorMessage = err?.message ?? 'fetch failed';
  }
  const responseMs = Date.now() - start;

  await supabase.from('domain_health_log').insert({
    store_id: store.id,
    domain,
    status: healthy ? 'up' : 'down',
    http_code: httpCode,
    ssl_valid: sslStatus === 'active',
    response_ms: responseMs,
    error_message: errorMessage,
  });

  // --- C. Update failure counters + downtime tracking ---
  const updates: any = { last_health_check_at: new Date().toISOString(), ssl_status: sslStatus };

  if (healthy) {
    // Recovery path
    if (store.downtime_notified_at && notifyMerchants) {
      const downtimeMs = store.downtime_started_at ? Date.now() - new Date(store.downtime_started_at).getTime() : 0;
      await sendEmail(supabase, store, 'recovered', { duration_min: Math.round(downtimeMs / 60_000) }, alertEmail);
      await logIncident(supabase, store, 'recovered', 'info', { duration_min: Math.round(downtimeMs / 60_000) });
    }
    updates.consecutive_failures = 0;
    updates.downtime_started_at = null;
    updates.downtime_notified_at = null;
  } else {
    const failures = (store.consecutive_failures ?? 0) + 1;
    updates.consecutive_failures = failures;
    if (failures >= 3 && !store.downtime_started_at) {
      updates.downtime_started_at = new Date().toISOString();
    }
    const downStart = store.downtime_started_at ? new Date(store.downtime_started_at) : (updates.downtime_started_at ? new Date(updates.downtime_started_at) : null);
    const downMin = downStart ? (Date.now() - downStart.getTime()) / 60_000 : 0;
    if (failures >= 5 && downMin >= downtimeThresholdMin && !store.downtime_notified_at) {
      if (notifyMerchants) {
        await sendEmail(supabase, store, 'downtime', { duration_min: Math.round(downMin) }, alertEmail);
      }
      await logIncident(supabase, store, 'downtime_alert', 'error', { failures, downtime_min: Math.round(downMin), error: errorMessage });
      updates.downtime_notified_at = new Date().toISOString();
    }
  }

  await supabase.from('stores').update(updates).eq('id', store.id);

  return { healthy, ssl: sslStatus, http: httpCode, response_ms: responseMs, failures: updates.consecutive_failures };
}

async function logIncident(supabase: any, store: any, action: string, severity: string, details: any) {
  await supabase.from('agent_incidents').insert({
    store_id: store.id, domain: store.custom_domain, action, severity, details,
  });
}

async function sendEmail(supabase: any, store: any, kind: 'downtime' | 'recovered', vars: any, alertEmail: string | null) {
  // Get merchant email from auth user
  const { data: userData } = await supabase.auth.admin.getUserById(store.user_id);
  const merchantEmail = userData?.user?.email;
  const recipients = [merchantEmail, alertEmail].filter(Boolean);
  if (!recipients.length) return;

  const subject = kind === 'downtime'
    ? `⚠️ Your store ${store.name} is unreachable`
    : `✅ ${store.name} is back online`;

  const html = kind === 'downtime'
    ? `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px"><h2 style="color:#dc2626">Store unreachable</h2><p>Hi,</p><p>We detected that <strong>${store.name}</strong> (${store.custom_domain}) has been unreachable for about <strong>${vars.duration_min} minutes</strong>.</p><p>Our auto-pilot is investigating and will retry automatically. If the issue persists, check your DNS records (CNAME → fallback.pictocart.in).</p><p style="color:#64748b;font-size:13px">— Pictocart Auto-Pilot</p></div>`
    : `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px"><h2 style="color:#16a34a">Back online</h2><p>Hi,</p><p>Good news — <strong>${store.name}</strong> (${store.custom_domain}) is back online. Total downtime: <strong>${vars.duration_min} minutes</strong>.</p><p style="color:#64748b;font-size:13px">— Pictocart Auto-Pilot</p></div>`;

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) return;

  await fetch('https://connector-gateway.lovable.dev/resend/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: 'Pictocart Auto-Pilot <onboarding@resend.dev>',
      to: recipients,
      subject,
      html,
    }),
  }).catch((e) => console.error('email failed', e?.message));
}
