

# Cost & Speed Optimization for Theme Generation

## Current Cost Breakdown (per theme)

| Component | Tokens/Cost | Time |
|-----------|------------|------|
| Structure AI call (Gemini Flash) | ~3,000-5,000 tokens | 5-8s |
| Image generation (5 images) | ~5,000 tokens + ₹17.5 | 15-25s (sequential) |
| **Total** | **~₹18-20 per theme** | **20-30s** |

The AI regenerates **everything from scratch** every time — identical section structures, similar testimonials, same trust badge patterns. This is wasteful.

---

## Optimization Strategy: Template + Tweak Architecture

### 1. Section Blueprint Library (DB table)

Store pre-built section JSON blueprints in a `theme_section_blueprints` table. Each blueprint is a complete, battle-tested section config (testimonials with 4 quotes, trust badges with 6 icons, brand marquee with 8 names, etc.).

- ~50 blueprints covering all 15 section types × multiple layouts
- Admin can curate/edit blueprints from previously generated themes
- AI no longer invents section content — it **selects and customizes** from the library

**Cost saving**: Eliminates ~60% of output tokens (section content is the bulk of the response).

### 2. Image Pool with Category Tags

Store all previously generated images in a `theme_image_pool` table with category and section-type tags. Before generating new images:

1. Query pool for matching `category + section_type`
2. If 3+ matches exist, reuse them (randomly pick)
3. Only generate images for sections with no pool matches

**Cost saving**: After 3-4 themes per category, image generation drops to near-zero. That's ₹14-17.5 saved per theme.

### 3. Two-Tier AI Prompting

Replace the single massive prompt with a lightweight "design brief" call:

**Tier 1 — Design DNA only** (cheap, ~800 tokens output):
- AI returns: name, description, color palette, font pair, gradient, section order (by type only), mood adjectives
- No section content, no testimonials, no badge text

**Tier 2 — Deterministic Assembly** (zero AI cost):
- Edge function assembles the full theme by:
  - Picking blueprints matching the section types from Tier 1
  - Applying the color palette to all sections
  - Pulling images from the pool
  - Randomizing testimonial names, shuffling brand order, adjusting copy

**Cost saving**: ~70% fewer tokens. Structure call drops from ~4,000 to ~800 output tokens.

### 4. Parallel Image Generation

Current code generates images **sequentially** (for loop). Switch to `Promise.all` with a concurrency limit of 3. Cuts image generation time from 20s to ~8s.

### 5. "Remix Existing Theme" Feature

Add a "Remix" button on each theme card. Instead of generating from scratch:
- Clone the theme's section structure
- AI call only generates new colors + fonts + name (~300 tokens)
- Reuse all images and section content
- **Cost: near zero. Time: 2-3 seconds.**

---

## New Database Tables

### `theme_section_blueprints`
```
id, section_type, layout, variant_name, content_json, category_tags[], created_at
```
- Seeded from existing generated themes (extract sections)
- Admin can mark favorites

### `theme_image_pool`
```
id, category, section_type, image_url, created_at
```
- Auto-populated whenever a theme generates images
- Queried before generating new ones

---

## Projected Cost After Optimization

| Scenario | Before | After |
|----------|--------|-------|
| Fresh category (no pool) | ₹18-20 | ₹8-10 (smaller prompt) |
| Category with pool (3+ themes exist) | ₹18-20 | ₹0.50-1.50 (no images) |
| Remix existing theme | ₹18-20 | ₹0.10-0.30 |
| **Average after 10 themes** | ₹18-20 | **₹1-3** |

---

## Files to Create/Edit

| File | Change |
|------|--------|
| Migration | Create `theme_section_blueprints` and `theme_image_pool` tables |
| `supabase/functions/generate-theme-pack/index.ts` | Two-tier prompt, pool lookup, parallel images, blueprint assembly |
| `supabase/functions/remix-theme/index.ts` | New lightweight function for remixing |
| `src/pages/admin/AdminThemes.tsx` | Add "Remix" button, seed blueprints action |
| `src/hooks/useThemePacks.ts` | Add `useRemixTheme` mutation |

## Execution Order

1. **Migration** — Create blueprint + image pool tables
2. **Edge function** — Rewrite generate-theme-pack with two-tier + pool logic, add remix-theme function
3. **Seed blueprints** — Extract sections from existing themes into blueprints table
4. **Admin UI** — Remix button, cost indicator on generate modal showing estimated savings

