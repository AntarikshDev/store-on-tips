

# Antariksh Commerce AI (ACA) — Seller Panel

## Overview
AI-first, no-code e-commerce platform for Indian sellers. Mobile-first, clean Shopify-like UI with vibrant orange (#F97316) branding. Full-stack with Lovable Cloud (database, auth, edge functions, AI).

---

## Phase 1: Foundation & Auth

### Design System
- Primary: Vibrant Orange (`#F97316`), clean white backgrounds, Inter/system font
- Mobile-first responsive layout with bottom navigation on mobile
- Minimal, Shopify-inspired aesthetic with generous whitespace

### Authentication
- Email + password login/signup (Lovable Cloud Auth)
- Combined login/signup screen with clean card layout
- Post-login redirect to onboarding (new users) or dashboard (returning)

### Database Schema
- `stores` — store name, category, subdomain, theme, settings
- `products` — title, description, images, price, variants, inventory, AI-generated fields
- `orders` — status, payment status, customer info, items
- `user_roles` — admin/seller roles (security-compliant separate table)

---

## Phase 2: Onboarding Wizard (Critical Flow)

A 7-step guided wizard with progress bar:

1. **Store Name** — text input with live subdomain preview
2. **Category Selection** — visual cards (Fashion, Food, Handmade, Electronics, etc.)
3. **Upload First Product Image** — drag-and-drop with preview
4. **AI Product Generation** — calls Lovable AI to generate title, description, tags, category, suggested price from the image
5. **Store Preview** — live preview of how the store will look
6. **Payment Setup** — Razorpay/UPI/COD toggle configuration (UI-level)
7. **Go Live** — celebration screen with shareable store link

Each step has skip/edit options. Progress persists in database.

---

## Phase 3: Seller Dashboard

### Main Dashboard
- Today's sales, order count, conversion rate cards
- Revenue mini-chart (last 7 days)
- Recent orders list
- **AI Insights Panel** — trending products, improvement suggestions

### Sidebar Navigation
- Dashboard, Products, Orders, Store Design, Analytics, Settings
- Collapsible with icons, mobile-friendly

---

## Phase 4: Product Management

### Product List
- Grid/list view toggle, search, category filters
- Quick actions (edit, delete, toggle visibility)

### AI-First Add Product Flow
- Upload image → Lovable AI generates: title, short/long description, tags, category, SEO meta, suggested price
- Manual edit + "Regenerate with AI" button
- Multiple images, variant matrix (category-aware: Fashion → S/M/L/XL, Food → half/full/kg/gms)
- Inventory tracking with low-stock alerts

---

## Phase 5: Order Management

- Order list with status filters (pending, confirmed, shipped, delivered)
- Order detail page with customer info, items, payment status
- Status update actions
- Invoice download (GST-ready format)

---

## Phase 6: Store Design & Themes

### Theme Selection
- 5 theme cards: Minimal Light, Bold Dark, Premium Fashion, Handmade Craft, Modern Grid
- Preview + Apply buttons
- 2 locked premium themes with "Upgrade to Pro" CTA

### Theme Customization
- Primary color picker, font selection, banner upload, layout toggles

---

## Phase 7: Additional Modules

### Shipping (UI simulation)
- Shipping label generation UI, tracking status display

### Payments Dashboard
- Payment status list, settlement summary, COD/UPI/Razorpay toggles

### Instagram Tools
- Bio link page generator, shareable product links
- AI-generated captions and hashtags

### Analytics
- Revenue graph, conversion rate, traffic sources
- AI insights: low/high performing products

### AI Assistant
- Sidebar chat panel for generating descriptions, Instagram posts, pricing suggestions

### Settings
- Store info, GST details
- Auto-generated policies (privacy, return, T&C)
- Domain & SEO settings

### Support
- FAQ page, help articles, contact support button

---

## Technical Approach
- **Lovable Cloud**: Database, Auth, Edge Functions, Storage (product images)
- **Lovable AI**: Product generation from images, content creation, insights
- **State**: React Query for server state, local state for UI
- **Routing**: React Router with protected routes
- **Components**: Shadcn UI + custom components, mobile-first Tailwind

