# Product Sourcing Hub — "SourceIndia" (updated)

Same scope as previously approved, with one refinement: the scraper logic for **Google Maps + JustDial** will be ported directly from your **India Data Explorer** project (`src/server/firecrawl.server.ts` — Firecrawl v2 + JSON-schema extraction, with click-to-reveal phone actions for JustDial), while **IndiaMART, TradeIndia, Meesho Supply** keep using the same Firecrawl pattern with product-shaped schemas.

## What's new vs. the prior plan

- Reuse the proven `buildSourceUrl` + `scrapeOnce` + JSON-schema extraction pattern from India Data Explorer, adapted from "lead" shape → "product" shape (title, image, MOQ, price tier, supplier_name, supplier_phone, listing_url, rating, reviews, location).
- Two-step reveal pattern, per your spec:
  1. **Search (2 credits)** — returns product cards with title, image, price band, MOQ, supplier *name + city only* (no phone, no email, blurred contact chip).
  2. **Reveal supplier contact (5 credits)** — unlocks phone/email/website and saves a permanent unlock row so the merchant never pays twice for the same supplier.
- Daily viral cron at 6am IST (was weekly).
- Supplier portal scaffolded fully (signup → dashboard → admin moderation).

## Architecture

Edge functions (Deno) — port the India Data Explorer helpers as `_shared/firecrawl.ts`:

- `sourcing-search` — query + city + filters → Firecrawl Google/JustDial/IndiaMART → dedupe → score → return masked rows. Debits 2 credits via `consume_credits`.
- `sourcing-reveal-contact` — unlocks supplier contact for one product. Debits 5 credits, writes `merchant_supplier_unlocks` row (idempotent — re-reveals are free).
- `sourcing-import` — AI rewrite (Lovable AI Gemini) + push to `products`. Debits 1 credit.
- `sourcing-viral-cron` — daily 6am IST; scrapes trending categories on IndiaMART + Google Trends shopping IN; clusters & scores with Gemini; writes to `sourcing_viral_products`.
- `dropship-forward` — fan-out new merchant orders to supplier APIs (manual/email by default).
- `supplier-inquiry-send` — Resend email to supplier (when contact present) + DB record.

## Database (one migration)

Tables: `suppliers`, `sourcing_products`, `sourcing_viral_products`, `merchant_sourcing_saved`, `merchant_supplier_unlocks` *(new)*, `supplier_inquiries`, `dropship_orders`, `supplier_reviews`, `supplier_payouts`.

Credit costs seeded into `ai_action_costs`:
- `sourcing_search` — 2
- `sourcing_reveal_contact` — 5
- `sourcing_import` — 1
- `sourcing_deep_scrape` — 5 (premium "verify GST + competitor pricing" run)

RLS: public read of approved suppliers, store-owner scoped on saved/unlocks/inquiries/dropship, supplier-self-managed via `suppliers.user_id = auth.uid()`, admin bypass via existing `has_role()`. No enum changes — supplier "role" is implicit through ownership of a `suppliers` row.

## Merchant UI

`/sourcing` (sidebar entry "Source Products" with 🔥 badge) — tabs:
- **Viral Today** (gradient orange→pink) — animated trend cards, sparkline, rank, growth %
- **Search** — natural-language + filters; cards show masked supplier; "Reveal Contact · 5 credits" CTA
- **Categories** — Beauty / Home / Fashion / Kitchen / Festive / Tech / Toys / Wellness
- **Saved** & **Imported**

Drawer per product: image carousel, price tiers, MOQ, supplier card (locked until reveal), AI "Why this sells", margin calculator, Add-to-store / Request sample / Enable dropship.

## Supplier portal

- `/suppliers/signup` — public registration (GSTIN, categories, contact, bank, sample images)
- `/suppliers/dashboard` — products CRUD with bulk CSV, inquiries inbox, dropship queue, reviews, payouts
- `/admin/suppliers` — approve / GST-verify / set commission / suspend

## Daily seed for "wow" demo

50 hand-picked Indian wholesale products + 8 sample suppliers seeded so day-1 merchants see a populated feed before the first cron runs.

## Build order

1. Migration (all tables + RLS + ai_action_costs seed + sample data)
2. `_shared/firecrawl.ts` ported from India Data Explorer
3. Edge functions: search → reveal-contact → import → viral-cron → dropship-forward → supplier-inquiry-send
4. `/sourcing` merchant UI (tabs, cards, drawer, masking, credit gating)
5. Supplier portal (`/suppliers/signup`, `/suppliers/dashboard`)
6. Admin `/admin/suppliers`
7. Sidebar + routes + daily cron wiring
8. End-to-end sanity (sample search, reveal, import, dropship form)

Out of scope (this build): live Shiprocket-Wholesale API, real payout disbursement, cross-border sourcing, in-app negotiation chat.