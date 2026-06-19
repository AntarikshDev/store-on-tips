## Goals

1. Stop the "dashboard flash → onboarding with a stuck tour tooltip" experience on first sign-in.
2. Make theme categories a dynamic list managed by the admin (single source of truth, used by the generator, the master theme create/edit form, and the merchant onboarding filter).
3. After choosing a category during onboarding, show themes for that category first.
4. Make the "Your store is live at … View" ribbon appear immediately after the Go Live button, with no refresh.

---

## 1. Onboarding flash + hanging tour

Root causes:
- `Dashboard.tsx` redirects to `/onboarding` whenever `store` is missing. On the very first sign-in (no store row yet) the route `/dashboard` is rendered for a tick → `TourProvider` auto-starts the dashboard tour (anchors are already in the DOM) → the redirect fires next render, but the `driver.js` overlay is not destroyed on navigation, so the tooltip stays floating over `/onboarding`.
- The `pic2cart:tour:<uid>:dashboard` localStorage key is never set until the user finishes / dismisses the tour, so it pops again on the next login.

Fixes (all in `src/`):

- `TourProvider.tsx`
  - In the auto-start effect, **return a cleanup function that destroys any running driver and clears `runningRef`** so a route change immediately kills the tour.
  - Gate auto-start with an "app is settled" check: skip starting if `document.querySelector('[data-onboarding-route]')` matches OR the URL is `/dashboard` but the user has not yet completed onboarding. We get this signal cheaply by reading the `stores.onboarding_step` from a lightweight context (see below).
  - Add a small `useStore()` import inside `TourProvider` (it already sits under `StoreProvider` in `App.tsx`) and skip auto-start when `store && store.onboarding_step !== null && store.onboarding_step < 4`.

- `Dashboard.tsx`
  - Keep the existing `loading || !user` guard but also guard on `store === null` becoming known: render the spinner (don't render `HeroGreeting` etc.) while `!store && !loading && user` so the tour anchors are NOT in the DOM during the redirect tick. This prevents the tour from auto-starting even in race conditions.

Result: returning users skip the tour (gate now keys off DB row, not just localStorage); brand new users never see the dashboard tour during the redirect to `/onboarding`.

---

## 2. Dynamic theme categories (admin-managed)

Use `theme_category_briefs` as the single source of truth (already exists; the generator already reads from it). Add admin CRUD and switch all hardcoded category lists to read from it.

### Migration
Add columns if missing and helper view:
- `theme_category_briefs`: ensure `display_name`, `vertical`, `subcategory`, `sort_order`, `is_active`, plus a new optional `icon` (text, lucide name) and `merchant_facing` (boolean, default true) so admin can hide internal-only briefs from the merchant onboarding picker.
- No table creation needed (table exists); just `ALTER TABLE ADD COLUMN IF NOT EXISTS`.

### Admin UI — `src/pages/admin/AdminThemes.tsx`
- New tab **Categories** between *Master Projects* and *Generator*.
- Implement `CategoriesTab` component: list/create/edit/delete rows in `theme_category_briefs`. Fields: vertical, subcategory, display name, icon (lucide name), sort order, active, merchant-facing toggle.
- Replace the hardcoded `const CATEGORIES = [...]` and the `<Select>` in `ThemeMasterForm` with values fetched from `theme_category_briefs` (cached via React Query key `theme-categories`).

### Generator & edit form
- `ThemeMasterPipeline.tsx` already reads `theme_category_briefs` — no change needed beyond reusing the same hook so it stays in sync.
- The "Edit theme" dialog uses `ThemeMasterForm`, so it automatically picks up the new dynamic dropdown.

---

## 3. Onboarding: filter themes by chosen category

`src/components/onboarding/StepTheme.tsx`:
- Receive `data.category` (already on `OnboardingData`).
- Build a slug→vertical map by reading `theme_category_briefs` so e.g. merchant onboarding `fashion` matches theme master `category = 'fashion'` (we'll alias known synonyms: `food` ↔ `food`, `beauty` ↔ `beauty`, `beauty_services`/`healthcare` ↔ `services`, `electronics` ↔ `electronics`, `handmade` ↔ `home-decor`/`crafts`, `grocery` ↔ `grocery`, `other` ↔ no filter).
- Split themes into three buckets and render in order: **Recommended for {category}** (matches), **Trending** (is_default, not already shown), **Other themes**.
- Auto-pick the first **recommended** theme instead of the first overall, so Continue isn't blocked but the default matches the chosen vertical.

---

## 4. Visit Site ribbon visible immediately after Go Live

`src/pages/Onboarding.tsx`, `onFinish` in `StepGoLive`:
- After the final `supabase.from('stores').update({ is_published: true, ... })`, also `setStore({ ...store, is_published: true, settings: currentSettings, onboarding_step: TOTAL_STEPS })` so the `StoreContext` cache is already correct before `navigate('/dashboard')`.
- `Dashboard.tsx` already renders the "Your store is live at … View" ribbon when `store?.is_published && storeUrl` — once the context is fresh, it will show on first paint without any refetch wait.
- As a belt-and-braces, also call `refetchStore()` after the navigate so the row reflects the freshly updated `homepage_sections`.

---

## Files touched

- `supabase/migrations/<ts>_theme_categories_admin.sql` — add columns to `theme_category_briefs`.
- `src/pages/admin/AdminThemes.tsx` — new Categories tab, dynamic dropdown.
- `src/components/admin/ThemeMasterPipeline.tsx` — use shared hook (minor).
- `src/components/onboarding/StepTheme.tsx` — category-aware sections + smart default.
- `src/components/onboarding/StepGoLive.tsx` / `src/pages/Onboarding.tsx` — update local store cache before navigate.
- `src/tours/TourProvider.tsx` — cleanup on route change + onboarding gate.
- `src/pages/Dashboard.tsx` — hide tour anchors while the onboarding redirect is in flight.

No database destructive changes; categories table is non-breaking additive.
