

## Goal
Complete the Cloudflare for SaaS integration you've already wired up at the infrastructure level by teaching the Lovable app to serve the correct merchant storefront when a request arrives on a custom domain.

## Scope (code only — Cloudflare side is already done by you)

### 1. Host-based storefront routing
- New hook `src/hooks/useStoreByHost.ts`:
  - Reads `window.location.hostname`
  - If hostname is one of: `localhost`, `*.lovable.app`, `*.lovableproject.com`, `pictocart.in`, `www.pictocart.in` → return `null` (platform host, use normal routing)
  - Otherwise → query `stores` table where `custom_domain = hostname` OR `custom_domain = hostname.replace(/^www\./, '')`
  - Returns the store row or null
- Update `src/App.tsx`:
  - At the top of the router, check `useStoreByHost`
  - If a custom-domain store is found, mount the storefront routes at `/` (rewrite `/` → `Storefront` for that store, `/product/:id` → `StorefrontProduct`, `/cart`, `/checkout`, `/account`, etc.)
  - Skip the marketing landing page and `/dashboard` routes entirely on custom-domain hosts
- Update `src/hooks/useStorefront.ts` to accept a store object directly (avoid double-fetching by slug when we already resolved by host).

### 2. DomainSettings page rewrite
Rewrite `src/pages/DomainSettings.tsx` to match the new Cloudflare-for-SaaS flow instead of the old A-record-to-185.158.133.1 flow:
- Input: merchant enters their domain (e.g., `indilipi.com`)
- Show clear instructions: at your registrar, add  
  `CNAME  @  →  fallback.pictocart.in`  
  `CNAME  www  →  fallback.pictocart.in`
- Save `custom_domain` to the store row
- Show status: "Pending DNS" → "SSL Active" by calling a new edge function that checks Cloudflare

### 3. Edge functions to manage Custom Hostnames via Cloudflare API
So merchants don't require you to manually add each domain in the Cloudflare dashboard:
- `supabase/functions/provision-custom-hostname/index.ts` — POST to `https://api.cloudflare.com/client/v4/zones/{zone_id}/custom_hostnames` with the merchant's domain. Save returned `id` in `stores.cloudflare_hostname_id`.
- `supabase/functions/check-custom-hostname/index.ts` — GET hostname status, return `ssl_status` (pending/active/failed) + `verification_errors`.
- `supabase/functions/remove-custom-hostname/index.ts` — DELETE when merchant disconnects.
- Secrets needed (you add via Lovable Cloud secrets UI):
  - `CLOUDFLARE_API_TOKEN` (scoped: Zone:SSL+Certs:Edit, Zone:Custom Hostnames:Edit on pictocart.in zone)
  - `CLOUDFLARE_ZONE_ID` (your pictocart.in zone ID)
  - `CLOUDFLARE_FALLBACK_TARGET=fallback.pictocart.in`

### 4. DB migration
Add to `stores` table:
- `cloudflare_hostname_id text`
- `ssl_status text` (pending | active | failed)
- `ssl_last_checked_at timestamptz`

(`custom_domain` already exists per memory.)

### 5. Fix `pictocart.in` itself (no code — instructions only)
In Cloudflare DNS:
- Change `pictocart.in` A record from **Proxied** to **DNS only** (grey cloud), OR delete the A and add a Custom Hostname for `pictocart.in` too.
- Same for `www`.
- Then in Lovable Project Settings → Domains, complete verification (TXT records `_lovable` and `_lovable.www` are already present — good).

## Files

**New:**
- `src/hooks/useStoreByHost.ts`
- `supabase/functions/provision-custom-hostname/index.ts`
- `supabase/functions/check-custom-hostname/index.ts`
- `supabase/functions/remove-custom-hostname/index.ts`
- Migration adding 3 columns to `stores`

**Edited:**
- `src/App.tsx` — host-based route mounting
- `src/pages/DomainSettings.tsx` — new CNAME-based flow + status polling
- `src/hooks/useStorefront.ts` — accept pre-resolved store

## Confirmation needed
1. Confirm I should use Cloudflare for SaaS API (you'll provide `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID` as secrets when prompted).
2. Confirm fallback target = `fallback.pictocart.in`.
3. After build, you'll fix `pictocart.in`'s own DNS per step 5 (one-time manual).

