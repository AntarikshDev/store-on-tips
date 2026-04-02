# Phase 7: Custom Domain Management for Sellers

## What We Build

### 1. Domain Settings Page (`/settings/domain`)
- Seller enters their custom domain (e.g., `mystore.com`)
- Shows step-by-step DNS configuration instructions:
  - A record pointing to platform IP
  - TXT record for ownership verification
- Real-time DNS verification status
- "Verify Domain" button triggers DNS check
- Status indicators: Not configured → Pending → Verified → Active

### 2. Edge Function: `verify-domain`
- Accepts domain name
- Checks TXT record for ownership verification token
- Checks A record points to correct IP
- Returns verification status

### 3. Store Domain Storage
- Domain saved to `stores.settings.domain` JSONB:
  - `domain`: string
  - `verified`: boolean
  - `verification_token`: string
  - `connected_at`: timestamp

### 4. Storefront Domain Routing
- Storefront checks for custom domain in store settings
- Display domain prominently on dashboard with copy-to-clipboard
- "View Store" link uses custom domain when verified

## New Files
- `src/pages/DomainSettings.tsx` — domain config + verification UI
- `supabase/functions/verify-domain/index.ts` — DNS verification edge function

## Modified Files
- `src/App.tsx` — add /settings/domain route
- `src/components/DashboardLayout.tsx` — add Domain nav item

## Note
Full custom domain routing (SSL provisioning, reverse proxy) requires infrastructure beyond the app layer. This phase builds the seller-facing config and DNS verification. Actual domain-to-store routing would need a proxy layer (e.g., Cloudflare Workers, custom Nginx) in a production deployment.