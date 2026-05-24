---
name: Service Industry (Doctors & Salons)
description: Appointments engine, providers/staff, services, family plans, packages, commissions, and storefront booking for healthcare and beauty service stores
type: feature
---

## Business modes
- `store.category = 'healthcare'` / `beauty_services'` — sidebar Bookings group only renders for these.

## Phase A tables
- `service_providers` (+ home_visit_pincodes, radius_km, home_base_lat/lng, rating_avg/count)
- `services` (+ home_visit_enabled)
- `provider_schedules`
- `appointments` (+ travel_fee, en_route_at, package_balance_id)
- `family_plans`, `family_groups`, `family_members`

## Phase B tables
- `service_packages` — prepaid visit bundles (`total_visits`, `validity_days`, `included_service_ids[]`)
- `customer_package_balances` — per-customer visits_left + expiry
- `provider_commissions` — auto-accrued when an appointment is `completed` (trigger `trg_accrue_appt_commission`)
- `reviews.appointment_id` / `provider_id` — link reviews to a specific appointment / provider

## Public storefront access
- RLS: published-store public reads on `service_providers`, `provider_schedules`, `family_plans`, `service_packages`
- Customers can `INSERT` into `appointments` for published stores; they can `SELECT` only their own (`customer_user_id = auth.uid()`)
- Helper: `public.family_plan_slots_left(plan_id)`

## Edge functions
- `compute-slots` — free slots for `(store, provider, service, date)`
- `book-appointment` — public; server-side price recompute, conflict guard, inserts appointment with `pending` status

## Routes
- Dashboard: `/appointments` `/services` `/providers` `/providers/payouts` `/family-plans`
- Storefront: `/store/:slug/book` (5-step flow: service → provider → slot → details → confirm)

## Phase C+ (not yet built)
- Razorpay deposit collection on booking, family plan subscription billing
- EMR / Rx / Pharmacy POS, before/after gallery, bridal quotes
- WhatsApp + email reminders (T-24h / T-2h) via cron
- Pica 2 `isHealthcare` / `isBeauty` prompt branches
- Storefront sections (`service_menu`, `provider_team`, `family_plan_card`) in MasterThemeRenderer
