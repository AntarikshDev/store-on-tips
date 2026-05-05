import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface InvoiceInput {
  user_id: string;
  store_id?: string | null;
  type: 'subscription' | 'wallet_recharge';
  description: string;
  amount_inr: number;
  gst_rate?: number;
  razorpay_payment_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_gstin?: string;
  customer_address?: Record<string, unknown>;
  send_email?: boolean;
}

const renderInvoiceHtml = (inv: any) => `
<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:640px;margin:24px auto;color:#111">
  <div style="border:1px solid #eee;border-radius:8px;padding:24px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div><h2 style="margin:0">Tax Invoice</h2><p style="margin:4px 0;color:#666">Pictocart — by Antariksh Automations</p></div>
      <div style="text-align:right"><div style="font-weight:600">${inv.invoice_number}</div><div style="color:#666;font-size:12px">${new Date(inv.created_at).toLocaleDateString('en-IN')}</div></div>
    </div>
    <div style="margin-bottom:16px;font-size:13px">
      <div><strong>Bill To:</strong></div>
      <div>${inv.customer_name ?? ''}</div>
      <div>${inv.customer_email ?? ''}</div>
      ${inv.customer_gstin ? `<div>GSTIN: ${inv.customer_gstin}</div>` : ''}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr style="background:#f9fafb"><th align="left" style="padding:8px;border-bottom:1px solid #eee">Description</th><th align="right" style="padding:8px;border-bottom:1px solid #eee">Amount (₹)</th></tr></thead>
      <tbody>
        <tr><td style="padding:8px">${inv.description}</td><td align="right" style="padding:8px">${Number(inv.amount_inr).toFixed(2)}</td></tr>
        <tr><td style="padding:8px">GST @ ${inv.gst_rate}%</td><td align="right" style="padding:8px">${Number(inv.gst_amount_inr).toFixed(2)}</td></tr>
        <tr style="font-weight:700"><td style="padding:8px;border-top:1px solid #eee">Total</td><td align="right" style="padding:8px;border-top:1px solid #eee">₹${Number(inv.total_inr).toFixed(2)}</td></tr>
      </tbody>
    </table>
    ${inv.razorpay_payment_id ? `<p style="margin-top:16px;font-size:12px;color:#666">Payment Ref: ${inv.razorpay_payment_id}</p>` : ''}
    <p style="margin-top:24px;font-size:12px;color:#888">This is a computer-generated invoice. For queries, write to support@pictocart.in.</p>
  </div>
</body></html>`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const input = (await req.json()) as InvoiceInput;
    if (!input.user_id || !input.type || !input.description || input.amount_inr == null) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const gstRate = input.gst_rate ?? 18;
    const amount = Number(input.amount_inr);
    // Treat amount as inclusive base — compute GST on it
    const gstAmount = +(amount * (gstRate / 100)).toFixed(2);
    const total = +(amount + gstAmount).toFixed(2);

    const { data: seq } = await supabase.rpc('nextval' as any, { sequence_name: 'platform_invoice_seq' }).single().catch(() => ({ data: null }));
    let invoiceNumber: string;
    if (seq && (seq as any).nextval) {
      invoiceNumber = `PIC-${new Date().getFullYear()}-${(seq as any).nextval}`;
    } else {
      // fallback: use timestamp
      invoiceNumber = `PIC-${Date.now()}`;
    }

    const { data: inv, error } = await supabase
      .from('platform_invoices')
      .insert({
        invoice_number: invoiceNumber,
        user_id: input.user_id,
        store_id: input.store_id ?? null,
        type: input.type,
        description: input.description,
        amount_inr: amount,
        gst_rate: gstRate,
        gst_amount_inr: gstAmount,
        total_inr: total,
        razorpay_payment_id: input.razorpay_payment_id ?? null,
        customer_name: input.customer_name ?? null,
        customer_email: input.customer_email ?? null,
        customer_gstin: input.customer_gstin ?? null,
        customer_address: input.customer_address ?? {},
      })
      .select()
      .single();
    if (error) throw error;

    const html = renderInvoiceHtml(inv);

    if (input.send_email && input.customer_email) {
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            to: input.customer_email,
            subject: `Invoice ${invoiceNumber} — Pictocart`,
            html,
            template_name: 'platform_invoice',
          },
        });
        await supabase.from('platform_invoices').update({ emailed_at: new Date().toISOString() }).eq('id', inv.id);
      } catch (e) {
        console.error('invoice email failed', e);
      }
    }

    return new Response(JSON.stringify({ ok: true, invoice: inv, html }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
