import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useStoreContext } from '../contexts/StoreContext';
import type { Order, Product, Customer } from '../types/database';

export function useOrders(limit?: number) {
  const { store } = useStoreContext();
  return useQuery({
    queryKey: ['orders', store?.id, limit ?? 'all'],
    enabled: !!store?.id,
    queryFn: async (): Promise<Order[]> => {
      let q = supabase
        .from('orders')
        .select('*')
        .eq('store_id', store!.id)
        .order('created_at', { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });
}

export function useOrder(orderId: string | undefined) {
  const { store } = useStoreContext();
  return useQuery({
    queryKey: ['orders', store?.id, 'detail', orderId],
    enabled: !!store?.id && !!orderId,
    queryFn: async (): Promise<Order | null> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store!.id)
        .eq('id', orderId!)
        .maybeSingle();
      if (error) throw error;
      return data as Order | null;
    },
  });
}

export function useProducts() {
  const { store } = useStoreContext();
  return useQuery({
    queryKey: ['products', store?.id],
    enabled: !!store?.id,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

export function useProduct(productId: string | undefined) {
  const { store } = useStoreContext();
  return useQuery({
    queryKey: ['products', store?.id, 'detail', productId],
    enabled: !!store?.id && !!productId,
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store!.id)
        .eq('id', productId!)
        .maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });
}

export function useCustomers() {
  const { store } = useStoreContext();
  return useQuery({
    queryKey: ['customers', store?.id],
    enabled: !!store?.id,
    queryFn: async (): Promise<Customer[]> => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', store!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  revenue7d: { label: string; value: number }[];
  recentOrders: Order[];
}

export function useDashboardStats() {
  const { store } = useStoreContext();
  return useQuery({
    queryKey: ['dashboard-stats', store?.id],
    enabled: !!store?.id,
    queryFn: async (): Promise<DashboardStats> => {
      const sid = store!.id;
      const since = new Date();
      since.setDate(since.getDate() - 7);

      const [ordersR, productsR] = await Promise.all([
        supabase.from('orders').select('*').eq('store_id', sid),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', sid),
      ]);
      const orders = (ordersR.data ?? []) as Order[];

      const totalRevenue = orders
        .filter(
          (o) =>
            o.payment_status === 'paid' &&
            o.status !== 'cancelled' &&
            o.status !== 'returned',
        )
        .reduce((s, o) => s + (Number(o.total) || 0), 0);

      const pendingOrders = orders.filter(
        (o) => o.status === 'pending' || o.status === 'confirmed',
      ).length;

      // Revenue per day for last 7d
      const days: { label: string; value: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const dayTotal = orders
          .filter(
            (o) =>
              o.created_at?.slice(0, 10) === key && o.payment_status === 'paid',
          )
          .reduce((s, o) => s + (Number(o.total) || 0), 0);
        const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
        days.push({ label, value: dayTotal });
      }

      const recentOrders = [...orders]
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, 5);

      return {
        totalRevenue,
        totalOrders: orders.length,
        totalProducts: productsR.count ?? 0,
        pendingOrders,
        revenue7d: days,
        recentOrders,
      };
    },
  });
}

export function useWallet() {
  const { store } = useStoreContext();
  return useQuery({
    queryKey: ['ai-credit-wallet', store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_credit_wallets')
        .select('*')
        .eq('store_id', store!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
