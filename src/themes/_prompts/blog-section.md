# AI Prompt — Generate a Blog/Journal section for a Pic to Cart theme

Use this prompt when asking an AI model (Lovable AI Gateway, e.g. `google/gemini-3-flash-preview`) to scaffold a blog section component for a new theme.

## System

You are generating a single React/TSX section component for a Pic to Cart storefront theme. Themes live under `src/themes/{themeId}/sections/`. Components must be presentation-only — no data fetching, no Supabase calls. They receive blog posts as props (the storefront page passes them in from `useStorefrontBundle().blog_recent`).

## Hard requirements

1. **Props contract** — accept exactly:
   ```ts
   interface Props {
     posts: Array<{
       id: string;
       title: string;
       slug: string;
       cover_image: string | null;
       seo_description: string | null;
       created_at: string;
     }>;
     storeSlug: string;
     basePath?: string; // pass through; defaults to `/store/${storeSlug}`
   }
   ```
2. **Empty state** — return `null` if `posts.length === 0`. Never render an empty card grid.
3. **Links** — use plain `<a href="...">`, not `react-router` `<Link>` (themes must be portable to remixed Lovable projects). Format: `${basePath ?? '/store/' + storeSlug}/blog/${post.slug}`.
4. **Tokens** — import the theme's `tokens.ts` and use `tokens.colors`, `tokens.fonts`, `tokens.radius`. No hard-coded hex except for neutral overlays.
5. **Show max 3 posts** with a "View all" link to `${root}/blog`.
6. **Image fallback** — if `cover_image` is null, show a tasteful gradient placeholder using theme tokens.
7. **Date** — format with `new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })`.
8. **Responsive** — single column on mobile, 3 columns on `md:`.
9. **Accessibility** — semantic `<section id="blog">`, descriptive `alt` on images, focus-visible states.
10. **No external state** — no `useState`, no `useEffect`, no React Query.

## Style guidance (vary per theme)

- **Bazaar** (Indian artisan): Cormorant Garamond serif, kumkum red accents, tracking-wide uppercase kickers, paper background.
- **Marketplace** (modern bold): sans bold headings, slate/orange palette, tighter cards.
- **Atelier** (editorial): generous whitespace, large serif, muted palette.
- **Pulse** (vibrant): rounded cards, gradient overlays, neon accents.

## Output format

Return ONLY the contents of one `.tsx` file. Start with imports, end with a named export. No markdown fences, no commentary.

## Example call (Lovable AI gateway)

```ts
const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'google/gemini-3-flash-preview',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_ABOVE },
      { role: 'user', content: `Generate the BlogStrip section for theme "${themeId}". Use the ${themeId} aesthetic described in the style guide. Use these tokens:\n${JSON.stringify(themeTokens, null, 2)}` },
    ],
  }),
});
```

The reference implementation is `src/themes/bazaar/sections/BlogStrip.tsx`.
