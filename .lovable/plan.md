# Phase 8: Coupons, Notifications & SEO

## 8A: Coupons & Discounts

### Database
- New `coupons` table: id, store_id, code, type (percentage/flat), value, min_order_amount, max_uses, used_count, starts_at, expires_at, is_active

### UI
- Coupon List Page (`/coupons`): CRUD with active toggle, usage stats
- Coupon Form: code generator, type/value, date pickers, limits
- Storefront Checkout: apply coupon code, real-time discount on subtotal

### Files
- New: `src/pages/CouponList.tsx`, `src/pages/CouponForm.tsx`, `src/hooks/useCoupons.ts`
- Modified: `StorefrontCheckout.tsx`, `App.tsx`, `DashboardLayout.tsx`

## 8B: Customer Notifications

### Edge Function
- `send-order-notification`: emails on order confirmed, shipped, new order alert to seller
- Uses Lovable AI for HTML rendering

### Files
- New: `supabase/functions/send-order-notification/index.ts`
- Modified: `OrderDetail.tsx`

## 8C: SEO & Marketing Tools

### Features
- SEO settings page: meta title, description, OG image for store
- SEOHead component: dynamic title/meta/OG tags on storefront pages
- JSON-LD Product structured data
- Social sharing preview

### Files
- New: `src/components/storefront/SEOHead.tsx`, `src/pages/SEOSettings.tsx`
- Modified: `Storefront.tsx`, `StorefrontProduct.tsx`, `App.tsx`, `DashboardLayout.tsx`