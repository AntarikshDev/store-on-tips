import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useOrderNotifications = (storeId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel(`orders-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const order = payload.new as any;
          toast.success(`🔔 New order received! #${order.order_number}`, {
            duration: 8000,
            description: `${order.customer_name} — ₹${order.total?.toLocaleString('en-IN')}`,
          });
          queryClient.invalidateQueries({ queryKey: ['orders', storeId] });
          queryClient.invalidateQueries({ queryKey: ['order-stats', storeId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);
};
