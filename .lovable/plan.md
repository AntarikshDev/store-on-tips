
# Plan — Multi-fulfillment storefronts (cafés/restaurants first) + category-lock audit

## Why
Today the platform assumes one business model: physical goods, ship-to-address, Razorpay or COD. A café or restaurant cannot accept a dine-in order, a takeaway counter cannot skip address, and there is no QR → menu → order flow without forcing sign-up. We already have demand for restaurants, so we unlock fulfillment modes per category and audit other places where category assumptions block real merchants.

---

## Part A — Fulfillment modes (core feature)

### A1. Data model
- New table `store_fulfillment_settings` (1:1 with store):
  - `dine_in_enabled`, `takeaway_enabled`, `delivery_enabled` (bool)
  - `dine_in_requires_table` (bool), `tables` (jsonb: `[{label, qr_token}]`)
  - `takeaway_min_phone_only` (bool, default true)
  - `delivery_radius_km`, `delivery_min_order`, `delivery_fee_flat`
  - `auto_accept`, `kitchen_prep_minutes`
- `orders` gets `fulfillment_mode` (`dine_in | takeaway | delivery`), `table_label`, `prep_status` (`received | preparing | ready | served | out_for_delivery | completed`).
- `products` gets optional `menu_meta` (jsonb: `veg|non_veg|egg`, `spice_level`, `allergens[]`, `prep_minutes`, `available_modes[]` so e.g. an item is dine-in only).
- New table `store_qr_codes`: `id, store_id, kind ('menu'|'table'|'takeaway'), table_label, slug, scans_count` — drives the public link.

### A2. Routes (storefront, public, no auth required for dine-in)
- `/store/:slug/menu` — full menu, mode picker pinned on top (defaults to whichever mode the QR encodes).
- `/store/:slug/menu/t/:tableToken` — auto-selects dine-in + table, hides address/phone collection entirely.
- `/store/:slug/menu/takeaway` — phone-only checkout.
- `/store/:slug/menu/delivery` — full address + pincode check (re-uses existing checkout but simplified).
- Cart, checkout, order confirmation all become mode-aware (no shipping fee for dine-in/takeaway, no address fields for dine-in, etc.).

### A3. Guest order rules
- **Dine-in**: zero friction. Send to kitchen with table label only. No customer account. Order tracked by a short code shown on screen.
- **Takeaway**: phone number only (+ optional name). OTP optional in v1 — controlled by `takeaway_min_phone_only`.
- **Delivery**: name + phone + address + pincode (existing checkout flow), still no forced sign-up.
- Sign-in stays optional everywhere; if signed in, order auto-attaches to `customer_user_id`.

### A4. Menu builder (dashboard)
- New `Menu` page (shown only when category implies food OR fulfillment modes enabled): drag-reorder sections (e.g. Starters / Mains / Drinks), per-item veg badge, prep time, mode availability, daily availability windows.
- Existing Products page stays — Menu is a presentation layer on top of `products` + `categories` with `menu_meta` enrichment.

### A5. QR generator (dashboard → Marketing → QR Codes)
- Create QR by kind: store menu, per-table (bulk create N tables → N PNGs), takeaway counter.
- Each QR embeds the store logo in the centre and links to the corresponding `/menu/...` URL.
- Download as PNG/PDF (single or A4 sheet of all tables); SVG for print shops.
- Track `scans_count` via a redirect endpoint `/q/:slug` that 302s to the menu URL.

### A6. Order desk (kitchen view)
- New `/orders/kitchen` route: ticket-style columns (Received → Preparing → Ready → Served/Out). Realtime via Supabase channel on `orders` filtered by `prep_status`.
- Audio chime on new dine-in/takeaway orders. Print KOT (kitchen order ticket) as 80mm thermal-friendly HTML.

### A7. Payments per mode
- Dine-in: default "Pay at counter" (cash). Optional: pay-now via Razorpay link generated at order time.
- Takeaway: pay-now Razorpay or pay-at-pickup.
- Delivery: existing Razorpay + COD with `cod_rules` already in place.
- Each mode has its own toggle in `store_fulfillment_settings`.

### A8. Theme/storefront rendering
- When fulfillment modes are enabled, the storefront home gets a "Order now — Dine-in / Takeaway / Delivery" mode picker section type. Added to manifest builder registry and to `REQUIRED_PAGES.home` only if `fulfillment_enabled`.
- Menu archetype added to the theme layout system (slug `food-menu`) so AI-generated themes for `food` category default to it.

---

## Part B — Category-lock audit (the "vulnerabilities" you asked about)

We searched for places the app silently assumes "physical goods sold online to one customer at a time, shipped by Shiprocket, Razorpay/COD". These are the rigid spots that block real merchants today. Each becomes a small follow-up unlock so we do not paint another category into a corner.

1. **Onboarding StepCategory** — only 7 hardcoded categories, and only `food/grocery` triggers FSSAI. Need: services, restaurants, salons, rentals, digital goods, b2b/wholesale. Drives downstream behaviour (theme archetype, fulfillment modes, required fields).
2. **Shipping = Shiprocket only** — no concept of pickup, dine-in, digital delivery, or scheduled service slot. Fulfillment table from A1 generalises this.
3. **Checkout always asks for address** — must become mode-aware (already covered for food in Part A; same pattern reused for salons/services in Phase 2).
4. **Orders status enum** is retail-only (`pending → shipped → delivered`). Add `prep_status` (food) and later `appointment_status` (services) as parallel tracks instead of overloading `status`.
5. **Products are always SKU + price + image**. For menus: veg/spice/allergens/prep time. For services: duration/staff/slot. The `menu_meta` jsonb pattern from A1 generalises — services get `service_meta` jsonb later.
6. **Coupons assume cart total**. Need per-mode coupon eligibility (e.g. 20% off dine-in only). Cheap addition: `coupons.allowed_modes text[]`.
7. **Customer accounts are forced on checkout for delivery**. Already enforced via `CustomerRoute`. We make sign-in genuinely optional for guest checkout regardless of mode (security: order tied to phone+OTP for retrieval, not account).
8. **Theme generator** picks archetype only from look-and-feel; it should also branch on enabled fulfillment modes so a restaurant never gets a fashion-lookbook layout.
9. **WhatsApp + email notifications** only have order-shipped templates. Need: order-received (kitchen), order-ready-for-pickup, table-bill-ready.
10. **Analytics** counts only revenue per order. Add breakdown by `fulfillment_mode` so a café sees dine-in vs delivery split.

Items 1, 2, 3, 4, 5, 8, 9 are required to ship Part A. Items 6, 7, 10 ship right after.

---

## Build order

```text
Phase A1  Schema migration (fulfillment settings, orders.mode, products.menu_meta, qr_codes)
Phase A2  Menu builder UI + Menu page on storefront
Phase A3  QR generator + /q/:slug redirector + scan analytics
Phase A4  Mode-aware checkout (3 variants share one flow)
Phase A5  Kitchen order desk + realtime + KOT print
Phase A6  Theme archetype "food-menu" + manifest builder hooks
Phase A7  Notifications (received/ready/served) email + WhatsApp
Phase B1  Category list expansion + category-driven feature flags
Phase B2  Per-mode coupons + analytics breakdown
```

Then Phase 2 of the services-industry track (already scoped: pay-at-venue bookings, Google Calendar sync, WhatsApp Business API) layers on top of the same `fulfillment_mode`/slot abstraction.

---

## Technical notes (for the dev not the user)

- **Realtime**: enable `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;` and filter client-side by `store_id`+`prep_status`. Use `useOrders` hook variant `useKitchenOrders`.
- **QR rendering**: client-side with `qrcode` lib + canvas compositing the logo (already in deps for storefront share). PDF sheet via existing `businessPlanPdf.ts` jsPDF setup.
- **Guest dine-in security**: no PII collected → no RLS risk. Orders insertable by `anon` only when `fulfillment_mode='dine_in'` AND `customer_user_id IS NULL` AND store has dine-in enabled. New RLS policy required; existing "Authenticated users can create orders" policy is too narrow.
- **Table QR token**: random 12-char slug, unique per store. Scanning sets a 4-hour cookie binding the cart to that table to prevent cross-table collisions.
- **Menu vs Products**: do not fork the table. `products` stays the source of truth; `categories.parent_id` already supports menu sections. `menu_meta` is additive jsonb.
- **Backwards compat**: existing stores get `delivery_enabled=true, dine_in=false, takeaway=false` by default, so nothing changes for current merchants. The Menu page and mode picker only appear when more than one mode is enabled OR category is food/restaurant.
- **Validator (`manifestSchema.ts`)**: keep current required sections for retail. Add a parallel `REQUIRED_PAGES_FOOD` profile selected when fulfillment modes are on, so retail themes are not broken.

---

## Out of scope for this plan
- Multi-outlet (chain) support — comes after single-outlet works.
- Inventory deduction per modifier — Phase B.
- Staff/POS terminals — separate track.
- Payment splitting on table (per-guest billing) — Phase 2 of food vertical.

Approve to proceed with Phase A1 migration first; nothing else moves until the schema is in.
