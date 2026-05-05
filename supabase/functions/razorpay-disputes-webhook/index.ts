import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const phaseFromEvent = (event: string): string => {
  if (event.endsWith('.created')) return 'open';
  if (event.endsWith('.under_review')) return 'under_review';
  if (event.endsWith('.won')) return 'won';
  if (event.endsWith('.lost')) return 'lost';
  if (event.endsWith('.closed')) return 'closed';
  return 'open';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const signature = req.headers.get('x-razorpay-signature');
    const rawBody = await req.text();
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const expected = await hmacSha256Hex(rawBody, RAZORPAY_WEBHOOK_SECRET);
    if (expected !== signature) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = JSON.parse(rawBody);
    const event = String(body.event || '');
    if (!event.startsWith('payment.dispute.')) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const dispute = body.payload?.dispute?.entity;
    const payment = body.payload?.payment?.entity;
    if (!dispute) {
      return new Response(JSON.stringify({ error: 'No dispute payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Try to associate with a store/order via payment notes
    const notes = payment?.notes ?? {};
    const storeId = notes.store_id ?? null;
    const orderId = notes.order_id ?? null;

    const upsert = {
      razorpay_dispute_id: dispute.id,
      razorpay_payment_id: dispute.payment_id ?? payment?.id ?? null,
      store_id: storeId,
      order_id: orderId,
      amount_inr: (dispute.amount ?? 0) / 100,
      reason_code: dispute.reason_code ?? null,
      reason_description: dispute.reason_description ?? null,
      status: ['won', 'lost', 'closed'].includes(phaseFromEvent(event)) ? phaseFromEvent(event) : 'open',
      phase: phaseFromEvent(event),
      respond_by: dispute.respond_by ? new Date(dispute.respond_by * 1000).toISOString() : null,
      raw: body,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('disputes').upsert(upsert, { onConflict: 'razorpay_dispute_id' });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
