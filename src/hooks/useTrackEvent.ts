import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'pic_session_id';

const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  let s = sessionStorage.getItem(SESSION_KEY);
  if (!s) {
    s = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, s);
  }
  return s;
};

export type AnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'checkout_start'
  | 'purchase'
  | 'signup'
  | 'publish';

interface TrackPayload {
  store_id: string;
  event_type: AnalyticsEventType;
  product_id?: string;
  order_id?: string;
  value?: number;
  metadata?: Record<string, any>;
}

export const useTrackEvent = () => {
  return useCallback(async (payload: TrackPayload) => {
    if (!payload.store_id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('analytics_events').insert({
        store_id: payload.store_id,
        event_type: payload.event_type,
        product_id: payload.product_id ?? null,
        order_id: payload.order_id ?? null,
        user_id: user?.id ?? null,
        session_id: getSessionId(),
        path: typeof window !== 'undefined' ? window.location.pathname : null,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
        value: payload.value ?? 0,
        metadata: payload.metadata ?? {},
      });
    } catch {
      // silent — analytics must never break UX
    }
  }, []);
};
