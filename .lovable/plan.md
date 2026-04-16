

# Theme Cost Management & Free Themes for Stores

## Problem
1. **Blank store pages**: Stores like `pictocart.in/store/indilipi` show blank because the `resolveTheme` function may fail silently when `themeData.name` (e.g., "fresh-green") doesn't match with extended theme properties like `colors` that are already flattened into the theme object.
2. **No free theme packs**: All AI-generated theme packs in `theme_packs` table cost ₹499. Free-plan sellers can only use the 2 built-in basic themes from `THEME_TEMPLATES` but get no rich homepage sections.
3. **No discount/pricing controls**: Admin can set price but has no discount system for theme packs.

## Plan

### 1. Fix blank store page
- Debug the `resolveTheme` function in `StorefrontLayout.tsx` — the Indilipi store has `theme.name: "fresh-green"` with colors already embedded. The function correctly handles this. The blank page is likely caused by the background color matching the text color or a CSS issue. Will add a safety fallback and ensure the default hero section always renders.

### 2. Add price tiers for theme packs (Admin side)
In `AdminThemes.tsx` theme editor, add:
- **"Free" toggle**: Quick switch to set price = 0 (alongside existing price input)
- **Compare-at price (MRP)**: A strikethrough price to show discounts (e.g., ~~₹499~~ ₹199)
- **Discount badge**: Auto-calculated percentage shown on the card
- Add `compare_at_price` column to `theme_packs` table via migration

### 3. Auto-assign a default theme pack to new stores
- When a seller completes onboarding and selects a built-in theme (e.g., "minimal-light"), auto-generate default `homepage_sections` based on the selected theme template so the store is never blank.
- Create a utility function `generateDefaultSections(themeId, storeName)` that produces hero + featured_products + trust_badges + newsletter sections.

### 4. Show free themes prominently in ThemeMarketplace
- In `ThemeMarketplace.tsx`, separate free themes at top with "Free Themes" heading
- Show discount badges (e.g., "50% OFF") for discounted themes
- Show "FREE" badge for price=0 themes instead of Crown icon

### 5. Ensure at least 2 free theme packs exist
- Admin should mark at least 2 existing theme packs as free (price=0) and published
- The ThemeMarketplace will show these to free-plan users

## Technical Changes

| File | Change |
|------|--------|
| **Migration** | Add `compare_at_price integer default null` to `theme_packs` |
| `src/pages/admin/AdminThemes.tsx` | Add free toggle, compare_at_price input, discount badge in editor |
| `src/components/store-design/ThemeMarketplace.tsx` | Separate free/paid sections, show discount badges, "FREE" labels |
| `src/hooks/useThemePacks.ts` | Update `ThemePack` interface with `compare_at_price` |
| `src/pages/Onboarding.tsx` | On go-live step, auto-generate default `homepage_sections` if none exist |
| `src/lib/defaultSections.ts` | New utility: `generateDefaultSections()` returns hero, products, trust badges, newsletter |
| `src/pages/Storefront.tsx` | Defensive fix for theme resolution + ensure default sections render |

