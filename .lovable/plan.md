

# Phase 11: Enterprise Theme Marketplace — AI-Generated Full-Page Themes with Visual Builder

## The Vision

Transform the current "color palette picker" into a **WordPress/Shopify-class theme marketplace** where Super Admins generate complete multi-page themes using AI (with photos, animations, layouts), sell them at custom prices, and sellers can further customize every element via a visual builder. Every theme generation tracks AI cost for ROI analysis.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    SUPER ADMIN                          │
│  "Generate Fashion Theme" → AI generates 5-page JSON   │
│  with hero images, section layouts, animations, fonts   │
│  → Set price ₹299-₹2999 → Publish to marketplace       │
│  → Track cost vs revenue per theme                      │
│                                                         │
│                    SELLER                               │
│  Browse marketplace → Preview → Purchase → Apply        │
│  → Customize: drag sections, adjust margins, swap       │
│    images, change animations, edit cards                │
└─────────────────────────────────────────────────────────┘

┌───────────────────────────────────────┐
│         Database: theme_packs        │
│  id, name, category, description,    │
│  thumbnail, pages_json, animations,  │
│  price, ai_cost, sales_count,        │
│  created_by (admin), is_published    │
└───────────────────────────────────────┘
```

---

## What We Will Build

### 1. Database — `theme_packs` table

New table to store complete, multi-page theme packages (separate from the existing color-only `ThemeTemplate` in `lib/themes.ts`):

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | |
| name | text | "Luxe Fashion", "Organic Food" |
| category | text | fashion, food, electronics, beauty, general |
| description | text | Marketing copy |
| thumbnail | text | Preview screenshot URL |
| pages | jsonb | 5-page structure (home, shop, about, blog, contact) |
| theme_config | jsonb | colors, fonts, borderRadius, animations |
| price | integer | In INR (0 = free) |
| ai_generation_cost | numeric | Token cost in ₹ tracked per generation |
| sales_count | integer default 0 | How many sellers bought it |
| is_published | boolean | Visible in marketplace |
| created_by | uuid | Admin user_id |
| created_at | timestamptz | |

Also add a `theme_purchases` table to track who bought what:

| Column | Type |
|--------|------|
| id | uuid PK |
| store_id | uuid FK stores |
| theme_pack_id | uuid FK theme_packs |
| purchased_at | timestamptz |

RLS: theme_packs readable by all authenticated users, writable only by admins. theme_purchases scoped to store owner.

### 2. AI Theme Generator — Edge Function `generate-theme-pack`

Super Admin types a category name (e.g., "Luxury Fashion") and AI generates a complete theme pack:

- **5 pages** defined as section arrays: Home (hero + featured + categories + testimonials + newsletter), Shop, About, Blog, Contact
- **Color palette** with 6 harmonious colors
- **Font pairing** from available Google Fonts
- **Animation presets** per section (fade-in, slide-up, parallax, scale-in, none)
- **Layout variants** per section (full-width, split, grid-2x2, grid-3, masonry)
- **AI-generated images** using Lovable AI image generation for hero banners, category cards, and about page photos (4-6 images per theme)

**Token optimization**: The AI returns a structured JSON via tool calling. Images are generated in a second pass only for sections that need them. Generated image URLs are stored in the theme_pack so they're reused across all sellers who purchase it — zero re-generation cost.

**Cost tracking**: Each API call logs input/output tokens. The edge function calculates approximate cost (based on model pricing) and stores it in `ai_generation_cost`.

### 3. Super Admin Theme Builder — `/admin/themes` overhaul

Replace the current static theme list with a full management dashboard:

- **"Generate with AI" button** — Modal with category input + optional style hints → progress indicator showing generation steps → preview generated theme → edit/adjust → publish
- **Theme editor** — Visual builder where admin can:
  - Reorder sections via drag-and-drop (existing @dnd-kit)
  - Adjust margins, padding, gaps per section
  - Choose animation per section from presets: `fade-in`, `slide-up`, `slide-in-left`, `scale-in`, `parallax`, `none`
  - Choose layout per section: `full-width`, `split-50-50`, `split-60-40`, `grid-2`, `grid-3`, `grid-4`, `masonry`
  - Swap AI-generated images with uploads
  - Edit all text content
- **Pricing & analytics table** — Per theme: price, AI cost, sales count, revenue, ROI percentage
- **Publish/unpublish toggle**

### 4. Theme Marketplace — Seller-facing in Store Design

Add a new tab "Theme Packs" in `/store-design` alongside existing Themes/Customize/Homepage tabs:

- **Grid of theme pack cards** with thumbnail, name, category badge, price, "Preview" and "Purchase/Apply" buttons
- **Full-page preview modal** — Shows all 5 pages rendered with the theme's actual colors, fonts, animations, and images in a scrollable preview
- **Purchase flow** — For now, mark as purchased (payment integration placeholder); update `theme_purchases` and `sales_count`
- **Apply** — Copies the theme pack's `pages` JSON into the store's `settings.homepage_sections`, applies `theme_config` to `store.theme`, and sets header/footer configs

### 5. Visual Section Customizer — Seller Post-Purchase

After applying a theme pack, sellers can customize via enhanced HomepageBuilder:

- **Per-section controls** added to existing SortableSection:
  - Animation dropdown (fade-in, slide-up, parallax, scale-in, none)
  - Layout dropdown (full-width, split, grid variants)
  - Margin/padding sliders (top, bottom, left, right)
  - Background color/image override
- **Card style selector** for product grids: simple, overlay, bordered, floating (already in ThemeTemplate)
- All customizations save to `store.settings` as before — no new tables needed

### 6. Storefront Animation Renderer

Update `Storefront.tsx` `renderSection` to read animation config from each section and apply CSS classes:

- `fade-in` → Intersection Observer + `animate-fade-in` class
- `slide-up` → IO + translateY transition
- `parallax` → `background-attachment: fixed` + transform on scroll
- `scale-in` → IO + `animate-scale-in`

Use a single `useIntersectionObserver` hook to trigger animations when sections scroll into view. No heavy animation libraries needed — pure CSS transitions from existing Tailwind keyframes.

### 7. Cost Matrix Dashboard — Admin Revenue tab enhancement

Add a "Theme Economics" section to `/admin/revenue`:

- Table: Theme Name | AI Cost | Price | Units Sold | Revenue | Profit | ROI%
- Summary cards: Total themes generated, Total AI spend, Total theme revenue, Average ROI

---

## Implementation Order (8 steps)

1. **Migration**: Create `theme_packs` and `theme_purchases` tables with RLS
2. **Edge function**: `generate-theme-pack` — AI generates 5-page JSON + images, tracks cost
3. **Admin Theme Builder**: Overhaul `/admin/themes` with AI generator, editor, pricing table
4. **Theme Marketplace UI**: New "Theme Packs" tab in seller's Store Design page
5. **Enhanced HomepageBuilder**: Add animation, layout, margin controls per section
6. **Storefront animation renderer**: Intersection Observer + CSS animations on sections
7. **Cost matrix**: Theme economics table in admin revenue dashboard
8. **Preview modal**: Full-page scrollable theme preview for sellers

---

## Section & Animation Schema (stored in pages JSON)

```text
{
  "pages": {
    "home": [
      {
        "type": "hero",
        "layout": "full-width",
        "animation": "parallax",
        "image": "https://...ai-generated.png",
        "title": "Elegance Redefined",
        "subtitle": "Discover luxury fashion",
        "margins": { "top": 0, "bottom": 0 },
        "padding": { "x": 0, "y": 80 },
        "height": "large"
      },
      {
        "type": "featured_products",
        "layout": "grid-4",
        "animation": "fade-in",
        "cardStyle": "overlay",
        "title": "Trending Now"
      },
      ...
    ],
    "about": [...],
    "blog": [...],
    "contact": [...]
  }
}
```

**Layout options**: `full-width`, `split-50-50`, `split-60-40`, `grid-2`, `grid-3`, `grid-4`, `masonry`

**Animation options**: `none`, `fade-in`, `slide-up`, `slide-in-left`, `slide-in-right`, `scale-in`, `parallax`

---

## Token Optimization Strategy

- AI generates **structure + text only** in the first call (~2K tokens output) using tool calling for structured JSON
- Images generated separately using Lovable AI image model (1 call per image, ~4-6 per theme)
- Generated themes are **stored once, sold many times** — zero marginal AI cost per sale
- Admin can duplicate an existing theme pack and tweak it instead of regenerating from scratch
- Estimated cost per full theme generation: ~₹15-25 (text) + ₹30-50 (images) = **₹45-75 total**, sellable at ₹499-₹2999

---

## Technical Details

- **No new npm packages** — uses existing @dnd-kit, Tailwind animations, Intersection Observer API
- **Theme packs vs ThemeTemplates**: Existing `lib/themes.ts` ThemeTemplates remain for color-only themes. Theme packs are a superset stored in DB, containing full page structures + images + animations
- **RLS**: `theme_packs` — SELECT for all authenticated, INSERT/UPDATE/DELETE restricted to admin role via `has_role()`. `theme_purchases` — INSERT/SELECT for store owners only
- **Storage**: AI-generated images uploaded to existing `product-images` bucket under `themes/` prefix

