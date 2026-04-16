

# Premium Theme Engine Overhaul — Above Market Standards

## Honest Assessment

**Current rating: 3/10.** The screenshots show placeholder grey boxes, no animations, no micro-interactions, and a single-page structure that feels like a prototype. Shopify's free "Dawn" theme ships with smooth scroll animations, parallax heroes, hover glare effects, testimonial carousels, countdown timers, and Instagram feeds — all out of the box. At ₹499+GST, buyers expect at minimum what they'd get for free elsewhere.

## What's Missing vs. Shopify/WordPress Free Themes

| Feature | Shopify Free | Current State |
|---------|-------------|---------------|
| Hero parallax / Ken Burns zoom | Yes | None |
| Product card hover glare/tilt | Yes | Basic scale only |
| Scroll reveal animations | Yes | Hook exists, rarely used |
| Testimonials carousel | Yes | Section type exists, not rendered |
| Countdown / flash sale timer | Yes | Missing entirely |
| Trust badges row | Yes | Missing |
| Instagram/social feed | Yes | Missing |
| Category grid with images | Yes | Text-only buttons |
| Brand logo marquee | Yes | Missing |
| Back-to-top button | Yes | Missing |
| Sticky add-to-cart on scroll | Yes | Missing from storefront |
| Video hero support | Yes | Missing |
| Announcement bar | Yes | Missing |

---

## The Plan

### Part A: Massively Expand Theme Section Types & Effects

Add these new section types to both the AI generation prompt and the storefront renderer:

**New section types:**
- `testimonials` — Animated carousel with avatar, name, rating, quote
- `countdown_timer` — Flash sale / launch countdown with flip-clock animation
- `trust_badges` — Row of icons (Free Shipping, Secure Payment, Easy Returns, etc.)
- `brand_marquee` — Infinite scrolling logo/brand strip (CSS animation)
- `image_with_text` — Split 50/50 layout (image left, text right or vice versa)
- `video_hero` — YouTube/MP4 background hero
- `instagram_feed` — Placeholder grid mimicking social proof
- `collection_showcase` — Large image cards with overlay text for categories
- `announcement_bar` — Sticky top bar with dismiss

**New animation/effect options for the AI:**
- `fade-in`, `slide-up`, `slide-in-left`, `slide-in-right`, `scale-in` (existing)
- `parallax` — Background attachment fixed
- `ken-burns` — Slow zoom on hero images via CSS keyframe
- `stagger-children` — Children animate one-by-one with delay
- `blur-in` — Blur to sharp reveal
- `flip-up` — 3D rotate-X entrance
- `bounce-in` — Overshoot spring
- `typewriter` — Text reveal character by character

**New card effects:**
- `hover-glare` — Glossy light sweep on hover (CSS gradient animation)
- `hover-tilt` — 3D perspective tilt on mouse move
- `hover-lift` — Shadow + translateY
- `hover-border-glow` — Animated border color pulse
- `hover-zoom-image` — Inner image scale on card hover (already partial)

### Part B: Enhance the Generate Theme Pack AI Prompt

Expand the tool-calling schema to include all new section types, animation options, and card effects. The AI prompt will demand:
- 8-12 home sections (not just 4-5)
- Every section must have a non-"none" animation
- Card effects specified per product section
- Announcement bar text
- Trust badge selection
- Color gradients (optional gradient backgrounds)

### Part C: Upgrade the Style Hints UI in GenerateModal

Replace the plain textarea with a rich, guided form:

**Organized into collapsible sections:**

1. **Mood & Aesthetic** — Radio chips: Minimalist, Luxurious, Bold, Playful, Earthy, Futuristic, Vintage, Editorial
2. **Animation Intensity** — Slider: Subtle → Dramatic (maps to animation density in prompt)
3. **Card Effects** — Multi-select chips: Glare, Tilt 3D, Lift Shadow, Border Glow, Zoom Image
4. **Hero Style** — Radio: Parallax, Ken Burns Zoom, Video Background, Split Layout, Full Bleed
5. **Color Mood** — Radio: Warm, Cool, Monochrome, Vibrant, Pastel, Dark, Earth Tones
6. **Typography Feel** — Radio: Modern Sans, Classic Serif, Handwritten, Geometric, Mixed
7. **Sections to Include** — Multi-select checklist with smart defaults per category:
   - Announcement Bar, Testimonials, Countdown Timer, Trust Badges, Brand Marquee, Instagram Feed, Collection Showcase, Newsletter, FAQ Accordion
8. **Special Requests** — Free text textarea for anything extra

Each time the modal opens, category-specific smart defaults are pre-selected. E.g., "fashion" auto-selects Parallax hero + Glare cards + Testimonials + Instagram; "food" auto-selects Earthy colors + Split hero + Trust badges.

**"Surprise Me" button** — Randomizes all selections for quick generation.

### Part D: Upgrade Storefront Renderer

Update `Storefront.tsx` to render all new section types with proper animations and effects. Add CSS classes/keyframes to `index.css` for:
- Ken Burns zoom keyframe
- Hover glare gradient animation
- Tilt 3D effect (CSS perspective + JS mousemove)
- Brand marquee infinite scroll
- Flip-clock countdown styling
- Stagger-children delay utility
- Blur-in, flip-up, bounce-in keyframes

### Part E: Upgrade ThemePreview.tsx

The full-page preview (opened via external link) must also render all new section types with actual animations, not just wireframes.

---

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/index.css` | Add 10+ new keyframe animations and utility classes |
| `src/hooks/useAnimateOnScroll.ts` | Add new animation types (blur-in, flip-up, bounce-in, stagger, ken-burns) |
| `src/pages/admin/AdminThemes.tsx` | Rewrite `GenerateModal` with rich style hints UI |
| `supabase/functions/generate-theme-pack/index.ts` | Expand prompt + tool schema with all new sections/effects |
| `src/pages/Storefront.tsx` | Add renderers for testimonials, countdown, trust badges, marquee, image_with_text, video_hero, instagram_feed, collection_showcase, announcement_bar |
| `src/pages/ThemePreview.tsx` | Mirror all new section renderers |
| `src/components/storefront/AnimatedSection.tsx` | Support new animation types |
| `src/components/storefront/StorefrontLayout.tsx` | Add announcement bar support |

## Execution Order

1. CSS animations & hook upgrades (foundation)
2. GenerateModal rich UI (admin UX)
3. Edge function prompt expansion (AI quality)
4. Storefront renderer + ThemePreview (customer-facing output)

