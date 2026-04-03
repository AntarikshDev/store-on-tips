import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useThemePacks, useAllThemePurchases } from '@/hooks/useThemePacks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, TrendingUp, Package } from 'lucide-react';

const AdminRevenue = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, created_at, status, payment_status')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const allOrders = orders || [];
      const totalRevenue = allOrders.reduce((s, o) => s + (o.total || 0), 0);
      const paidOrders = allOrders.filter((o) => o.payment_status === 'paid' || o.payment_status === 'cod');
      const paidRevenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);

      // Last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = allOrders.filter((o) => new Date(o.created_at) >= sevenDaysAgo);
      const recentRevenue = recent.reduce((s, o) => s + (o.total || 0), 0);

      return {
        totalRevenue,
        paidRevenue,
        commission2: Math.round(totalRevenue * 0.02),
        recentRevenue,
        totalOrders: allOrders.length,
        recentOrders: recent.length,
      };
    },
  });

  const cards = [
    { label: 'Total GMV', value: `₹${(data?.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee },
    { label: 'Paid Revenue', value: `₹${(data?.paidRevenue ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee },
    { label: 'Platform Commission (2%)', value: `₹${(data?.commission2 ?? 0).toLocaleString('en-IN')}`, icon: TrendingUp },
    { label: 'Last 7 Days GMV', value: `₹${(data?.recentRevenue ?? 0).toLocaleString('en-IN')}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform-wide revenue and commission tracking</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Orders</span>
                  <p className="text-lg font-bold">{data?.totalOrders ?? 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Orders (Last 7 days)</span>
                  <p className="text-lg font-bold">{data?.recentOrders ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <ThemeEconomics />
        </>
      )}
    </div>
  );
};

const ThemeEconomics = () => {
  const { data: packs = [] } = useThemePacks(false);
  const totalAiCost = packs.reduce((s, p) => s + Number(p.ai_generation_cost), 0);
  const totalRevenue = packs.reduce((s, p) => s + (p.price * p.sales_count), 0);
  const totalSales = packs.reduce((s, p) => s + p.sales_count, 0);

  if (packs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> Theme Economics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Themes</p>
            <p className="text-lg font-bold">{packs.length}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">AI Spend</p>
            <p className="text-lg font-bold">₹{totalAiCost.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Theme Revenue</p>
            <p className="text-lg font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">ROI</p>
            <p className="text-lg font-bold">{totalAiCost > 0 ? `${Math.round(((totalRevenue - totalAiCost) / totalAiCost) * 100)}%` : 'N/A'}</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Theme</TableHead>
              <TableHead className="text-right">AI Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packs.map(p => {
              const rev = p.price * p.sales_count;
              const cost = Number(p.ai_generation_cost);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{p.name} <Badge variant="outline" className="ml-1 text-[10px] capitalize">{p.category}</Badge></TableCell>
                  <TableCell className="text-right">₹{cost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{p.price}</TableCell>
                  <TableCell className="text-right">{p.sales_count}</TableCell>
                  <TableCell className="text-right">₹{rev.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right font-medium" style={{ color: rev - cost >= 0 ? '#16a34a' : '#dc2626' }}>₹{(rev - cost).toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
    </div>
  );
};

export default AdminRevenue;
