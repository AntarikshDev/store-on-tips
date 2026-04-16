

# Premium Product Experience — Storefront & Merchant Overhaul

## What This Delivers
A world-class product detail page for customers (inspired by Myntra, Nykaa, Amazon India) and an intelligent, category-aware product form for merchants. Every element is designed to maximize conversion and delight.

---

## Part A: Customer-Facing Product Page (StorefrontProduct.tsx)

### 1. Image Gallery Upgrade
- **Desktop**: Vertical thumbnail rail on the left, large image on the right with smooth crossfade transitions and image zoom on hover (CSS transform scale on mousemove)
- **Mobile**: Keep swiper but add pinch-to-zoom feel with larger dots and image counter ("2/5")
- Fade-in animation when the page loads

### 2. "Buy Now" Button + Dual CTA
- Add a **"Buy Now"** button alongside "Add to Cart" — navigates directly to checkout with the product
- Desktop: Two side-by-side buttons (Add to Cart outline, Buy Now filled)
- Mobile sticky bar: Two buttons — "Add to Cart" + "Buy Now"

### 3. Variant Selector (Size/Color/Weight)
- Render product `variants` as interactive pill selectors on the product page
- Color variants show color swatches, size variants show pill buttons
- Selected variant highlighted with primary color border + scale animation

### 4. Delivery & Trust Signals
- **Pincode Checker** integrated inline (already exists, just needs to be wired in)
- **Trust badges row**: Free Shipping / Easy Returns / Secure Payment / COD Available — shown as icon + text chips with subtle entrance animation
- **Estimated delivery date** display

### 5. Product Info Accordion
- Replace flat description with expandable accordion sections:
  - Description (open by default)
  - Additional Information (weight, dimensions, material — from product metadata)
  - Shipping & Returns policy
  - Reviews summary link
- Smooth height animation on open/close

### 6. "You May Also Like" Section
- Query other products from same category/store
- Horizontal scrollable product card carousel at bottom
- Cards with hover lift effect, rating badge, wishlist heart

### 7. Enhanced Reviews Section
- Add photo reviews display (images already supported in DB)
- Review photos shown as mini gallery thumbnails
- "Most Helpful" sorting
- Animated progress bars for rating distribution

### 8. Visual Polish & Animations
- Page entrance: image slides in from left, details fade in from right (CSS keyframes)
- Price: animated count-up effect on discount percentage
- "Added to Cart" success: confetti-like micro-animation on the button
- Smooth scroll to reviews when clicking rating badge
- Breadcrumb with category trail (Home > Category > Product)

---

## Part B: Merchant Product Form (ProductForm.tsx)

### 1. Product Type Selector
- Add a **"Product Type"** dropdown at the top of the form with options:
  - Physical Product (default)
  - Digital Product
  - Food & Beverage
  - Fashion & Apparel
  - Electronics
  - Beauty & Cosmetics
  - Handmade / Craft
  - Service
- Default pre-selected based on merchant's store category from onboarding

### 2. Category-Aware Dynamic Fields
Each product type shows/hides relevant fields:

| Product Type | Extra Fields |
|---|---|
| **Fashion** | Material, Care Instructions, Fit Type (Slim/Regular/Loose), Gender |
| **Food** | Ingredients, Nutritional Info, Shelf Life, Allergens, FSSAI License |
| **Electronics** | Warranty Period, Model Number, Power Rating, Connectivity |
| **Beauty** | Ingredients, Skin Type, Usage Instructions, Expiry Date |
| **Handmade** | Making Time, Customization Available (toggle), Material |
| **Digital** | File Format, Download Link, License Type |

These are stored in the existing `ai_generated_data` JSON column (no migration needed).

### 3. Rich Description Editor
- Add tab switcher: "Plain Text" / "Highlights"
- Highlights mode: bullet-point key features editor (add/remove/reorder)
- These render as formatted feature bullets on the storefront

### 4. Improved AI Generation
- Pass the selected product type to the AI so it generates type-specific descriptions, features, and metadata
- Auto-populate the dynamic fields based on AI analysis of the image

### 5. Product Preview Card
- Live mini-preview of how the product card will look on the storefront (in the sidebar)
- Updates in real-time as merchant fills in details

---

## Part C: Mobile Add-to-Cart Bar Enhancement
- Redesign to include both "Add to Cart" (outline) and "Buy Now" (filled) buttons
- Add quantity selector inline in the bar
- Show selected variant (e.g., "Size: M") as a chip

---

## Technical Changes

| File | Change |
|---|---|
| `src/pages/StorefrontProduct.tsx` | Complete redesign — image gallery, variant selector, dual CTAs, accordion, trust badges, related products, animations |
| `src/components/storefront/MobileAddToCart.tsx` | Add Buy Now button, quantity controls, variant chip |
| `src/components/storefront/ProductImageSwiper.tsx` | Add image counter, improved dots |
| `src/pages/ProductForm.tsx` | Product type selector, dynamic category fields, highlights editor, live preview card |
| `src/components/products/VariantMatrix.tsx` | Expand presets for all product types |
| `src/components/storefront/RelatedProducts.tsx` | **New** — horizontal carousel of same-category products |
| `src/components/storefront/TrustBadges.tsx` | **New** — reusable trust signals row |
| `src/components/storefront/ProductAccordion.tsx` | **New** — animated accordion for product details |
| `src/components/products/ProductTypeFields.tsx` | **New** — dynamic fields per product type |
| `src/components/products/ProductPreviewCard.tsx` | **New** — live storefront preview in product form |
| `src/index.css` | Add keyframe animations for page entrance, zoom, fade effects |

No database migrations needed — all additional product metadata stored in existing `ai_generated_data` JSONB column.

