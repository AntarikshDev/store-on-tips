# Landing Page v2 — Plan

A full marketing rebuild around four pillars: **(1)** a tighter 5-step merchant journey, **(2)** a live "Stores Live" counter sourced from real data, **(3)** a public ThemeForest-style theme marketplace, and **(4)** a Features mega-dropdown showing real merchant-portal screenshots. Plus a complete features catalog ("Now what to sell, where to sell — every solution") covering every shipping product feature.

---

## 1. Hero — Live Store Counter

Replace the static "10,000+ merchants" stat with **real-time numbers** pulled from the backend.

- New edge function `get-public-stats` returns:
  - `stores_live` — count of `stores` where `is_published = true`
  - `products_listed` — count of `products` where `is_active = true`
  - `orders_processed` — count of `orders` (lifetime)
  - `themes_available` — count of `theme_master_projects` where `is_active = true`
- Cached 60s in-memory; called with anon key (no auth needed).
- Hero shows three pulsing-dot live counters: **Stores Live · Products Listed · Orders Processed**, with the existing `Counter` component animating from 0 to fetched value.
- Adds a small "LIVE" badge with a pulsing emerald dot to convey real-time.
- Rest everything will be untouched in the hero section. changing of card with glare should not be disturbed. 

---

## 2. Merchant Journey — Shortened from 7 → 5 Steps

Update `src/lib/merchantJourney.ts` to the new flow that matches actual onboarding:

```text
01 — Sign Up Free
02 — Tell Us About Your Store   (name, language, contact)
03 — Choose Your Category       (with subcategories)
04 — Pick a Theme               (auto-suggested from category)
05 — Your Store Goes Live       (one-tap publish + share)
```

- Keep the existing image+bullets card layout on the landing page; the section heading changes from "in 7 Steps" to **"in 5 Steps"**.
- The 7-step `HowItWorks.tsx` page is kept as a deeper "Behind the scenes" reference and de-emphasized in nav.
- New copy emphasizes "auto-chosen theme" surprise to amaze first-time visitors.

---

## 3. Features Mega-Menu (Header Dropdown)

The "Features" link in the landing nav becomes a **stylish 4-column dropdown** (CSS-only hover/focus, mobile = full-sheet) grouped by pillar, each row paired with a real merchant-portal screenshot thumbnail on hover.

Groups & items (all link to a dedicated `/features/[slug]` page):

- **Sell**: Snap-to-Product AI · Product Variants · Categories & Collections · Inventory & Low-Stock alerts · Digital Products
- **Source**: **Source India** (B2B product sourcing) · Bulk CSV Import · Supplier Khata
- **Design**: Theme Marketplace · Drag-and-Drop Builder · Custom Logo & Banner · Google Fonts · Custom Domain
- **Sell Channels**: Storefront PWA · WhatsApp Share · QR Codes · Blog & SEO · Email Newsletter
- **Operate**: Razorpay / UPI / COD · Shiprocket Shipping · GST Invoices · Coupons & Discounts · Reviews & Ratings
- **Grow**: AI Engagement Report · Analytics Dashboard · Abandoned Cart Recovery · Weekly Digest · Pica2 AI Assistant

Each `/features/[slug]` page uses a shared `FeatureDetailLayout` (hero · "What it does" · annotated screenshots from the merchant portal · "How to enable" CTA → onboarding). Screenshots will be captured fresh from the live portal and stored under `src/assets/features/`.

---

## 4. "Every Solution" Catalog Section

A new landing section titled **"Now what to sell, and where to sell — we have every solution."**

A 3×4 bento grid of capability cards, each with icon + 2-line description + "Learn more →" linking to the features page above. Cards:

1. **Source India** — Find verified manufacturers & wholesale catalogs
2. **AI Product Listings** — Photo → title, description, price, SEO in 5s
3. **50+ Premium Themes** — Industry-tuned, mobile-first, swap anytime
4. **WhatsApp & Instagram** — One-tap share cards with rich OG previews
5. **Custom Domain + SSL** — yourbrand.in in 5 minutes
6. **All Payments** — Razorpay, UPI, COD, direct payouts
7. **Shiprocket Shipping** — 29,000+ pincodes, 17+ couriers
8. **GST-Ready Invoices** — Auto HSN, bulk export for CA
9. **Coupons & Loyalty** — Usage caps, min-order rules
10. **Reviews with Photos** — Verified-purchase badges
11. **Blog + Newsletter** — Built-in CMS, subscriber manager
12. **AI Growth Coach** — Weekly score 0-100 + roadmap

---

## 5. Theme Marketplace — ThemeForest Style

A new public route `**/themes**` (replaces current minimal Themes page for public viewing) modeled on themeforest.net.

Sections:

- **Hero**: search bar + "Browse 50+ themes built for Indian sellers" + filter pills (Fashion, Food, Electronics, Beauty, Handicraft, Services, Books)
- **Top filters bar**: Category · Price (Free / Premium) · Style (Minimal / Bold / Luxury) · Sort (Trending / Newest / Most Sold)
- **Theme grid**: 3-column cards with: preview image, name, category badge, ★ rating (placeholder until reviews), price (Free or ₹500 Crown badge), "Live Preview" + "Use This Theme" CTAs
- **Theme detail page** `/themes/:slug`: full-page hero with large preview, 5 page-by-page screenshots (Home/Category/Product/Cart/Checkout), feature list, "Use this theme" → routes to signup with `?theme=slug` so onboarding auto-selects it
- **Auto-select on signup**: `Onboarding.tsx` reads `?theme=` from URL and pre-fills `selectedThemeId`, jumping straight past the theme step → 5-step flow feels like 4 steps for marketplace visitors (the "amaze" moment).
- Marketplace data pulled from existing `theme_master_projects` table — no schema change required.
- Page is SEO-optimized (per theme: title, meta, OG image from `preview_image`) for future standalone promotion.

---

## 6. Technical Notes

- **New edge function**: `get-public-stats` (`verify_jwt = false`, 60s cache). Uses service role only to `count` published stores/products/orders/themes.
- **New routes** in `src/App.tsx`:
  - `/themes` (public marketplace, lazy)
  - `/themes/:slug` (theme detail)
  - `/features/:slug` (12+ feature detail pages, single dynamic component)
- **New components**:
  - `src/components/landing/LiveStatsBar.tsx`
  - `src/components/landing/FeaturesMegaMenu.tsx`
  - `src/components/landing/EverySolutionGrid.tsx`
  - `src/pages/marketplace/ThemeMarketplace.tsx`
  - `src/pages/marketplace/ThemeDetail.tsx`
  - `src/pages/features/FeatureDetail.tsx` + `featureCatalog.ts` (data)
- **Edits**:
  - `src/lib/merchantJourney.ts` → cut to 5 steps
  - `src/pages/LandingPage.tsx` → swap stats, add mega menu, add solution grid, link new sections, change "7 Steps" → "5 Steps"
  - `src/pages/Onboarding.tsx` → read `?theme=` query and preselect
- **No DB migration** required for v1; feature screenshots will be added to `src/assets/features/` as we capture them (placeholder gradients in interim).

---

## Out of Scope (for this pass)

- Real theme ratings/reviews system (uses static placeholder)
- Building all 25+ feature detail pages with real screenshots (we ship the layout + 6-8 pages with placeholders; the rest reuse the layout with copy until screenshots are captured)
- Theme purchase flow changes (existing premium-theme purchase keeps working)