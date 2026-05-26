# Product Sourcing Hub — "SourceIndia"

A credit-powered sourcing engine that lets new merchants discover viral wholesale products from IndiaMART, TradeIndia, Meesho Supply, Alibaba IN, and onboard verified suppliers — then import to their store with one click. Optional dropshipping fulfillment when supplier APIs allow.

## Goals

- Solve the "what do I sell?" problem for day-1 merchants
- Make sourcing a habit (weekly viral feed) → drives retention
- New revenue: credits per search + future commission on dropship orders + supplier subscriptions

---

## Phase 1 — Sourcing Engine (Merchant side)

### 1.1 New page: `/sourcing` (sidebar entry "Source Products" with 🔥 badge)

Sections:

- **Viral This Week** — AI-curated feed (auto-refreshed Mondays). Cards show product image, ₹ wholesale range, MOQ, supplier rating, "trend score" (▲ 312% this week), category, margin estimate.
- **Search** — natural-language search ("ceramic mugs under ₹80 MOQ 50"). Powered by Lovable AI (Gemini 2.5 Flash) + Firecrawl scraping IndiaMART/TradeIndia. Filters: category, price, MOQ, location, GST verified, rating ≥ 4.
- **Categories grid** — Beauty, Home, Fashion, Kitchen, Festive, Tech, Toys, Wellness (mirrors trending Indian D2C).
- **Saved / Wishlist** — products bookmarked for later.
- **Imported** — products already pushed to store with sync status.

### 1.2 Product Detail Drawer

Image carousel, full description, specs table, price tiers, MOQ, supplier card (name, city, GST verified ✓, years active, rating, response time), shipping zones, sample availability, similar products, AI-generated "Why this sells" insight, suggested retail price + margin calc.

Actions:

- **Add to my store** (one-click) — opens prefilled product form (title, AI-rewritten description, images, suggested category, suggested price with margin). Saves to `products` table.
- **Request sample** — sends inquiry via supplier_inquiries.
- **Enable dropshipping** (if supplier has API) — links product to supplier; orders auto-forwarded.
- **Contact supplier** — opens chat thread.

### 1.3 Credit costs (added to `ai_action_costs`)

- `sourcing_search` — 2 credits per search
- `sourcing_deep_scrape` — 5 credits (full supplier verification + competitor pricing)
- `sourcing_import` — 1 credit per import (covers AI rewrite of title/desc/SEO)
- `sourcing_viral_feed` — free (loaded from cached weekly run)

### 1.4 Weekly Viral Feed (cron)

Edge function `sourcing-viral-cron` runs Mon 6am IST:

- Scrapes IndiaMART top-trending, Meesho Supply bestsellers, Google Trends India shopping
- Uses Gemini to cluster + dedupe + score "virality"
- Writes to `sourcing_viral_products` (shared cache across all merchants → cheap)

---

## Phase 2 — Dropshipping Layer

### 2.1 Supplier API adapter

Pluggable adapter pattern. Day 1 supports: Manual (email), Shiprocket-Wholesale, generic Webhook. Each linked product stores `supplier_id`, `supplier_sku`, `dropship_mode`.

### 2.2 Order flow

When merchant order arrives for a dropship product:

- Edge function `dropship-forward` posts to supplier API with customer address
- Records `dropship_orders` row (status, tracking, supplier_invoice)
- Merchant dashboard shows "Dropship Queue" tile with statuses

### 2.3 Address & defaults

Settings → Sourcing → Default shipping origin, return address, packaging preference, max wholesale spend per order (safety cap).

---

## Phase 3 — Supplier Portal (separate Phase, scaffold now)

### 3.1 Public route `/suppliers/signup`

Self-serve registration: business name, GSTIN, categories, sample images, bank/UPI, contact, MOQ defaults.

### 3.2 Supplier dashboard `/suppliers/dashboard`

- Products CRUD (with bulk CSV upload)
- Inquiries inbox
- Dropship orders queue
- Rating & reviews from merchants
- Payout history

### 3.3 Admin moderation

New `/admin/suppliers` page: approve/reject, GST verify, set commission %, suspend bad actors. Auto-checks GSTIN via public API.

---

## Database (one migration)

New tables:

- `suppliers` — id, name, gstin, city, state, verified, rating, response_time_hrs, years_active, contact_email, contact_phone, api_type (none/webhook/shiprocket), api_config jsonb, status (pending/approved/suspended), user_id (nullable, links when self-registered)
- `sourcing_products` — id, supplier_id, source (indiamart/tradeindia/meesho/manual), source_url, title, description, images[], category, price_min, price_max, moq, unit, specs jsonb, shipping_zones[], trend_score, last_scraped_at
- `sourcing_viral_products` — week_start, sourcing_product_id, rank, trend_score, growth_pct, ai_insight (cached weekly snapshot)
- `merchant_sourcing_saved` — store_id, sourcing_product_id, status (saved/imported/dismissed), imported_product_id
- `supplier_inquiries` — store_id, supplier_id, sourcing_product_id, message, status, supplier_reply
- `dropship_orders` — order_id, store_id, supplier_id, sourcing_product_id, supplier_order_ref, status, tracking_number, cost, margin
- `supplier_reviews` — supplier_id, store_id, rating, review, order_id
- `supplier_payouts` — supplier_id, amount, period, status, utr

RLS:

- `sourcing_products` + `sourcing_viral_products` — public read (any authed user)
- `suppliers` — public read of approved rows only
- `merchant_sourcing_saved`, `supplier_inquiries`, `dropship_orders` — store-owner scoped
- Supplier-owned rows scoped via `suppliers.user_id = auth.uid()`
- Admin role bypass via existing `has_role` helper

New `app_role` value: `'supplier'` (added to enum).

---

## Edge functions

- `sourcing-search` — natural-language search → Firecrawl + Gemini → returns ranked products, debits credits
- `sourcing-deep-scrape` — single-URL deep scrape with supplier verification (GST lookup, reviews aggregate)
- `sourcing-import` — AI rewrite + push to merchant's `products` table
- `sourcing-viral-cron` — scheduled weekly
- `dropship-forward` — fan-out new orders to supplier APIs
- `supplier-inquiry-send` — emails supplier via Resend, stores in DB
- `supplier-verify-gst` — public GSTIN check

---

## UI/UX highlights (premium, on-brand)

- Orange primary (`#F97316`) with a new "viral" accent gradient (orange → pink) reserved only for the 🔥 Viral feed
- Trend cards have animated rank badges, sparkline of search volume, "Hot" pulse
- Skeleton shimmer while scraping (multi-second searches)
- Empty states with sample searches ("kurti sets", "led lights", "phone cases")
- Mobile-first: viral feed scrolls vertically like a reel
- Credit cost shown inline on every action button (e.g. "Search · 2 credits")

---

## Out of scope (this build)

- Real Shiprocket-Wholesale API integration (we scaffold adapter + manual mode; live integration after they share keys)
- Supplier payouts execution (UI + ledger only; actual disbursement later)
- Multi-currency / cross-border sourcing
- Negotiation chat (we use email inquiries v1)

---

## Build order

1. Migration (tables, enum, RLS, seed `ai_action_costs`)
2. Edge functions: `sourcing-search`, `sourcing-import`, `sourcing-viral-cron`
3. `/sourcing` page + product drawer + sidebar entry
4. Credit cost wiring + empty/loading states
5. Dropshipping skeleton: `dropship_orders`, settings, queue tile
6. Supplier portal scaffolding (`/suppliers/signup`, `/suppliers/dashboard`)
7. Admin moderation page
8. Seed 50 sample viral products so demo looks alive on day 1

---

## Open questions (please confirm before I build)

1. **Firecrawl** is the scraper of choice — OK to require the Firecrawl connector? (Most reliable for IndiaMART/TradeIndia which block plain fetch.)   
Answer: Use our project India Data explorer for Google and Just Dial and Firecrawl for others. make sure we need to show the products first and then to show the contact of supplier charge 5 credits.
2. **Credit prices** above (2/5/1) — happy with these, or should I tune?   
Answer: It is fine add the contact view charges as mentioned above. 
3. **Supplier portal** — build the full scaffold now, or ship Phases 1+2 first and supplier portal next iteration?   
Answer: Full
4. **Viral feed cadence** — weekly (Mon) is cheap; do you want daily for an extra ₹ cost?  
Answer: Yes that would be great!