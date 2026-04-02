

# Phase 9: Customer Experience — Accounts, Reviews, Sharing & Mobile-First UX

This is a large feature set that transforms the storefront from a basic shopping page into a Myntra-like mobile-first experience with customer accounts, reviews, social sharing, and order tracking.

## Overview

We will build across 4 sub-phases in a single implementation pass:

### 9A: Customer Authentication (per-store)
- Customer sign-up/sign-in page at `/store/:slug/account/auth` with email+password, Google OAuth, and phone OTP
- Customers are separate from sellers — they use the same `auth.users` but get a `customer` role
- New `customers` table linking `user_id` to saved addresses and preferences
- Customer profile page at `/store/:slug/account` showing saved addresses, order history
- Auto-fill checkout from saved address

### 9B: Reviews & Ratings
- New `reviews` table: id, store_id, product_id, customer_id (user_id), rating (1-5), title, body, images, is_verified_purchase, created_at
- Star rating display on product cards and product detail page (average + count)
- Review submission form on product page (only for logged-in customers)
- Verified purchase badge (cross-reference with orders table)
- Seller can view reviews in dashboard

### 9C: Social Sharing
- Share button on product pages with Web Share API (native mobile share sheet)
- Fallback: copy link, WhatsApp, Twitter, Facebook share buttons
- Share button on store home page

### 9D: Mobile-First PWA Experience (Myntra-like)
- Bottom navigation bar on mobile: Home, Categories, Cart, Account (sticky, iOS-safe)
- Pull-to-refresh feel with smooth transitions
- Product image swipe gallery (touch-friendly)
- Floating "Add to Cart" bar on product page (mobile)
- PWA manifest + service worker via `vite-plugin-pwa` so customers can "install" the store
- Mobile-optimized search with instant filter
- Smooth page transitions and micro-animations

## Database Changes (Migration)

```sql
-- Customer role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

-- Customers table for saved addresses
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL,
  saved_addresses jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, store_id)
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  images text[] DEFAULT '{}',
  is_verified_purchase boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers
CREATE POLICY "Customers can manage own data" ON public.customers FOR ALL
  USING (auth.uid() = user_id);
CREATE POLICY "Store owners can view customers" ON public.customers FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customers.store_id AND stores.user_id = auth.uid()));

-- RLS policies for reviews
CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Store owners can view reviews" ON public.reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = reviews.store_id AND stores.user_id = auth.uid()));

-- Link orders to customer user_id (optional)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_user_id uuid;

-- Enable realtime for reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
```

## New Files

| File | Purpose |
|------|---------|
| `src/pages/storefront/CustomerAuth.tsx` | Sign up/in page with email, Google, phone OTP |
| `src/pages/storefront/CustomerAccount.tsx` | Profile, saved addresses, order history |
| `src/pages/storefront/CustomerOrders.tsx` | Order list + detail for customers |
| `src/components/storefront/CustomerRoute.tsx` | Auth guard for customer pages |
| `src/components/storefront/BottomNav.tsx` | Mobile bottom navigation (Home, Search, Cart, Account) |
| `src/components/storefront/ReviewSection.tsx` | Star ratings, review list, submit form |
| `src/components/storefront/ShareButton.tsx` | Web Share API + fallback social buttons |
| `src/components/storefront/ProductImageSwiper.tsx` | Touch-friendly image carousel |
| `src/components/storefront/MobileAddToCart.tsx` | Sticky bottom "Add to Cart" bar |
| `src/components/storefront/SearchOverlay.tsx` | Full-screen mobile search with instant results |
| `src/hooks/useCustomerAuth.ts` | Customer auth state per store |
| `src/hooks/useReviews.ts` | CRUD hooks for reviews |
| `src/hooks/useCustomerOrders.ts` | Fetch customer's orders by user_id |

## Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add customer account routes under `/store/:slug/account/*` |
| `src/components/storefront/StorefrontLayout.tsx` | Add BottomNav, account icon in header, mobile-first responsive updates |
| `src/pages/StorefrontProduct.tsx` | Add ReviewSection, ShareButton, ProductImageSwiper, MobileAddToCart |
| `src/pages/Storefront.tsx` | Add search, category filters, mobile grid, share button |
| `src/pages/StorefrontCheckout.tsx` | Auto-fill from saved address, link order to customer_user_id |
| `src/pages/StorefrontCart.tsx` | Mobile-optimized layout |
| `vite.config.ts` | Add `vite-plugin-pwa` for installable storefront |
| `index.html` | Add PWA meta tags, viewport, theme-color, apple-touch-icon |
| `package.json` | Add `vite-plugin-pwa` dependency |

## Technical Details

- **Google Sign-In**: Uses Lovable Cloud managed OAuth via `lovable.auth.signInWithOAuth("google")`
- **Phone OTP**: Uses Supabase `auth.signInWithOtp({ phone })` — requires phone auth enabled
- **PWA**: Service worker caches storefront assets; `navigateFallbackDenylist: [/^\/~oauth/]` for OAuth compatibility
- **Bottom Nav**: Fixed bottom bar with safe-area-inset padding for iOS; hidden on desktop
- **Reviews**: Average rating computed client-side from query; verified purchase checks `orders` table for matching `customer_user_id` + `product_id`
- **Share**: `navigator.share()` with fallback to clipboard + social URL buttons
- **Image Swiper**: CSS scroll-snap carousel with dot indicators, touch-friendly

