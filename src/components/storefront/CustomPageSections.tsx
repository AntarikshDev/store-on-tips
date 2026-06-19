import { Link } from "react-router-dom";
import { Sparkle, Shield, Heart, Leaf, Zap, Star } from "lucide-react";

const ICONS: Record<string, any> = { sparkle: Sparkle, shield: Shield, heart: Heart, leaf: Leaf, bolt: Zap, star: Star };

type Theme = {
  colors: Record<string, string>;
  fonts: { heading: string; body: string };
  borderRadius?: number;
};

export function CustomPageSections({
  sections,
  theme,
  storeSlug,
}: {
  sections: any[];
  theme: Theme;
  storeSlug?: string;
}) {
  const colors = theme.colors || {};
  const fonts = theme.fonts || { heading: "inherit", body: "inherit" };
  const radius = theme.borderRadius ?? 12;
  const primary = colors.primary || "#111";
  const accent = colors.accent || primary;
  const text = colors.text || "#0a0a0a";
  const bg = colors.background || "#fff";
  const card = colors.card || "#fff";
  const secondary = colors.secondary || "#f3f3f3";

  const resolveHref = (href?: string) =>
    !href ? "#" : href.startsWith("/store/") ? href : href.startsWith("/") && storeSlug ? `/store/${storeSlug}${href}` : href;

  return (
    <div style={{ backgroundColor: bg, color: text, fontFamily: fonts.body }}>
      {sections.map((s, i) => {
        switch (s?.type) {
          case "hero":
            return (
              <section key={i} className="relative overflow-hidden">
                {s.image_url && (
                  <div className="absolute inset-0">
                    <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}cc, ${accent}99)` }} />
                  </div>
                )}
                {!s.image_url && (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }} />
                )}
                <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-36 text-white">
                  {s.eyebrow && <p className="text-xs uppercase tracking-[0.25em] opacity-80 mb-4">{s.eyebrow}</p>}
                  <h1 className="text-4xl md:text-6xl font-bold leading-tight max-w-3xl" style={{ fontFamily: fonts.heading }}>
                    {s.heading}
                  </h1>
                  {s.subheading && <p className="mt-5 text-lg md:text-xl opacity-90 max-w-2xl">{s.subheading}</p>}
                  {s.cta?.label && (
                    <Link
                      to={resolveHref(s.cta.href)}
                      className="inline-flex mt-8 px-6 py-3 text-sm font-semibold bg-white transition-transform hover:scale-[1.02]"
                      style={{ color: primary, borderRadius: radius }}
                    >
                      {s.cta.label} →
                    </Link>
                  )}
                </div>
              </section>
            );
          case "richtext":
            return (
              <section key={i} className="max-w-3xl mx-auto px-6 py-16 md:py-24">
                {s.heading && (
                  <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: fonts.heading }}>
                    {s.heading}
                  </h2>
                )}
                <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap opacity-90">{s.body}</p>
              </section>
            );
          case "stats":
            return (
              <section key={i} className="max-w-6xl mx-auto px-6 py-16">
                {s.heading && (
                  <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center" style={{ fontFamily: fonts.heading }}>
                    {s.heading}
                  </h2>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {(s.items || []).map((it: any, k: number) => (
                    <div key={k} className="text-center p-6" style={{ backgroundColor: secondary, borderRadius: radius }}>
                      <div className="text-3xl md:text-4xl font-bold" style={{ color: primary, fontFamily: fonts.heading }}>
                        {it.value}
                      </div>
                      <div className="text-sm opacity-70 mt-1">{it.label}</div>
                    </div>
                  ))}
                </div>
              </section>
            );
          case "feature_grid":
            return (
              <section key={i} className="max-w-6xl mx-auto px-6 py-16">
                {s.heading && (
                  <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center" style={{ fontFamily: fonts.heading }}>
                    {s.heading}
                  </h2>
                )}
                <div className="grid md:grid-cols-3 gap-5">
                  {(s.items || []).map((it: any, k: number) => {
                    const Icon = ICONS[it.icon] || Sparkle;
                    return (
                      <div key={k} className="p-6 border" style={{ borderColor: secondary, borderRadius: radius, backgroundColor: card }}>
                        <div className="inline-flex h-10 w-10 items-center justify-center mb-4" style={{ backgroundColor: primary + "1a", color: primary, borderRadius: radius / 2 }}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: fonts.heading }}>
                          {it.title}
                        </h3>
                        <p className="text-sm opacity-75 leading-relaxed">{it.body}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          case "team":
            return (
              <section key={i} className="max-w-6xl mx-auto px-6 py-16">
                {s.heading && (
                  <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center" style={{ fontFamily: fonts.heading }}>
                    {s.heading}
                  </h2>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {(s.members || []).map((m: any, k: number) => (
                    <div key={k} className="text-center">
                      <div className="aspect-square overflow-hidden mb-3 mx-auto" style={{ borderRadius: radius, backgroundColor: secondary }}>
                        {m.image_url && <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="font-semibold" style={{ fontFamily: fonts.heading }}>
                        {m.name}
                      </div>
                      {m.role && <div className="text-xs opacity-60 mt-0.5">{m.role}</div>}
                      {m.bio && <p className="text-xs opacity-75 mt-2 leading-relaxed">{m.bio}</p>}
                    </div>
                  ))}
                </div>
              </section>
            );
          case "timeline":
            return (
              <section key={i} className="max-w-3xl mx-auto px-6 py-16">
                {s.heading && (
                  <h2 className="text-2xl md:text-3xl font-bold mb-10" style={{ fontFamily: fonts.heading }}>
                    {s.heading}
                  </h2>
                )}
                <div className="space-y-8 border-l-2 pl-6" style={{ borderColor: primary }}>
                  {(s.items || []).map((it: any, k: number) => (
                    <div key={k} className="relative">
                      <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full" style={{ backgroundColor: primary }} />
                      {it.year && <div className="text-xs uppercase tracking-wider opacity-60">{it.year}</div>}
                      <h3 className="text-lg font-semibold mt-1" style={{ fontFamily: fonts.heading }}>
                        {it.title}
                      </h3>
                      {it.body && <p className="text-sm opacity-75 mt-1 leading-relaxed">{it.body}</p>}
                    </div>
                  ))}
                </div>
              </section>
            );
          case "gallery":
            return (
              <section key={i} className="max-w-6xl mx-auto px-6 py-16">
                {s.heading && (
                  <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ fontFamily: fonts.heading }}>
                    {s.heading}
                  </h2>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(s.images || []).map((g: any, k: number) => (
                    <figure key={k} className="overflow-hidden" style={{ borderRadius: radius, backgroundColor: secondary }}>
                      <img src={g.url} alt={g.caption || ""} className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-500" />
                      {g.caption && <figcaption className="text-xs opacity-60 p-2">{g.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            );
          case "quote":
            return (
              <section key={i} className="max-w-3xl mx-auto px-6 py-16 text-center">
                <p className="text-2xl md:text-3xl font-medium italic leading-snug" style={{ fontFamily: fonts.heading }}>
                  "{s.quote}"
                </p>
                {(s.author || s.role) && (
                  <p className="text-sm opacity-70 mt-4">
                    — {s.author}
                    {s.role ? `, ${s.role}` : ""}
                  </p>
                )}
              </section>
            );
          case "faq":
            return (
              <section key={i} className="max-w-3xl mx-auto px-6 py-16">
                {s.heading && (
                  <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ fontFamily: fonts.heading }}>
                    {s.heading}
                  </h2>
                )}
                <div className="space-y-3">
                  {(s.items || []).map((it: any, k: number) => (
                    <details key={k} className="group p-4 border" style={{ borderColor: secondary, borderRadius: radius, backgroundColor: card }}>
                      <summary className="cursor-pointer font-semibold flex items-center justify-between" style={{ fontFamily: fonts.heading }}>
                        {it.q}
                        <span className="ml-4 transition-transform group-open:rotate-45" style={{ color: primary }}>+</span>
                      </summary>
                      <p className="mt-3 text-sm opacity-80 leading-relaxed">{it.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          case "cta":
            return (
              <section key={i} className="max-w-5xl mx-auto px-6 py-16">
                <div className="p-10 md:p-14 text-center text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})`, borderRadius: radius * 1.5 }}>
                  <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: fonts.heading }}>
                    {s.heading}
                  </h2>
                  {s.body && <p className="mt-3 opacity-90 max-w-xl mx-auto">{s.body}</p>}
                  {s.button?.label && (
                    <Link
                      to={resolveHref(s.button.href)}
                      className="inline-flex mt-7 px-7 py-3 bg-white font-semibold hover:scale-[1.02] transition-transform"
                      style={{ color: primary, borderRadius: radius }}
                    >
                      {s.button.label} →
                    </Link>
                  )}
                </div>
              </section>
            );
          case "split_image": {
            const left = s.image_side !== "right";
            return (
              <section key={i} className="max-w-6xl mx-auto px-6 py-16">
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  {left && s.image_url && (
                    <div className="aspect-[4/3] overflow-hidden" style={{ borderRadius: radius, backgroundColor: secondary }}>
                      <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: fonts.heading }}>
                      {s.heading}
                    </h2>
                    <p className="opacity-80 leading-relaxed whitespace-pre-wrap">{s.body}</p>
                  </div>
                  {!left && s.image_url && (
                    <div className="aspect-[4/3] overflow-hidden" style={{ borderRadius: radius, backgroundColor: secondary }}>
                      <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </section>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
