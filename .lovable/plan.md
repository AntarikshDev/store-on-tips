

# Store On Tips — Market-Ready SaaS Audit & Completion Plan

## Current State Assessment

After auditing every route, component, edge function, and database table, here is the complete status:

### What Works
- Landing page with SEO, animations, pricing, testimonials
- Seller auth (email/password, forgot password, reset password)
- 10-step onboarding wizard (store name → go live)
- Product CRUD with AI generation (Gemini Flash)
- Order management with status tracking
- Customer storefront with dynamic theming
- Customer auth (email, phone OTP, Google OAuth)
- Customer account (profile, addresses, order history)
- Cart and checkout (COD + Razorpay)
- Blog system with AI generation
- Coupon management with validation
- Store design editor (themes, header, footer, homepage builder)
- Theme marketplace with AI generation + remix + cost optimization
- Shipping integration (Delhivery)
- Custom domain setup with DNS verification
- SEO settings, analytics/engagement report
- Admin panel (stores, users, themes, revenue)
- Newsletter subscribers
- Product reviews and ratings

### Critical Bugs Found

| Issue | Location | Impact |
|-------|----------|--------|
| Dashboard checklist links are wrong | `Dashboard.tsx` lines 64-68 | `/shipping` → should be `/settings/shipping`, `/domain` → `/settings/domain`, `/seo` → `/settings/seo`, `/blog/new` → `/blog-posts/new` |
| Landing page footer links are dead `href="#"` | `LandingPage.tsx` lines 665-686 | About, Careers, Blog, Contact, Help, Privacy, Terms all go nowhere |
| No Google OAuth for sellers | `Auth.tsx` | Only email/password — customers get Google but sellers don't |
| Razorpay key stored in plain text in DB | `PaymentSettings.tsx` | `key_secret` stored unencrypted in `stores.settings` JSONB — security risk |
| No email verification enforced for sellers | `Auth.tsx` line 43 | `signUp` shows toast "check email" but no gate — user can proceed unverified |
| Sidebar logo says "Antariksh" not "Store on Tips" | `DashboardLayout.tsx` line 79 | Wrong brand name in seller dashboard |
| No subscription/billing system | Entire app | Pricing shows ₹499/month Premium but no actual billing exists |
| No real-time order notifications | Dashboard | Seller has no way to know about new orders without refreshing |
| Checkout uses `totalPrice` instead of `finalTotal` for Razorpay amount | `StorefrontCheckout.tsx` line 188 | Razorpay charges full price even when coupon is applied |
| `send-order-notification` edge function — no Resend/email provider configured | Edge function | Notification emails likely fail silently |

### Missing Features for Market-Ready Launch

| Feature | Priority | Effort |
|---------|----------|--------|
| **Subscription billing** (Free/Premium plans) | Critical | Large |
| **Platform legal pages** (Privacy, Terms, Refund for Store on Tips itself) | Critical | Medium |
| **Email delivery** (Resend connector for transactional emails) | Critical | Medium |
| **Google OAuth for sellers** | High | Small |
| **Invoice PDF generation** for orders | High | Medium |
| **Inventory deduction on order** | High | Small |
| **Order status email notifications** (shipped, delivered) | High | Medium |
| **Storefront "About", "Contact", policy pages** for seller stores | High | Medium |
| **WhatsApp order notifications** | Medium | Small |
| **Mobile app install banner** (PWA improvements) | Medium | Small |
| **Multi-currency support** | Low | Large |

---

## Execution Plan

### Phase 1: Critical Bug Fixes (must-fix before launch)

**1.1 Fix Dashboard Checklist Broken Links**
- File: `src/pages/Dashboard.tsx`
- Change `/shipping` → `/settings/shipping`, `/domain` → `/settings/domain`, `/seo` → `/settings/seo`, `/blog/new` → `/blog-posts/new`

**1.2 Fix Brand Name in Sidebar**
- File: `src/components/DashboardLayout.tsx`
- Change "Antariksh" → "Store on Tips", logo letter "A" → "S"

**1.3 Fix Razorpay Coupon Bug**
- File: `src/pages/StorefrontCheckout.tsx`
- Line 188: Change `totalPrice` → `finalTotal` so Razorpay charges the discounted amount

**1.4 Fix Landing Page Dead Links**
- File: `src/pages/LandingPage.tsx`
- Create routes for `/about`, `/privacy`, `/terms`, `/refund`, `/contact`, `/help` or link to scroll sections
- At minimum create static pages for Privacy Policy and Terms of Service (legally required)

**1.5 Add Google OAuth for Sellers**
- File: `src/pages/Auth.tsx`
- Add Google sign-in button using `lovable.auth.signInWithOAuth('google')`

### Phase 2: Email & Notifications (Resend Integration)

**2.1 Connect Resend Connector**
- Use the Resend connector (available in workspace connectors)
- Link to project for `RESEND_API_KEY`

**2.2 Update `send-order-notification` Edge Function**
- Use Resend gateway API for sending order confirmation, shipping, and delivery emails
- HTML email templates for: order confirmed, order shipped, order delivered

**2.3 Add Seller New Order Notification**
- Real-time via Supabase Realtime on `orders` table
- Dashboard shows toast/badge when new order arrives

### Phase 3: Subscription & Billing

**3.1 Add Subscription Plans**
- Create `subscriptions` table: `store_id, plan (free|premium), status, started_at, expires_at, razorpay_subscription_id`
- Create `subscription-webhook` edge function for Razorpay subscription events

**3.2 Feature Gating**
- Free plan: 10 products, 1 theme, basic analytics, COD only
- Premium (₹499/mo): Unlimited products, premium themes, custom domain, Razorpay, shipping, blog, coupons, advanced analytics
- Gate features in dashboard based on active plan

**3.3 Subscription UI**
- Add billing page in dashboard sidebar
- Show current plan, upgrade/downgrade, payment history

### Phase 4: Store Completeness

**4.1 Storefront Policy Pages**
- Add routes: `/store/:slug/privacy`, `/store/:slug/terms`, `/store/:slug/returns`, `/store/:slug/shipping-policy`, `/store/:slug/contact`, `/store/:slug/about`
- Render from `store.settings.policies` or theme pack `pages` data
- Footer links point to these routes

**4.2 Inventory Management**
- Deduct `inventory_count` on successful order
- Show "Out of Stock" badge when `inventory_count === 0`
- Prevent adding to cart when out of stock

**4.3 Invoice PDF Generation**
- Edge function to generate GST-ready invoice PDF
- Download from order detail page (seller) and customer account

### Phase 5: Platform Legal & Compliance Pages

**5.1 Create Static Pages**
- `/privacy-policy` — Store on Tips privacy policy
- `/terms` — Terms of service
- `/refund-policy` — Platform refund policy
- These are for the platform itself, not individual stores

**5.2 Update Landing Page Footer**
- Link all footer items to actual routes

### Phase 6: Production Hardening

**6.1 Security**
- Move Razorpay secrets to encrypted edge function secrets instead of `stores.settings` JSONB
- Add rate limiting on auth endpoints
- Add CAPTCHA on signup if needed

**6.2 Performance**
- Add React.lazy for route-level code splitting
- Image optimization with lazy loading
- Add error boundaries

**6.3 Monitoring**
- Add error tracking (edge function error logging)
- Add basic analytics tracking on storefront

---

## Third-Party Integrations Summary

| Service | Purpose | Current Status | Action |
|---------|---------|---------------|--------|
| **Razorpay** | Payment gateway (sellers) | Working (per-store keys) | Fix coupon amount bug |
| **Delhivery** | Shipping & logistics | Working (per-store API token) | No change needed |
| **Resend** | Transactional emails | Not connected | Connect via connector |
| **Google OAuth** | Social login | Customer only | Add for sellers |
| **Lovable AI (Gemini Flash)** | Product/theme/blog generation | Working | No change needed |
| **Razorpay Subscriptions** | Platform billing | Not implemented | Build subscription system |

## Execution Order

1. **Phase 1** — Bug fixes (1 implementation cycle)
2. **Phase 2** — Email via Resend (1 cycle)
3. **Phase 3** — Subscription billing (2 cycles)
4. **Phase 4** — Store completeness (1 cycle)
5. **Phase 5** — Platform legal pages (1 cycle)
6. **Phase 6** — Production hardening (1 cycle)

Total estimated: ~7 implementation cycles to market-ready launch.

