## Goal

Move from "no monthly fee" messaging to real recurring monthly billing on Starter (₹499), Growth (₹1499), Scale (₹4999) with:

- End-of-month expiry notifications
- 15-day grace period after expiry
- Automatic store + dashboard block after grace ends
- Instant revival on payment
- Upgrade / downgrade between plans (prorated upgrade, downgrade at next cycle)

---

## 1. Marketing & copy fixes

- `LandingPage.tsx`, `Billing.tsx`, `Investors.tsx`, `HowItWorks.tsx`, `Index.tsx`: replace every "no monthly fees" / "only 2% commission, no fees" line with the new pricing message ("Free forever tier + ₹499 / ₹1499 / ₹4999 monthly plans").
- Update product description memory and `.lovable/plan.md`.

## 2. Database (migration)

Add to `subscriptions`:

- `grace_period_end TIMESTAMPTZ` — set to `current_period_end + 15 days` when a renewal fails or sub becomes `past_due`.
- `expiry_notified_at TIMESTAMPTZ`, `grace_warning_notified_at TIMESTAMPTZ`, `blocked_notified_at TIMESTAMPTZ` — idempotency for emails.
- `is_blocked BOOLEAN DEFAULT false` — set true when grace ends unpaid.
- `pending_plan PlanCode`, `pending_plan_effective_at TIMESTAMPTZ` — for scheduled downgrades.
- Index on `(status, current_period_end)` and `(is_blocked, grace_period_end)`.

New RPC `is_store_access_blocked(_store_id uuid) returns boolean` — true if `is_blocked = true` AND plan ≠ 'free'. Free plan is never blocked.

New RPC `schedule_plan_change(_store_id, _new_plan)`:

- Upgrade (higher tier): mark `pending_plan` and call edge function to create new Razorpay sub with prorated start (handled in step 4).
- Downgrade (lower tier): set `pending_plan` + `pending_plan_effective_at = current_period_end`. Apply on renewal.

## 3. Cron jobs (pg_cron via `enqueue_email`/`net.http_post`)

Daily at 09:00 IST → call `subscription-lifecycle` edge function which:

1. Finds subs with `current_period_end` in next 5 days and not free → email "Your plan renews on X".
2. Finds subs where `current_period_end < now()` AND `status != active` AND `grace_period_end is null` → set `grace_period_end = current_period_end + 15 days`, status `past_due`, email "Payment failed — 15 days to renew".
3. Finds subs where `grace_period_end - now() <= 3 days` → email reminder.
4. Finds subs where `grace_period_end < now()` AND not paid → set `is_blocked = true`, email "Store paused".

## 4. Edge functions

- **subscription-lifecycle** (new, cron-driven) — logic in §3.
- **change-subscription-plan** (new) — accepts `{store_id, new_plan}`. Verifies caller owns store. Upgrade: cancel current Razorpay sub at period end, create new sub with `start_at = now()` and credit prorated unused amount as wallet credit. Downgrade: store `pending_plan` only; the existing sub continues until `current_period_end`, then `subscription-webhook` applies the change on next charge.
- **subscription-webhook** (edit) — on `subscription.charged`: clear `grace_period_end`, `is_blocked`, `expiry_notified_at`, apply `pending_plan` if set and effective. On `subscription.halted` / `payment.failed`: set `status=past_due`, start grace if not set.

## 5. Access blocking (frontend)

- New hook `useSubscriptionAccess()` — returns `{ isBlocked, graceDaysLeft, blockedReason }` from subscription row.
- `DashboardLayout.tsx`: if `isBlocked`, render a full-screen "Subscription expired" gate with single CTA → `/billing`. Allow only `/billing` and `/auth` routes to render through.
- Storefront (`Storefront.tsx`, `StorefrontProduct.tsx`, `StorefrontCheckout.tsx`): if owning store is blocked, show "This store is temporarily unavailable" page (no checkout, no add-to-cart).
- `useStoreByHost` already returns store; add an `is_blocked` flag joined from `subscriptions` via a new view `store_access_status` (public-readable, returns only `store_id`, `is_blocked`).

## 6. Billing UI (`src/pages/Billing.tsx`)

- Add "Current plan" card showing: plan name, next renewal date, grace status if past_due.
- Each plan card now has 3 possible CTAs based on relative tier:
  - Current → "Current plan" disabled
  - Higher tier → "Upgrade now" (prorated, immediate)
  - Lower tier → "Schedule downgrade" with confirm dialog: "You'll keep &nbsp; until &nbsp;, then move to &nbsp;."
- "Cancel pending change" button when `pending_plan` is set.
- Banner when `status='past_due'`: "Your plan expired on X. Pay within Y days to keep your store live."
- Banner when `is_blocked`: "Your store is paused. Renew to restore access instantly."

## 7. Email templates

Add to `generate-email-templates` or `send-order-notification` pattern:

- `subscription_renewal_upcoming`
- `subscription_payment_failed`
- `subscription_grace_warning`
- `subscription_blocked`
- `subscription_revived`

## 8. Memory updates

Update `mem://features/subscription-billing.md` with the new lifecycle (grace, block, upgrade/downgrade rules). Update `mem://business/monetization-strategy.md` to remove "no monthly fees" and document the recurring model.

---

## Files to create

- `supabase/migrations/<ts>_subscription_lifecycle.sql`
- `supabase/functions/subscription-lifecycle/index.ts`
- `supabase/functions/change-subscription-plan/index.ts`
- `src/hooks/useSubscriptionAccess.ts`
- `src/components/billing/SubscriptionGate.tsx`
- `src/components/billing/PlanChangeDialog.tsx`

## Files to edit

- `src/pages/Billing.tsx`, `src/pages/LandingPage.tsx`, `src/pages/Investors.tsx`, `src/pages/HowItWorks.tsx`, `src/pages/Index.tsx`
- `src/components/DashboardLayout.tsx`, `src/pages/Storefront.tsx`, `src/pages/StorefrontProduct.tsx`, `src/pages/StorefrontCheckout.tsx`
- `src/hooks/useSubscription.ts`, `src/hooks/useStoreByHost.ts`
- `supabase/functions/subscription-webhook/index.ts`
- `.lovable/memory/features/subscription-billing.md`, `.lovable/memory/business/monetization-strategy.md`

Mention 18% +GST exta and charge 499+18%, 1499+18% and 4999+18% on razor pay 588.82 and same for other pakages.   
Out of scope (confirm if you want these too)

- GST invoicing for the subscription fee itself (separate from commission invoices)
- Per-feature one-time unlocks (you hinted at "use a 1499 feature once" — I'm assuming this means a temporary upgrade, handled via upgrade then downgrade-back, not à-la-carte unlocks).