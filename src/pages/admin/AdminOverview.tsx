import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Users, IndianRupee, Package, TrendingUp, ShoppingCart } from 'lucide-react';

const AdminOverview = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [storesRes, productsRes, ordersRes, usersRes] = await Promise.all([
        supabase.from('stores').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      const totalRevenue = (ordersRes.data || []).reduce((s, o) => s + (o.total || 0), 0);

      return {
        stores: storesRes.count || 0,
        products: productsRes.count || 0,
        orders: ordersRes.data?.length || 0,
        users: usersRes.count || 0,
        revenue: totalRevenue,
      };
    },
  });

  const cards = [
    { label: 'Total Stores', value: stats?.stores ?? 0, icon: Store, color: 'text-primary' },
    { label: 'Total Users', value: stats?.users ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'Total Orders', value: stats?.orders ?? 0, icon: ShoppingCart, color: 'text-green-500' },
    { label: 'Total Products', value: stats?.products ?? 0, icon: Package, color: 'text-purple-500' },
    { label: 'Platform Revenue', value: `₹${(stats?.revenue ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-amber-500' },
    { label: 'Commission (2%)', value: `₹${Math.round((stats?.revenue ?? 0) * 0.02).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">Monitor your entire platform at a glance</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PlatformFunnel />
    </div>
  );
};

const PlatformFunnel = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-funnel'],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceISO = since.toISOString();

      const [signupsRes, storesRes, publishedRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sinceISO),
        supabase.from('stores').select('id', { count: 'exact', head: true }).gte('created_at', sinceISO),
        supabase.from('stores').select('id', { count: 'exact', head: true }).eq('is_published', true).gte('created_at', sinceISO),
        supabase.from('orders').select('store_id').gte('created_at', sinceISO),
      ]);

      const storesWithSale = new Set((ordersRes.data || []).map((o: any) => o.store_id));

      return {
        signups: signupsRes.count || 0,
        stores: storesRes.count || 0,
        published: publishedRes.count || 0,
        firstSale: storesWithSale.size,
      };
    },
  });

  const stages = [
    { label: 'Signed Up', value: data?.signups ?? 0 },
    { label: 'Created Store', value: data?.stores ?? 0 },
    { label: 'Published Store', value: data?.published ?? 0 },
    { label: 'First Sale', value: data?.firstSale ?? 0 },
  ];
  const top = stages[0].value || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Platform Activation Funnel — Last 30 days</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : stages.map((s, i) => {
          const pct = Math.max(2, (s.value / top) * 100);
          const conv = i > 0 ? ((s.value / Math.max(stages[i - 1].value, 1)) * 100).toFixed(1) : null;
          return (
            <div key={s.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{s.label}</span>
                <span className="tabular-nums">
                  <strong>{s.value.toLocaleString('en-IN')}</strong>
                  {conv && <span className="ml-2 text-xs text-muted-foreground">{conv}%</span>}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AdminOverview;
