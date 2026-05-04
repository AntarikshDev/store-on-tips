import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MousePointerClick, ShoppingCart, CreditCard, BadgeCheck } from 'lucide-react';

interface Props { storeId: string; days?: number }

const STAGES = [
  { key: 'page_view', label: 'Visitors', icon: Eye },
  { key: 'product_view', label: 'Product Views', icon: MousePointerClick },
  { key: 'add_to_cart', label: 'Added to Cart', icon: ShoppingCart },
  { key: 'checkout_start', label: 'Reached Checkout', icon: CreditCard },
  { key: 'purchase', label: 'Purchased', icon: BadgeCheck },
] as const;

const ConversionFunnel = ({ storeId, days = 30 }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ['funnel', storeId, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data: events } = await supabase
        .from('analytics_events')
        .select('event_type, session_id, value')
        .eq('store_id', storeId)
        .gte('created_at', since.toISOString())
        .limit(10000);

      const sessionsByStage: Record<string, Set<string>> = {};
      let revenue = 0;
      (events || []).forEach((e: any) => {
        sessionsByStage[e.event_type] ??= new Set();
        if (e.session_id) sessionsByStage[e.event_type].add(e.session_id);
        if (e.event_type === 'purchase') revenue += Number(e.value) || 0;
      });

      const counts = STAGES.map((s) => sessionsByStage[s.key]?.size || 0);
      const top = counts[0] || 1;
      return { counts, top, revenue, total: events?.length || 0 };
    },
    enabled: !!storeId,
  });

  if (isLoading) return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading funnel…</CardContent></Card>;

  const visitors = data?.counts[0] ?? 0;
  const purchases = data?.counts[4] ?? 0;
  const cvr = visitors > 0 ? ((purchases / visitors) * 100).toFixed(2) : '0.00';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Conversion Funnel — Last {days} days</span>
          <span className="text-xs font-normal text-muted-foreground">CVR: <span className="font-bold text-primary">{cvr}%</span></span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {STAGES.map((s, i) => {
          const count = data?.counts[i] ?? 0;
          const pct = data?.top ? Math.max(2, (count / data.top) * 100) : 2;
          const dropoff = i > 0 && data ? data.counts[i - 1] - count : 0;
          const Icon = s.icon;
          return (
            <div key={s.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-muted-foreground" /> {s.label}</span>
                <span className="tabular-nums">
                  <strong>{count.toLocaleString('en-IN')}</strong>
                  {i > 0 && dropoff > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">−{dropoff}</span>
                  )}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        <div className="flex justify-between pt-3 border-t text-sm">
          <span className="text-muted-foreground">Tracked Revenue</span>
          <span className="font-bold">₹{(data?.revenue ?? 0).toLocaleString('en-IN')}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnel;
