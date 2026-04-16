

# Fix Theme Preview — Complete Website Experience

## Issues Identified

1. **Images not showing in preview**: The edge function saves images with keys like `home_hero` but assigns them checking `generatedImages[key]` where `key = "home_" + section.type`. Meanwhile, `image_prompts` from AI return `section` values that may not match this pattern. The mapping is broken.

2. **Footer has "Link 1, Link 2, Link 3"**: Hardcoded placeholder text instead of real industry-standard links.

3. **Only home page generated**: The `pages` object only contains `{ home: [...] }`. No Shop, About, Blog, Contact, Privacy Policy, Return Policy, etc.

4. **Pop-up wireframe preview lacks full experience**: The wireframe modal should show a responsive mini-browser, not just static boxes.

---

## Fix Plan

### 1. Fix Image Mapping in Edge Function

The `image_prompts` from AI have `section` values like `"hero"`, `"featured_products"` etc. But the code stores them as `generatedImages["hero"]` and later looks for `generatedImages["home_hero"]`. Fix the key mismatch — use consistent keys.

**File**: `supabase/functions/generate-theme-pack/index.ts`

### 2. Generate All Pages in Edge Function

Expand the `pages` object to include complete pages using deterministic assembly (no extra AI cost):

- **home** — Already exists (sections array)
- **shop** — Product grid layout config
- **about** — Brand story, team, mission
- **blog** — Blog grid layout
- **contact** — Contact form, map placeholder, store info
- **privacy_policy** — Full legal text template
- **return_policy** — Return & refund policy template  
- **terms** — Terms of service template
- **shipping_policy** — Shipping info template
- **faq** — Common Q&A

All pages use the same `theme_config` colors/fonts. Legal pages use industry-standard boilerplate with store name injected. Zero additional AI tokens.

**File**: `supabase/functions/generate-theme-pack/index.ts`

### 3. Fix Footer with Real Links

Replace "Link 1/2/3" with proper links organized by column:

- **Quick Links**: Shop, New Arrivals, Best Sellers, Sale
- **Support**: Contact Us, FAQ, Shipping Info, Track Order
- **Legal**: Privacy Policy, Return Policy, Terms of Service

Both in `ThemePreview.tsx` and `Storefront.tsx`.

**Files**: `src/pages/ThemePreview.tsx`, `src/pages/Storefront.tsx`

### 4. Add Multi-Page Rendering in ThemePreview

Add a page navigation system at the top so the preview renders all pages (Home, Shop, About, Contact, Privacy, Returns, etc.) — user can click nav links to switch between page views within the preview. This makes it a complete website experience.

**File**: `src/pages/ThemePreview.tsx`

### 5. Upgrade Pop-up Wireframe in AdminThemes

Replace the static wireframe with an embedded iframe of the actual ThemePreview page, with responsive toggles (Desktop/Tablet/Mobile). This gives the admin a true responsive preview experience inside the dialog.

**File**: `src/pages/admin/AdminThemes.tsx`

---

## Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/generate-theme-pack/index.ts` | Fix image key mapping, add multi-page generation |
| `src/pages/ThemePreview.tsx` | Multi-page navigation, fix footer links, render About/Shop/Contact/Policy pages |
| `src/pages/admin/AdminThemes.tsx` | Replace wireframe with iframe preview + responsive toggles |
| `src/pages/Storefront.tsx` | Fix footer links (same pattern) |

## Execution Order

1. Fix edge function (image keys + multi-page generation)
2. Upgrade ThemePreview with multi-page rendering + proper footer
3. Fix Storefront footer
4. Upgrade admin wireframe popup to iframe preview

