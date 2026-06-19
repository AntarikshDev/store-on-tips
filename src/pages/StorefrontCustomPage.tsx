import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import SEOHead from "@/components/storefront/SEOHead";
import { CustomPageSections } from "@/components/storefront/CustomPageSections";
import { THEME_TEMPLATES } from "@/lib/themes";
import { usePublicCustomPage } from "@/hooks/useCustomPages";

export default function StorefrontCustomPage() {
  const { slug, pageSlug } = useParams();

  const { data: store, isLoading: loadingStore } = useQuery({
    queryKey: ["storefront-store", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug!)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: page, isLoading: loadingPage } = usePublicCustomPage(store?.id, pageSlug);

  if (loadingStore || loadingPage) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  if (!store) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Store not found.</div>;
  }
  if (!page) {
    return (
      <StorefrontLayout store={store as any}>
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">Page not found</h1>
          <p className="text-sm text-muted-foreground mt-2">This page doesn't exist or hasn't been published yet.</p>
        </div>
      </StorefrontLayout>
    );
  }

  const themeData: any = (store as any).theme || {};
  const base = THEME_TEMPLATES.find((t) => t.id === themeData?.name) || THEME_TEMPLATES[0];
  const theme = {
    colors: { ...base.colors, ...(themeData.colors || {}) },
    fonts: themeData.fonts || base.fonts,
    borderRadius: themeData.borderRadius ?? base.borderRadius,
  };

  const seo = page.seo || {};
  return (
    <StorefrontLayout store={store as any}>
      <SEOHead
        title={seo.meta_title || `${page.title} · ${(store as any).name}`}
        description={seo.meta_description || page.description || ""}
        url={`${window.location.origin}/store/${slug}/p/${page.slug}`}
      />
      <CustomPageSections sections={page.sections || []} theme={theme} storeSlug={slug} />
    </StorefrontLayout>
  );
}
