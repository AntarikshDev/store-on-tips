

# Cloudflare Auto-Pilot Agent for Super Admin

Build an autonomous agent inside the Super Admin panel that owns the entire Cloudflare for SaaS lifecycle — provisioning, monitoring, healing, and notifying — so you (Super Admin) log in once and the platform runs itself.

## What you get

1. **One-time Super Admin login** with configurable session timeout (15 min → 30 days).
2. **Cloudflare Auto-Pilot dashboard** at `/admin/cloudflare` — a real-time control room showing every merchant domain, its health, SSL, DNS, and uptime.
3. **Auto-healing background agent** that runs every 5 minutes via `pg_cron` → re-provisions broken hostnames, retries failed SSL, deletes orphans, and alerts you only when human action is needed.
4. **Automated downtime emails** to merchants + customers when their store goes down, with auto-resolved follow-ups when it recovers.
5. **Live indilipi.com fix** as the first action after you update the Cloudflare token.

## Architecture

```text
                    ┌─────────────────────────────┐
                    │  Super Admin (one login)    │
                    │   /admin/cloudflare         │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
      [Live Dashboard]    [Manual Actions]    [Settings]
      All domains +       Re-provision,       Session TTL,
      health pills        force-SSL, delete   alert email
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │  cloudflare-agent edge fn   │◄──── pg_cron every 5 min
                    │  (autonomous healer)        │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────┼────────────────────┐
              ▼                   ▼                    ▼
        Cloudflare API      Health checks       Notifications
        (provision/         (HEAD requests      (downtime/
         check/delete)       to each domain)     recovery emails)
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │  domain_health_log table    │
                    │  (uptime history + alerts)  │
                    └─────────────────────────────┘
```

## Build steps

### 1. Database (1 migration)
- New table `domain_health_log` — uptime history per store (status, http_code, ssl_valid, checked_at, response_ms).
- New table `admin_settings` — single-row JSONB for super admin preferences (session_timeout_minutes, alert_email, auto_heal_enabled, downtime_threshold_minutes, notify_merchants, notify_customers).
- Add columns to `stores`: `last_health_check_at`, `consecutive_failures int default 0`, `downtime_started_at`, `downtime_notified_at`.

### 2. Configurable session timeout
- New page `/admin/security` — Super Admin sets session TTL (15m / 1h / 8h / 7d / 30d).
- Update `AdminRoute.tsx` to enforce the chosen TTL via a `lastActivity` timestamp in `localStorage` + auto-logout when expired.
- Sliding-window refresh on each navigation so an active admin never gets kicked out mid-task.

### 3. The autonomous agent — `cloudflare-agent` edge function
Runs every 5 min via `pg_cron`. For each store with a `custom_domain`:
- **Step A — Sync**: GET hostname status from Cloudflare. If missing in CF but present in DB → auto re-provision. If present in CF but missing in DB → mark orphan.
- **Step B — Health check**: HEAD request to `https://{domain}` with 10s timeout. Record status + response time in `domain_health_log`.
- **Step C — DNS check**: DNS-over-HTTPS lookup for apex + www CNAMEs.
- **Step D — Auto-heal**:
  - SSL stuck on `pending_validation` > 30 min → re-trigger validation
  - 3 consecutive failures → set `downtime_started_at`
  - 5 consecutive failures + downtime > 10 min → send downtime email to merchant + customers (one-shot, deduped via `downtime_notified_at`)
  - Recovers → send "Back online" email + reset counters
- **Step E — Escalate**: If auto-heal can't fix (e.g., merchant's DNS is wrong), email Super Admin with one-click "Open in Cloudflare Auto-Pilot" link.

### 4. Cloudflare Auto-Pilot dashboard — `/admin/cloudflare`
- **Top row KPIs**: Total domains | Active | Pending SSL | Down | Auto-healed today
- **Live table**: domain, store name, SSL status pill, uptime % (24h), last check, response time, [Re-provision] [Force SSL] [Delete] [Open] buttons
- **Incident timeline**: live feed of agent actions (re-provisioned indilipi.com, sent downtime email to 3 customers, etc.)
- **Search + filter** by status (down / pending / active)
- **Bulk actions**: re-check all, re-provision all failed

### 5. Notification templates
Two new email templates in `manage-email-domain` style:
- `store-downtime.html` — "Your store {name} is currently unreachable. We're investigating. ETA: {minutes} min."
- `store-recovered.html` — "Your store {name} is back online. Total downtime: {duration}."
- Customer version: only sent if downtime > 10 min and customer has an active order in last 30 days.

### 6. Fix indilipi.com immediately (your first task after deploy)
After you update the `CLOUDFLARE_API_TOKEN` secret with the correct permissions:
1. Open `/admin/cloudflare`
2. Click **Re-provision** next to indilipi.com
3. Agent provisions, polls, validates SSL, marks live — all hands-off.

## Files

**New:**
- `supabase/functions/cloudflare-agent/index.ts` — the autonomous healer
- `supabase/functions/admin-cloudflare-action/index.ts` — manual actions (re-provision/delete/force-SSL) from dashboard
- `src/pages/admin/AdminCloudflare.tsx` — control room
- `src/pages/admin/AdminSecurity.tsx` — session timeout config
- `src/hooks/useDomainHealth.ts` — realtime subscription to health log
- Migration: `domain_health_log`, `admin_settings`, 4 columns on `stores`, pg_cron schedule

**Edited:**
- `src/components/AdminRoute.tsx` — sliding-window session timeout
- `src/components/AdminLayout.tsx` — add "Cloudflare" + "Security" nav items
- `src/App.tsx` — register new admin routes
- `supabase/functions/provision-custom-hostname/index.ts` — log to `domain_health_log` on provision

## Permissions reminder
The Cloudflare token you'll add needs:
- **Zone → SSL and Certificates → Edit** (zone-scoped to pictocart.in)
- **Zone → Zone → Read**
- **Zone → SSL and Certificates → Read** (for status polling)
- *(optional but recommended)* **Account → Custom Hostnames → Edit** if your zone uses Cloudflare for SaaS at account level.

## After you approve
1. I run the migration + deploy 2 edge functions + build the 2 admin pages.
2. You paste the new Cloudflare token (I'll prompt via the secrets tool).
3. You set your session timeout preference in `/admin/security`.
4. We re-provision indilipi.com in one click and watch it go live in real time.
5. The agent then runs forever — you only hear from it when something needs your eyes.

