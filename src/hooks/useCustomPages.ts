import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CustomPage = {
  id: string;
  store_id: string;
  slug: string;
  title: string;
  description: string | null;
  brief: string | null;
  status: "draft" | "published";
  sections: any[];
  seo: { meta_title?: string; meta_description?: string } | any;
  uploaded_images: string[];
  theme_snapshot: any;
  style_hint: string | null;
  show_in_nav: boolean;
  nav_order: number;
  credits_spent: number;
  ai_model: string | null;
  version: number;
  history: any[];
  created_at: string;
  updated_at: string;
};

export function useCustomPages(storeId?: string) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["custom-pages", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("store_custom_pages")
        .select("*")
        .eq("store_id", storeId)
        .order("nav_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CustomPage[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: { title: string; slug: string; description: string; brief: string; uploaded_images: string[]; style_hint?: string }) => {
      const { data, error } = await (supabase as any)
        .from("store_custom_pages")
        .insert({
          store_id: storeId,
          title: input.title,
          slug: input.slug,
          description: input.description,
          brief: input.brief,
          uploaded_images: input.uploaded_images,
          style_hint: input.style_hint || "match_theme",
          status: "draft",
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as CustomPage;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-pages", storeId] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CustomPage> }) => {
      const { error } = await (supabase as any).from("store_custom_pages").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-pages", storeId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("store_custom_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-pages", storeId] }),
  });

  const generate = useMutation({
    mutationFn: async ({ page_id, regenerate }: { page_id: string; regenerate?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("generate-custom-page", {
        body: { page_id, regenerate: !!regenerate },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-pages", storeId] }),
  });

  return { list, create, update, remove, generate };
}

export function useCreditEstimate() {
  return useQuery({
    queryKey: ["custom-page-credit-cost"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ai_action_costs")
        .select("action_key, credits")
        .in("action_key", ["generate_custom_page", "regenerate_custom_page_section"]);
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => (map[r.action_key] = r.credits));
      return {
        generate: map.generate_custom_page ?? 25,
        regenerate: map.regenerate_custom_page_section ?? 8,
      };
    },
  });
}

export function useWalletBalance(storeId?: string) {
  return useQuery({
    queryKey: ["ai-wallet", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("ai_credit_wallets")
        .select("balance")
        .eq("store_id", storeId)
        .maybeSingle();
      return data?.balance ?? 0;
    },
  });
}

export function usePublicCustomPage(storeId: string | undefined, pageSlug: string | undefined) {
  return useQuery({
    queryKey: ["public-custom-page", storeId, pageSlug],
    enabled: !!storeId && !!pageSlug,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("store_custom_pages")
        .select("*")
        .eq("store_id", storeId)
        .eq("slug", pageSlug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data as CustomPage | null;
    },
  });
}

export function usePublicNavCustomPages(storeId: string | undefined) {
  return useQuery({
    queryKey: ["public-nav-custom-pages", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("store_custom_pages")
        .select("id, slug, title, nav_order")
        .eq("store_id", storeId)
        .eq("status", "published")
        .eq("show_in_nav", true)
        .order("nav_order", { ascending: true });
      if (error) throw error;
      return (data || []) as { id: string; slug: string; title: string; nav_order: number }[];
    },
  });
}
