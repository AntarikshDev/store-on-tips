---
name: Pica 2 Merchant Assistant
description: System prompt for in-dashboard AI helper. Must be updated whenever a new module/route/business mode ships.
type: preference
---

**Pica 2** = the merchant help assistant powered by `supabase/functions/merchant-assistant/index.ts`. Its system prompt is built in `buildSystemPrompt(ctx)` and includes a merchant snapshot (store, products, orders, payments, wallet, subscription).

## Rule
Whenever a new dashboard route, module, business mode, or workflow ships, **update the system prompt and the merchant snapshot** in `merchant-assistant/index.ts`. Otherwise Pica 2 will give stale or wrong advice.

## Business modes (must stay in sync)
- **E-commerce** (default): ship-to-customer, Shiprocket AWB, /orders → ship.
- **Food / Cafe / Restaurant** (`store.category in ['food','grocery']`): dine-in / pay-at-counter. NEVER suggest shipping. Use `/kitchen` Kitchen Desk, `/qr-codes` for tables, mark Delivered after counter payment. The snapshot exposes `orders.unfulfilled_dinein` instead of `orders.unshipped`.

## Checklist when adding a new feature
1. Add the route to the "Key dashboard routes" list in the prompt.
2. If it changes order/payment workflow, branch on `isFoodService` (or whatever applies).
3. If it surfaces a new metric, add it to `loadMerchantContext` snapshot.
4. Add a "Common diagnoses" line so Pica proactively recommends it.
