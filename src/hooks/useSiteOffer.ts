import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteOffer {
  id: string;
  store_id: string;
  enabled: boolean;
  percent_off: number;
  starts_at: string | null;
  ends_at: string | null;
  label: string | null;
  banner_text: string | null;
  banner_bg_color: string | null;
  banner_text_color: string | null;
  show_banner: boolean;
}

export interface PlanOffer {
  id: string;
  enabled: boolean;
  percent_off: number;
  starts_at: string | null;
  ends_at: string | null;
  label: string | null;
  banner_text: string | null;
  banner_bg_color: string | null;
  banner_text_color: string | null;
  show_banner: boolean;
  applies_to_monthly: boolean;
  applies_to_annual: boolean;
}

const isActive = (o: { enabled: boolean; starts_at: string | null; ends_at: string | null } | null | undefined) => {
  if (!o || !o.enabled) return false;
  const now = Date.now();
  if (o.starts_at && new Date(o.starts_at).getTime() > now) return false;
  if (o.ends_at && new Date(o.ends_at).getTime() <= now) return false;
  return true;
};

export const useStoreSiteOffer = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ['store-site-offer', storeId],
    enabled: !!storeId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_site_offers' as any)
        .select('*')
        .eq('store_id', storeId!)
        .maybeSingle();
      if (error && (error as any).code !== 'PGRST116') throw error;
      return (data as unknown as SiteOffer) || null;
    },
  });
};

export const useActiveStoreOfferPct = (storeId: string | undefined) => {
  const { data } = useStoreSiteOffer(storeId);
  return isActive(data) ? Number(data!.percent_off) : 0;
};

export const usePlanOffer = () => {
  return useQuery({
    queryKey: ['platform-plan-offer'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_plan_offers' as any)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && (error as any).code !== 'PGRST116') throw error;
      return (data as unknown as PlanOffer) || null;
    },
  });
};

export const useActivePlanOfferPct = (cycle: 'monthly' | 'annual') => {
  const { data } = usePlanOffer();
  if (!isActive(data)) return 0;
  if (cycle === 'monthly' && !data!.applies_to_monthly) return 0;
  if (cycle === 'annual' && !data!.applies_to_annual) return 0;
  return Number(data!.percent_off);
};

export const isOfferActive = isActive;

/**
 * Apply a site-wide offer to a product price.
 * Rule: use whichever is greater — existing product discount OR the site offer.
 * Returns { price, compareAt } where price is the new effective and compareAt
 * is the original list price (always > price when discounted).
 */
export const applyOfferToProduct = <T extends { price: number | string; compare_at_price?: number | string | null }>(
  product: T,
  offerPct: number,
): T => {
  if (!offerPct || offerPct <= 0) return product;
  const price = Number(product.price);
  const compareAt = product.compare_at_price ? Number(product.compare_at_price) : null;
  const base = compareAt && compareAt > price ? compareAt : price;
  const existingPct = compareAt && compareAt > price ? ((compareAt - price) / compareAt) * 100 : 0;
  const finalPct = Math.max(existingPct, offerPct);
  const newPrice = Math.round(base * (1 - finalPct / 100) * 100) / 100;
  return { ...product, price: newPrice, compare_at_price: base } as T;
};
