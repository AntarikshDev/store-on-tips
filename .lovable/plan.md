# Phase 6: Shipping Integration — Delhivery

## What We Build

### 1. Seller Shipping Settings (`/settings/shipping`)
- Seller enters Delhivery API Token + Pickup Address (name, phone, address, city, state, pincode)
- Saved to `stores.settings.shipping` JSONB
- Test/Live mode toggle (staging vs production API)
- Connection test button

### 2. Edge Function: `delhivery-proxy`
Multi-action edge function handling:
- **check-serviceability** — verify if buyer's pincode is deliverable from seller's origin
- **estimate-rate** — calculate shipping cost (weight, origin pincode, destination pincode)
- **create-shipment** — generate AWB number when seller ships an order
- **track** — get real-time tracking by AWB/waybill number

### 3. Checkout Enhancement
- Pincode checker component — buyer enters pincode, sees "Deliverable ✓" or "Not available"
- Estimated delivery cost shown before order placement

### 4. Order Detail Enhancement
- "Ship Order" dialog — seller enters package weight, dimensions → creates Delhivery shipment
- AWB number auto-saved to order's tracking_number
- Live tracking status widget on order detail page

## New Files
- `src/pages/ShippingSettings.tsx` — seller config page
- `supabase/functions/delhivery-proxy/index.ts` — multi-action edge function
- `src/components/orders/ShipOrderDialog.tsx` — shipment creation dialog
- `src/components/storefront/PincodeChecker.tsx` — serviceability widget

## Modified Files
- `src/App.tsx` — /settings/shipping route
- `src/components/DashboardLayout.tsx` — Shipping nav link
- `src/pages/OrderDetail.tsx` — ship button + tracking display
- `src/pages/StorefrontCheckout.tsx` — pincode check integration

## No DB Changes Needed
Orders table already has tracking_number. Stores.settings JSONB stores Delhivery credentials.