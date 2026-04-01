

# ACA Platform — Full Development Roadmap

## Current State
Auth, database schema (stores, products, orders, profiles, user_roles), dashboard layout with sidebar/mobile nav, and basic stats cards are complete. No functional pages beyond dashboard exist yet.

---

## Phase 2: Onboarding Wizard (Week 1)

**7-step guided wizard** at `/onboarding` — new users are redirected here automatically.

1. **Store Name** — input + live slug preview (`yourstore.antariksh.shop`)
2. **Category** — visual cards (Fashion, Food, Electronics, Handmade, Beauty, Grocery, Other)
3. **Upload Product Image** — drag-drop to `product-images` storage bucket
4. **AI Product Generation** — Lovable AI (Gemini 2.5 Flash) analyzes image → generates title, description, tags, category, price suggestion. Editable fields with "Regenerate" button.
5. **Store Preview** — live mock of how the storefront looks
6. **Payment Setup** — toggle COD / UPI / Razorpay (UI config saved to `stores.settings`)
7. **Go Live** — celebration confetti, shareable link, copy button

Progress saved to `stores.onboarding_step`. Skip/back on every step.

**Files**: `src/pages/Onboarding.tsx`, `src/components/onboarding/Step1-7.tsx`

---

## Phase 3: Product Management (Week 1-2)

### Product List (`/products`)
- Grid/list toggle, search bar, category filter
- Quick actions: edit, delete, toggle active/inactive
- Bulk select + delete

### Add/Edit Product (`/products/new`, `/products/:id`)
- **AI-first flow**: upload image → AI generates all fields (reuses onboarding AI)
- Manual override for every field
- Multiple image upload (up to 6)
- **Category-aware variant matrix**:
  - Fashion → Size (S/M/L/XL/XXL) × Color
  - Food → Weight (250g/500g/1kg) × Type
  - Electronics → Storage/Color
  - Custom variants
- Inventory count per variant, low-stock threshold alerts
- SEO fields (title, description) — AI-generated
- Compare-at price for showing discounts

**Edge function**: `generate-product` — accepts image URL, calls Gemini 2.5 Flash for analysis

---

## Phase 4: Order Management (Week 2)

### Order List (`/orders`)
- Status tabs: All, Pending, Confirmed, Shipped, Delivered, Cancelled
- Search by order number, customer name
- Date range filter
- Each row: order #, customer, items count, total, status badge, date

### Order Detail (`/orders/:id`)
- Customer info card (name, phone, email, address)
- Items table with images, qty, price
- Status timeline with update buttons (Confirm → Ship → Deliver)
- Payment status badge
- Notes field
- **Invoice download** — GST-ready PDF generated via edge function

**Edge function**: `generate-invoice` — creates PDF with store details, GST number, items, totals

---

## Phase 5: Shipping Integration — Delhivery (Week 2-3)

Delhivery is India's largest logistics provider with the best API for startups.

### Setup
- Edge function `delhivery-proxy` to handle API calls
- Store Delhivery API token as a secret
- Seller enters pickup address in settings

### Features
- **Create Shipment** — from order detail page, one-click "Ship with Delhivery"
- **Auto-fill AWB** (tracking number) from Delhivery response → saved to `orders.tracking_number`
- **Shipping Label** — PDF download from Delhivery API
- **Live Tracking** — embedded tracking widget using Delhivery tracking URL
- **Serviceability Check** — verify if delivery pincode is serviceable before confirming
- **Rate Calculator** — show shipping cost estimate based on weight + pincode

### Database
- Add `shipping_provider`, `shipping_label_url`, `weight_grams` columns to orders table

---

## Phase 6: Store Design & Themes — Monetization Engine (Week 3)

### Free Themes (3)
- **Minimal Light** — clean white, simple grid
- **Bold Dark** — dark background, high contrast
- **Classic Grid** — standard e-commerce layout

### Premium Themes (₹500 each) — Revenue Stream
- **Premium Fashion** — editorial layout, lookbook style
- **Artisan Craft** — warm tones, handmade feel
- **Modern Luxe** — premium feel, animations
- **Fresh Food** — vibrant colors, category-focused
- **Tech Store** — specs-focused, comparison cards

### Theme Customization
- Primary color picker
- Font selection (4 options)
- Banner image upload
- Layout toggles (grid vs list, show/hide sections)
- Logo placement options

### Purchase Flow
- Theme preview modal (full storefront mock)
- "Buy for ₹500" button → payment via platform's payment gateway
- Purchased themes unlocked permanently for that store

### Database
- New `theme_purchases` table: `store_id`, `theme_id`, `amount`, `payment_id`, `purchased_at`
- `stores.theme` stores active theme config

---

## Phase 7: Super Admin Panel (Week 3-4)

Accessible only to users with `admin` role. Separate layout at `/admin/*`.

### Admin Dashboard (`/admin`)
- Total stores, total orders, total revenue (platform-wide)
- New signups today, active stores count
- Revenue chart (daily/weekly/monthly)

### Store Management (`/admin/stores`)
- List all stores with owner, status, product count, order count
- Enable/disable stores
- View any store's dashboard

### Theme & Pricing Management (`/admin/themes`)
- Add/edit/remove premium themes
- Set prices dynamically (₹500 default, can change anytime)
- Toggle free ↔ premium for any theme
- View theme purchase revenue

### User Management (`/admin/users`)
- List all users, roles, store info
- Assign/revoke admin role
- Disable accounts

### Platform Settings (`/admin/settings`)
- Platform commission rate
- Default shipping rates
- Feature flags (enable/disable modules)
- Global announcement banner

### Revenue & Finance (`/admin/finance`)
- Theme purchase revenue
- Platform commission from orders (future)
- Payout tracking

---

## Phase 8: Custom Domain — One-Click Publish (Week 4)

### Seller Experience
1. Go to Settings → Domain
2. Enter custom domain (e.g., `mystore.com`)
3. Click "Connect Domain"
4. System shows DNS records to add (A record → platform IP, TXT for verification)
5. Seller logs into their domain registrar, adds records
6. Platform auto-verifies DNS propagation (polling every 30s)
7. Once verified → SSL provisioned → Store is LIVE

### Technical Implementation
- Edge function `verify-domain` — checks DNS records via DNS lookup API
- `custom_domains` table: `store_id`, `domain`, `status` (pending/verifying/active/failed), `verified_at`
- Status displayed in settings with clear instructions per registrar (GoDaddy, Namecheap, Google Domains, Hostinger)

---

## Phase 9: Payment Gateway — Multi-Tenant Razorpay (Week 4-5)

### Architecture
Platform acts as the merchant of record using Razorpay Route (split payments).

### Seller Setup
1. Settings → Payments
2. Toggle payment methods: COD, UPI, Card, Net Banking
3. Enter bank account details for settlements
4. Platform creates a Razorpay "linked account" via API

### Checkout Flow (buyer-side, future)
1. Buyer selects products → cart → checkout
2. Razorpay checkout opens (UPI/Card/Net Banking)
3. Payment received by platform's Razorpay account
4. Auto-split: seller gets (100% - platform commission), platform keeps commission
5. Settlement to seller's bank account (T+2 via Razorpay)

### Implementation
- Edge function `razorpay-proxy` — create orders, verify payments, manage linked accounts
- Store Razorpay key_id + key_secret as secrets
- `payments` table: `order_id`, `razorpay_payment_id`, `amount`, `status`, `commission`, `seller_payout`
- COD orders tracked separately with collection status

### Admin Controls
- Set platform commission % (default 2%)
- View all transactions
- Manual settlement triggers
- Refund management

---

## Phase 10: Analytics & AI Insights (Week 5)

### Seller Analytics (`/analytics`)
- Revenue graph (7d / 30d / 90d)
- Orders over time
- Top selling products
- Conversion rate (views → orders)
- Traffic sources (if referrer tracked)
- Average order value

### AI Insights Panel
- "Your best seller this week is X — consider adding variants"
- "Orders drop on weekends — try a weekend sale"
- "Product Y has no orders — improve photos or lower price"
- Generated via Lovable AI analyzing order + product data

---

## Phase 11: Settings & Support (Week 5)

### Store Settings (`/settings`)
- Store info (name, description, contact)
- GST details (GSTIN, business name, address)
- Bank account details
- Notification preferences (email/SMS for new orders)

### Auto-Generated Policies
- Privacy Policy, Return Policy, Terms & Conditions
- AI-generated based on store category + settings
- Editable by seller

### Support
- FAQ accordion
- Help articles
- "Contact Support" button (opens email/WhatsApp)

---

## Technical Architecture

```text
┌─────────────────────────────────────────────┐
│                FRONTEND (React)             │
│  Seller Panel  │  Admin Panel  │  Storefront│
└───────┬────────┴──────┬───────┴──────┬──────┘
        │               │              │
┌───────▼───────────────▼──────────────▼──────┐
│            LOVABLE CLOUD (Supabase)         │
│  Auth │ Database │ Storage │ Edge Functions  │
│       │          │         │                 │
│       │  stores  │ product │ generate-product│
│       │ products │ -images │ generate-invoice│
│       │  orders  │ store-  │ delhivery-proxy │
│       │ payments │ assets  │ razorpay-proxy  │
│       │ themes   │         │ verify-domain   │
│       │ domains  │         │                 │
└───────┬─────────────────────────────┬───────┘
        │                             │
   ┌────▼────┐                  ┌─────▼─────┐
   │Delhivery│                  │ Razorpay  │
   │   API   │                  │   API     │
   └─────────┘                  └───────────┘
```

### New Database Tables Needed
- `theme_purchases` — theme buying records
- `custom_domains` — domain verification tracking
- `payments` — payment transactions with splits
- Add columns to `orders` — shipping fields

### Edge Functions
- `generate-product` — AI product generation from image
- `generate-invoice` — GST invoice PDF
- `delhivery-proxy` — shipping API proxy
- `razorpay-proxy` — payment API proxy
- `verify-domain` — DNS verification

---

## Implementation Order (Recommended)

| Priority | Phase | Revenue Impact |
|----------|-------|---------------|
| 1 | Onboarding Wizard | Activation |
| 2 | Product Management | Core feature |
| 3 | Order Management | Core feature |
| 4 | Store Design + Themes | ₹500/theme revenue |
| 5 | Payment Gateway (Razorpay) | Commission revenue |
| 6 | Shipping (Delhivery) | Operational |
| 7 | Custom Domains | Premium feature |
| 8 | Super Admin Panel | Platform control |
| 9 | Analytics + AI | Retention |
| 10 | Settings + Support | Polish |

Each phase will be implemented one at a time, fully functional before moving to the next.

