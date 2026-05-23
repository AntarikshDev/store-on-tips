---
name: Subscription Billing System
description: Recurring monthly billing (₹499/1499/4999 + 18% GST), 15-day grace, auto-block, upgrade/downgrade flows
type: feature
---

## Plans (DB-driven via `plan_configs` table)
- **Free** ₹0 — 10 products, 1 theme, 3% commission, COD only
- **Starter** ₹499 + 18% GST (₹588.82) — 100 products, 3 themes, 2% commission, custom domain, payments, shipping, blog, coupons, analytics, SEO, branded emails
- **Growth** ₹1499 + 18% GST (₹1768.82) — 1000 products, 10 themes, 1% commission, 14-day trial, premium themes, multi-domain
- **Scale** ₹4999 + 18% GST (₹5898.82) — Unlimited, 0% commission, early access

`plan_configs.gst_percent` defaults to 18. All Razorpay subscriptions must be created at the GST-inclusive amount.

## Recurring billing lifecycle
1. Subscription renews monthly. 5 days before `current_period_end` → email "renews on X".
2. If renewal fails (`subscription.halted`/`paused`/`pending` webhook OR cron sees `current_period_end < now()`):
   - Status → `past_due`, `grace_period_end = current_period_end + 15 days`
   - Email "Payment failed — 15 days to renew"
3. 3 days before `grace_period_end` → email reminder.
4. When `grace_period_end < now()` and still unpaid → `is_blocked = true`, email "Store paused".
5. On `subscription.charged` webhook → clear `grace_period_end`, `is_blocked`, notification flags. Instant revival.

## Access blocking
- `is_store_access_blocked(store_id)` RPC: true only when `is_blocked = true` AND plan != 'free'.
- `SubscriptionGate` (frontend) shows a full-screen "renew now" wall on every dashboard route except `/billing`, `/auth`, `/admin`.
- `GraceBanner` (top of every dashboard page) shows days remaining when in grace.
- TODO (not yet enforced): block storefront checkout when owner is blocked.

## Upgrade / downgrade
- **Upgrade** (higher sort_order): `change-subscription-plan` returns `action: upgrade`; frontend then calls `create-razorpay-subscription` to start a new Razorpay subscription immediately.
- **Downgrade** (lower sort_order): `change-subscription-plan` calls `schedule_plan_change` RPC which sets `pending_plan` + `pending_plan_effective_at = current_period_end`. The webhook applies it on the next `subscription.charged`. `cancel_pending_plan_change` RPC reverses it.
- UX pattern for "I need a higher plan feature just once": upgrade now → use feature → schedule downgrade. Only one paid cycle is consumed.

## Key files
- `src/hooks/useSubscription.ts` — `planConfig`, `canUse(feature)`
- `src/hooks/useSubscriptionAccess.ts` — `isBlocked`, `inGrace`, `graceDaysLeft`, `pendingPlan`
- `src/components/billing/SubscriptionGate.tsx` — full-screen block wall
- `src/pages/Billing.tsx` — upgrade/downgrade cards, GST-inclusive pricing, lifecycle banners
- `src/pages/admin/AdminPlans.tsx` — admin CRUD (pricing, GST%, feature flags, Razorpay plan IDs)
- `supabase/functions/create-razorpay-subscription` — creates subscription with trial support
- `supabase/functions/change-subscription-plan` — classifies upgrade vs downgrade
- `supabase/functions/subscription-webhook` — handles charged/halted/cancelled; manages grace + pending plan application
- `supabase/functions/subscription-lifecycle` — daily cron (02:00 IST) for reminders, grace, block

## DB columns added to `subscriptions`
`grace_period_end`, `is_blocked`, `expiry_notified_at`, `grace_warning_notified_at`, `blocked_notified_at`, `pending_plan`, `pending_plan_effective_at`.

## Razorpay plan IDs
Set per-tier in Admin → Plans. **Must be created in Razorpay at the GST-inclusive amount** (e.g., 58882 paise for Starter).
