import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThemePreview = () => {
  const [searchParams] = useSearchParams();
  const themeId = searchParams.get('theme');
  const [pack, setPack] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!themeId) return;
    supabase
      .from('theme_packs')
      .select('*')
      .eq('id', themeId)
      .single()
      .then(({ data }) => {
        setPack(data);
        setLoading(false);
      });
  }, [themeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold">Theme not found</h1>
        <p className="text-muted-foreground">This theme pack doesn't exist.</p>
        <Link to="/" className="text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  const config = pack.theme_config || {};
  const colors = config.colors || {};
  const fonts = config.fonts || {};
  const pages = pack.pages || {};
  const homeSections = pages.home || [];
  const borderRadius = config.borderRadius || 12;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background, color: colors.text }}>
      {/* Admin bar */}
      <div className="sticky top-0 z-50 bg-background border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.close()} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <span className="text-sm font-semibold">{pack.name}</span>
          <span className="text-xs text-muted-foreground capitalize">— {pack.category} theme</span>
        </div>
        <span className="text-xs text-muted-foreground">Preview Mode · ₹{pack.price}</span>
      </div>

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b" style={{ backgroundColor: colors.card, borderColor: colors.secondary }}>
        <span className="text-lg font-bold" style={{ fontFamily: fonts.heading }}>{pack.name} Store</span>
        <nav className="flex gap-6 text-sm" style={{ fontFamily: fonts.body }}>
          {['Home', 'Shop', 'About', 'Blog', 'Contact'].map(item => (
            <span key={item} className="cursor-default opacity-80 hover:opacity-100 transition-opacity">{item}</span>
          ))}
        </nav>
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: colors.secondary }}>🔍</div>
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: colors.secondary }}>🛒</div>
        </div>
      </header>

      {/* Render home sections */}
      {homeSections.map((section: any, i: number) => {
        if (section.type === 'hero') {
          return (
            <div key={i} className="relative h-[400px] flex items-center justify-center overflow-hidden" style={{ backgroundColor: colors.primary }}>
              {section.image && <img src={section.image} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 text-center px-6 max-w-2xl">
                <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: fonts.heading }}>{section.title || 'Welcome to Our Store'}</h1>
                {section.subtitle && <p className="text-lg text-white/80 mb-6">{section.subtitle}</p>}
                <button className="px-8 py-3 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: colors.primary, borderRadius: `${borderRadius / 2}px` }}>
                  Shop Now
                </button>
              </div>
            </div>
          );
        }

        if (section.type === 'featured_products') {
          return (
            <div key={i} className="py-12 px-6 max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: fonts.heading }}>{section.title || 'Featured Products'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="overflow-hidden" style={{ backgroundColor: colors.card, borderRadius: `${borderRadius}px`, border: `1px solid ${colors.secondary}` }}>
                    <div className="h-48" style={{ backgroundColor: colors.secondary }} />
                    <div className="p-4 space-y-2">
                      <div className="h-4 rounded" style={{ backgroundColor: colors.secondary, width: '75%' }} />
                      <div className="h-3 rounded" style={{ backgroundColor: colors.primary, width: '35%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (section.type === 'text_block') {
          return (
            <div key={i} className="py-12 px-6 text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: fonts.heading }}>{section.title}</h2>
              {section.subtitle && <p className="opacity-60" style={{ fontFamily: fonts.body }}>{section.subtitle}</p>}
            </div>
          );
        }

        if (section.type === 'newsletter') {
          return (
            <div key={i} className="py-12 px-6 text-center" style={{ backgroundColor: colors.secondary }}>
              <h2 className="text-xl font-bold mb-3" style={{ fontFamily: fonts.heading }}>{section.title || 'Stay Updated'}</h2>
              <div className="flex gap-2 max-w-md mx-auto">
                <input className="flex-1 px-4 py-2.5 rounded-lg border text-sm" placeholder="Enter your email" style={{ borderColor: colors.text + '20', backgroundColor: colors.card, borderRadius: `${borderRadius / 2}px` }} readOnly />
                <button className="px-6 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: colors.primary, borderRadius: `${borderRadius / 2}px` }}>Subscribe</button>
              </div>
            </div>
          );
        }

        return (
          <div key={i} className="py-8 px-6 text-center opacity-40">
            <p className="text-sm capitalize">[{section.type?.replace(/_/g, ' ')}]</p>
          </div>
        );
      })}

      {/* Footer */}
      <footer className="py-8 px-6 border-t text-center text-sm opacity-50" style={{ backgroundColor: colors.card, borderColor: colors.secondary }}>
        © 2026 {pack.name} Store. All rights reserved.
      </footer>
    </div>
  );
};

export default ThemePreview;
