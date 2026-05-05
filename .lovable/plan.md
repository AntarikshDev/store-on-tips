# Soft-Launch Sprint — Phase 0 Hardening + Dashboard Redesign

Token-efficient build. We **reuse existing components** (WalletCard, RevenueChart, TopProducts, RecentOrders, AbandonedCartBanner, WeeklyDigest, ConversionFunnel, ProvisioningStatus) and only add what's missing. No duplicate hooks, no parallel data fetches.

---

## Sprint A — Dashboard Redesign (single build)

### New reusable primitives (small, used app-wide)
1. `src/components/ui/PageHeader.tsx` — title + subtitle + actions + breadcrumbs. Replaces ad-hoc h1 blocks.
2. `src/components/ui/AnimatedCounter.tsx` — extract `useCountUp` from `WalletCard.tsx` into shared hook `src/hooks/useCountUp.ts` and reuse there too.
3. `src/components/ui/Sparkline.tsx` — tiny recharts line, ~20 LOC.
4. `src/components/ui/StatCard.tsx` — KPI card (icon, label, value, delta %, sparkline, tinted gradient by `tone` prop: emerald|indigo|amber|rose).

### New dashboard sections
5. `src/components/dashboard/HeroGreeting.tsx` — greeting + streak + plan badge + today's ribbon. Pulls from existing `useStore`, `useAuth`, `useSubscription`.
6. `src/components/dashboard/SmartActions.tsx` — 1–3 contextual chips (ship pending, low-stock, unread reviews). **Pure rule-based, zero AI calls**. Reuses `orderStats`, `useProducts`, existing review query.
7. `src/components/dashboard/StoreHealthGauge.tsx` — circular SVG gauge, computes score **client-side** from already-fetched store/products/settings (no new query, no AI).

### Restyle / replace
8. `src/pages/Dashboard.tsx` — restructure using new primitives. Replace the 4 raw stat Cards with `<StatCard>`. Add HeroGreeting, SmartActions, StoreHealthGauge. Keep WalletCard, RevenueChart, TopProducts, RecentOrders, AbandonedCartBanner, WeeklyDigest, ConversionFunnel, checklist as-is.
9. `src/components/dashboard/RevenueChart.tsx`, `TopProducts.tsx`, `RecentOrders.tsx` — light visual polish (soft border, hover lift) via shared card classes. No logic change.
10. `src/index.css` — add semantic soft tokens (`--success-soft`, `--warn-soft`, `--info-soft`, `--rose-soft`), `.surface-card`, `.kpi-tone-*` utilities, dashboard mesh background.

### Token-savings refactor (cuts duplicate queries)
11. `src/hooks/useDashboardStats.ts` — single hook returning `{today, total, pending, last7Days[], deltaPct}`. Currently `Dashboard.tsx` fetches all orders **and** `RevenueChart` re-fetches them. Consolidate so we hit `orders` once and feed both. Saves DB egress + render time on every dashboard load.
12. Delete the dup query in `RevenueChart.tsx`; accept data via prop (with fallback fetch for backward compat).

---

## Sprint B — Phase 0 Hardening (soft-launch blockers only)

### B1. Provisioning runner with budget cap (re-enable safely)
- Add columns to `platform_credit_settings` (or new `provisioning_budget` table): `hourly_inr_cap`, `daily_inr_cap`, `current_hour_spent`, `current_day_spent`, `paused_until`.
- Modify `provision-runner` edge function: before doing work, check cap; if exceeded, mark request `queued`, set `paused_until=now()+1h`, exit silently.
- Re-add cron at **every 5 minutes** (not every minute) — cuts invocations 5×.
- Admin toggle on `/admin/provisioning` to pause/resume and view spend.

### B2. Observability (lightweight, free tier)
- Add `src/lib/errorReporter.ts` — captures `window.onerror` + `unhandledrejection` + React Error Boundary, POSTs to a new edge function `log-client-error` that just inserts into `client_error_logs` table.
- New `src/components/ErrorBoundary.tsx` wrapping `<AppRoutes>`.
- Edge function logs already in Supabase — add admin page `/admin/health` showing last 50 errors + edge function failure count last 24h. **No external Sentry needed for soft-launch.**

### B3. In-app Help (no AI, no chat infra)
- New table `help_articles` (slug, title, body_md, category, sort).
- New page `/help` and `/help/:slug` rendering markdown (use existing `react-markdown` if present, else simple renderer).
- Floating `?` button in `DashboardLayout` top bar → opens `Sheet` with searchable article list + "WhatsApp us" deep-link to support number (configurable in `platform_settings`).

### B4. DPDP basics
- New edge function `account-export` — returns user's stores/products/orders as JSON download. Button on `/profile`.
- New edge function `account-delete-request` — inserts into `account_deletion_requests` table; admin reviews and triggers cascade. Button on `/profile` with 7-day cooldown.

### B5. Performance quick wins (zero token cost)
- `src/App.tsx` — convert all admin pages and heavy seller pages (StoreAnalytics, Themes, BlogPostForm, ProductForm) to `lazy()` imports.
- Add `cache-control: public, s-maxage=60` headers in `get-storefront-bundle` response.
- `vite.config.ts` — add `manualChunks` to split vendor (`react`, `recharts`, `@radix-ui`).

### B6. GST invoice for platform fees (lightweight)
- Reuse existing PDF utility used for order invoices (find via `rg`).
- New edge function `generate-platform-invoice` triggered on subscription/wallet purchase webhook; emails PDF to merchant.

### B7. Refund/dispute SOP in admin
- New tab in `/admin/orders` (or `/admin/disputes`) listing Razorpay disputes via webhook.
- Add `disputes` table; subscribe Razorpay `payment.dispute.*` events in existing `subscription-webhook` (rename to handle both) or new function.

---

## What we explicitly skip for soft-launch (keep for post-launch)
- Cmd-K global search
- Notifications center
- AI Marketing Studio
- Referral program
- Mobile app wrapper
- Sentry / external uptime
- Full activation cohort dashboard (basic counts only)

---

## Token / Cost Discipline Rules baked in
- **No new AI calls** in Dashboard or Health Score (pure client compute on already-fetched data).
- **One query per resource** — consolidate via `useDashboardStats`.
- **Cache aggressively**: `staleTime: 60_000` on all dashboard queries.
- **Provisioning runner**: 5-min cron + budget cap (was 1-min unsupervised).
- **Reuse `useCountUp`** instead of duplicating animation logic.
- **Reuse `Card`, `Button`, `Progress`** from shadcn — no new design-system fork.

---

## Build Order (single message each)
1. **Build 1 (this approval):** Sprint A — Dashboard redesign + reusable primitives + `useDashboardStats` consolidation + CSS tokens.
2. **Build 2:** B1 + B5 (provisioning safety + perf chunks).
3. **Build 3:** B2 + B3 (observability + help center).
4. **Build 4:** B4 + B6 + B7 (DPDP + GST invoice + disputes).

After Build 4 you're cleared for soft launch to ≤200 merchants. Approve to start **Build 1 (Dashboard redesign)** now.
