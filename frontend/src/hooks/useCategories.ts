import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useStoreContext } from '../contexts/StoreContext';

export interface DBCategory {
  id: string;
  name: string;
  slug: string | null;
  parent_id: string | null;
  store_id: string | null;
  display_order: number | null;
}

/**
 * Mirrors web `useCategories`. Returns parent categories + a getter for
 * subcategories of a given parent. Categories belong to a store; falls back to
 * an empty list when the table or RLS denies access (mobile users keep working).
 */
export function useCategories() {
  const { store } = useStoreContext();
  const q = useQuery({
    queryKey: ['categories', store?.id],
    enabled: !!store?.id,
    queryFn: async (): Promise<DBCategory[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('id,name,slug,parent_id,store_id,display_order')
        .eq('store_id', store!.id)
        .order('display_order', { ascending: true });
      if (error) {
        // Table or column might not exist in some workspaces; fail soft.
        console.warn('[useCategories] error', error.message);
        return [];
      }
      return (data ?? []) as DBCategory[];
    },
  });

  const all = q.data ?? [];
  const parentCategories = all.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) =>
    all.filter((c) => c.parent_id === parentId);

  return {
    parentCategories,
    getSubcategories,
    loading: q.isLoading,
    error: q.error,
  };
}
