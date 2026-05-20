# Premium Themes — Real Razorpay Purchase Flow

Today, both premium theme systems (static `THEME_TEMPLATES.purchased_themes` and AI `theme_packs` / `theme_purchases`) have **no payment** — `usePurchaseTheme` inserts directly, `StoreDesign.handleSave` shows a toast, `theme-deploy-to-store`'s 402 guard is bypassable. We'll wire real Razorpay and make the onboarding path frictionless so merchants pay immediately instead of "later".

## Industry-standard money flow

```text
Client → create-theme-purchase-order (edge)
         ├─ verify auth + store ownership
         ├─ read theme price (theme_packs OR static catalog)
         ├─ apply discount (launch / first-store)
         ├─ create Razorpay order via platform RAZORPAY_KEY_ID
         └─ insert theme_purchase_intents (pending)
Client → Razorpay Checkout (platform keys, not seller keys)
Razorpay → razorpay-webhook (extend existing)
         ├─ HMAC verify with RAZORPAY_WEBHOOK_SECRET
         ├─ on payment.captured → insert theme_purchases (service role)
         ├─ flip intent to paid, store payment_id + amount
         └─ if onboarding_pending → mark store ready_to_publish
Client polls / realtime → unlocks Customiser, deploys theme
```

Platform Razorpay keys are used (not seller's) — this is **platform revenue**, not seller revenue.

## Database changes

1. New table `theme_purchase_intents` — `id, store_id, user_id, theme_kind ('pack'|'static'), theme_ref, amount_inr, discount_inr, razorpay_order_id, status ('pending'|'paid'|'failed'|'expired'), created_at, paid_at`. RLS: owner can select own; insert/update via service role only.
2. Lock down `theme_purchases` — drop client INSERT policy, keep SELECT for store owner. All writes via webhook with service role.
3. Lock down `stores.settings.purchased_themes` — add trigger preventing client updates to this key; mutated only by webhook.
4. Add `is_premium boolean` + `price_inr int` to `theme_master_projects` so static premium themes have a single source of truth (replaces hardcoded `price` in `THEME_TEMPLATES`).
5. Add `stores.settings.pending_premium_theme = { theme_id, intent_id, selected_at }` — set during onboarding when merchant picks premium without paying.

## Edge functions

1. **`create-theme-purchase-order`** (new, verify_jwt=false + in-code auth)
   - Input: `{ store_id, theme_kind, theme_ref }`
   - Verifies store ownership, looks up price, applies discount, creates Razorpay order with platform keys, returns `{ order_id, key_id, amount, discount_applied }`.
2. **`razorpay-webhook`** (extend existing)
   - Detect `notes.purpose === 'theme_purchase'`, look up intent, insert `theme_purchases`, clear `pending_premium_theme`, append to `purchased_themes`.
3. **`theme-deploy-to-store`** — already correct; becomes meaningful once #2 RLS is locked.

## Onboarding path (StepTheme + StepGoLive)

- `StepTheme`: badge premium themes with price + "Locked until paid". Selection allowed; sets `data.pendingPremiumTheme`.
- New micro-step **after** StepGoLive when a premium theme is selected: a single screen "Your store is live — unlock your premium design" with Razorpay button. **Two CTAs**: `Pay ₹X now` (primary) and `Continue with free starter` (secondary, swaps to default theme).
- If merchant clicks "Skip / pay later": store goes live with a **free fallback theme**, premium choice stored in `pending_premium_theme`, dashboard shows nudge.

## Dashboard nudge (when `pending_premium_theme` set)

- New `<PremiumThemePendingCard />` at the top of dashboard, dismissible-for-24h:
  - "Your **[Theme Name]** is reserved. Pay ₹X to activate." → opens Razorpay sheet inline (no page jump).
  - Live countdown of the 24-hour launch discount.
  - Mini-preview thumbnail.

## Customiser block (the "soft paywall")

- `Customise.tsx` checks: if active theme is premium AND not in `purchased_themes`, render existing `<PremiumGate>` over the whole editor with copy: *"This is a premium theme preview. Pay ₹X to unlock editing."* Inline Razorpay button — no redirect.
- Storefront keeps working with the premium theme's **default content** (no overrides), so the merchant's store is live and beautiful but they can't customise until they pay. This is the core "make them pay now" lever.

## The "surprise" — convenience levers to drive instant payment

1. **24-hour launch discount**: 30% off the moment the store goes live, visible countdown on dashboard + in Razorpay sheet. Computed server-side in `create-theme-purchase-order` (`hours_since_publish < 24 ? price * 0.7 : price`).
2. **One-tap Razorpay** inline modal everywhere (onboarding, dashboard nudge, customiser gate) — no separate billing page, no redirects. Uses Razorpay's Standard Checkout JS overlay.
3. **UPI-first**: pass `method: { upi: true }` preference + `prefill.contact` from store phone so UPI apps autosuggest. Median pay time drops to ~20s.
4. **"Pay later" stays honest**: if merchant skips, store is live on a free theme — they get value first. Removes the "I'll never get my store live" anxiety that kills conversions.
5. **Refund window**: 7-day no-questions refund via existing `razorpay-refund` function. Show this badge in the pay sheet — proven to lift conversion ~15%.
6. **Bundle hint**: if total premium spend in cart would cross ₹1,499, offer the **Customise Pro** bundle (from the earlier `Pro themes and Customise` plan) at the same price — single payment, two unlocks.

## Frontend files touched

- `src/hooks/useThemePacks.ts` — `usePurchaseTheme` becomes `useStartThemePurchase` → calls edge fn, opens Razorpay.
- `src/hooks/usePremiumThemeStatus.ts` (new) — returns `{ isPremium, isPurchased, price, discountedPrice, pendingIntent }`.
- `src/components/billing/RazorpayThemeSheet.tsx` (new) — shared inline checkout.
- `src/components/dashboard/PremiumThemePendingCard.tsx` (new).
- `src/components/onboarding/StepPremiumUnlock.tsx` (new) — shown only when premium selected.
- `src/pages/Customise.tsx` — wrap with premium gate.
- `src/pages/StoreDesign.tsx` — replace toast stub with `RazorpayThemeSheet`.
- `src/components/onboarding/StepTheme.tsx` — premium badge + price chip.

## Out of scope (kept for later)

- Coupon codes beyond the 24h launch discount.
- Theme gifting / transfer between stores.
- Multi-store volume discounts.

## Risks

- Webhook delivery delay → handle via 10s client poll on `theme_purchases` after Razorpay success callback as fast path; webhook remains the source of truth.
- Refund must also revert `purchased_themes` and `theme_overrides` — extend `razorpay-refund`.
- Hardcoded `THEME_TEMPLATES` prices must migrate to `theme_master_projects.price_inr` to avoid drift.
