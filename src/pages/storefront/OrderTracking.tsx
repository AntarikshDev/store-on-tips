import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, ChefHat, Bell, Truck, Utensils, PartyPopper, Star } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PREP_STEPS = [
  { key: 'received', label: 'Received', icon: Check },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: Bell },
  { key: 'served', label: 'Served / Out', icon: Truck },
];

const COMPLETED_STATES = new Set(['completed', 'delivered']);

const OrderTracking = () => {
  const { code } = useParams<{ code: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.rpc('get_order_by_tracking' as any, { tracking_code: code });
      const row = Array.isArray(data) ? data[0] : data;
      if (cancelled) return;
      setOrder(row || null);
      if (row?.id) {
        const { data: fb } = await supabase
          .from('order_feedback' as any)
          .select('id')
          .eq('order_id', row.id)
          .maybeSingle();
        if (fb) setSubmitted(true);
      }
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [code]);

  const submitFeedback = async () => {
    if (!order || rating < 1) return;
    setSubmitting(true);
    const { error } = await supabase.from('order_feedback' as any).insert({
      order_id: order.id,
      store_id: order.store_id,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setSubmitted(true);
    toast.success('Thanks for your feedback!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Order not found</div>;

  const isCompleted = COMPLETED_STATES.has(order.prep_status) || COMPLETED_STATES.has(order.status);
  const currentIdx = isCompleted
    ? PREP_STEPS.length - 1
    : Math.max(0, PREP_STEPS.findIndex((s) => s.key === order.prep_status));

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Utensils className="h-10 w-10 mx-auto text-primary mb-2" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Order</p>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          {order.table_label && <p className="text-sm text-muted-foreground mt-1">Table {order.table_label}</p>}
        </div>

        {isCompleted ? (
          <div className="border rounded-xl p-6 bg-card text-center space-y-3">
            <PartyPopper className="h-10 w-10 mx-auto text-primary" />
            <h2 className="text-xl font-bold">Enjoy your meal!</h2>
            <p className="text-sm text-muted-foreground">Your order is complete. We'd love your feedback.</p>

            {submitted ? (
              <div className="pt-2 text-sm text-primary font-medium">Thanks for rating us! 🙏</div>
            ) : (
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(n)}
                      className="p-1"
                      aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-8 w-8 transition ${
                          (hover || rating) >= n ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us how it was… (optional)"
                  rows={3}
                  className="text-sm"
                />
                <Button
                  onClick={submitFeedback}
                  disabled={rating < 1 || submitting}
                  className="w-full"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit rating
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="border rounded-xl p-5 bg-card space-y-4">
            {PREP_STEPS.map((s, i) => {
              const done = i <= currentIdx;
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${done ? '' : 'text-muted-foreground'}`}>{s.label}</p>
                  </div>
                  {i === currentIdx && order.prep_status && <span className="text-xs text-primary animate-pulse">in progress</span>}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 border rounded-xl p-4 bg-card">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Items</p>
          {(order.items as any[]).map((it, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span>{it.title} × {it.quantity}</span>
              <span>₹{(it.price * it.quantity).toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold pt-2 mt-2 border-t">
            <span>Total</span><span>₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {!isCompleted && <p className="text-center text-xs text-muted-foreground mt-6">This page updates automatically. Keep it open!</p>}
      </div>
    </div>
  );
};

export default OrderTracking;
