import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

const InvoicePrint = () => {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['invoice-print', id],
    queryFn: async () => {
      if (!id) return null;
      const { data: order } = await supabase.from('orders').select('*').eq('id', id).single();
      if (!order) return null;
      const { data: store } = await supabase
        .from('stores')
        .select('id, name, logo_url, settings, slug')
        .eq('id', order.store_id)
        .single();
      return { order, store };
    },
    enabled: !!id,
  });

  useEffect(() => {
    document.title = data?.order?.invoice_number
      ? `Invoice ${data.order.invoice_number}`
      : 'Invoice';
  }, [data]);

  if (isLoading || !data?.order) {
    return <div className="p-10 text-center text-muted-foreground">Loading invoice...</div>;
  }

  const { order, store } = data;
  const items = (Array.isArray(order.items) ? order.items : []) as any[];
  const address = (order.customer_address || {}) as any;
  const settings = (store?.settings || {}) as any;
  const business = settings.business || {};
  const gstin = business.gstin || settings.gstin || '';
  const storeAddr = business.address || settings.address || {};

  return (
    <div className="min-h-screen bg-muted/30 print:bg-white">
      {/* Action bar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => window.close()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Close
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Invoice */}
      <div className="max-w-3xl mx-auto p-6 md:p-10 my-6 bg-white shadow-sm print:shadow-none print:my-0 print:p-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-6">
          <div className="flex items-center gap-3">
            {store?.logo_url && (
              <img src={store.logo_url} alt={store.name} className="h-14 w-14 rounded-md object-contain border" />
            )}
            <div>
              <h1 className="text-2xl font-bold">{store?.name}</h1>
              {gstin && <p className="text-xs text-muted-foreground">GSTIN: {gstin}</p>}
              {storeAddr?.line1 && (
                <p className="text-xs text-muted-foreground">
                  {[storeAddr.line1, storeAddr.city, storeAddr.state, storeAddr.pincode].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold tracking-wide">TAX INVOICE</h2>
            {order.invoice_number && <p className="text-sm font-mono mt-1">{order.invoice_number}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
            </p>
            <p className="text-xs text-muted-foreground">Order #{order.order_number}</p>
          </div>
        </div>

        {/* Bill to */}
        <div className="grid grid-cols-2 gap-6 py-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Bill To</p>
            <p className="font-medium">{order.customer_name || 'Walk-in Customer'}</p>
            {order.customer_phone && <p className="text-muted-foreground">{order.customer_phone}</p>}
            {order.customer_email && <p className="text-muted-foreground">{order.customer_email}</p>}
            {address?.line1 && (
              <p className="text-muted-foreground mt-1">
                {[address.line1, address.line2, address.city, address.state, address.pincode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Details</p>
            <p>
              <span className="text-muted-foreground">Mode: </span>
              <span className="capitalize font-medium">{order.fulfillment_mode?.replace('_', ' ')}</span>
            </p>
            {order.table_label && (
              <p>
                <span className="text-muted-foreground">Table: </span>
                <span className="font-medium">{order.table_label}</span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Payment: </span>
              <span className="capitalize font-medium">
                {order.payment_method || '—'} ({order.payment_status || 'pending'})
              </span>
            </p>
          </div>
        </div>

        {/* Items */}
        <table className="w-full text-sm border-t border-b">
          <thead>
            <tr className="bg-muted/40 text-left">
              <th className="py-2 px-2 font-medium">#</th>
              <th className="py-2 px-2 font-medium">Item</th>
              <th className="py-2 px-2 font-medium text-right">Qty</th>
              <th className="py-2 px-2 font-medium text-right">Price</th>
              <th className="py-2 px-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="py-2 px-2 text-muted-foreground">{i + 1}</td>
                <td className="py-2 px-2">
                  {it.title || it.name || it.product_name}
                  {it.variant && <span className="text-muted-foreground"> ({it.variant})</span>}
                </td>
                <td className="py-2 px-2 text-right">{it.quantity}</td>
                <td className="py-2 px-2 text-right">₹{Number(it.price || 0).toFixed(2)}</td>
                <td className="py-2 px-2 text-right">
                  ₹{(Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end pt-4">
          <div className="w-full sm:w-72 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{Number(order.subtotal || 0).toFixed(2)}</span>
            </div>
            {Number(order.shipping || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>₹{Number(order.shipping || 0).toFixed(2)}</span>
              </div>
            )}
            {Number(order.tax || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (GST)</span>
                <span>₹{Number(order.tax || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>Total</span>
              <span>₹{Number(order.total || 0).toFixed(2)}</span>
            </div>
            {order.amount_refunded > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Refunded</span>
                <span>−₹{Number(order.amount_refunded).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>Thank you for your business!</p>
          <p className="mt-1">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default InvoicePrint;
