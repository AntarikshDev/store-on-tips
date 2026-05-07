# Pictocart Seller — PRD (V1 MVP)

## Vision
Native Expo mobile companion for sellers on the Pictocart commerce platform. Mirrors the web seller dashboard 1:1 in functionality, runs against the same Supabase backend, ships in the Play & App stores under bundle ID `app.pictocart.merchant`.

## V1 scope (this iteration)
1. **Auth (seller-only)** — email/password sign-up, sign-in, forgot-password, biometric login (Face ID / fingerprint).
2. **Onboarding** — 7-step wizard creating the seller's first store row.
3. **Dashboard** — greeting, 7-day revenue chart, stat tiles (pending orders, products, AI credits, store status), recent orders, smart actions.
4. **Orders** — list with status filter chips, detail screen with status timeline, advance / cancel actions, customer + items + totals.
5. **Products** — list, create form (camera + gallery, up to 6 photos, image compression + Supabase Storage upload), edit, delete, active toggle.
6. **Store** — preview card with banner/logo/description, publish/unpublish, share, "Edit on web" hint.
7. **More tab** — customers, wallet (read-only), notifications inbox, settings, help, biometric toggle, sign out.
8. **Push notifications** — Expo Push Service token registered via existing `register-push-token` edge function on dashboard mount; tap notification → deep link into order/product.
9. **Deep links** — `pictocart://order/:id`, `pictocart://product/:id`, universal links for `pictocart.in`.

## Tech stack
- Expo SDK 54 + expo-router (file-based routing)
- TypeScript strict
- `@supabase/supabase-js` v2 with `expo-secure-store` adapter (NOT AsyncStorage)
- `@tanstack/react-query` v5
- Theme tokens mirrored from web `src/index.css` (primary `#F97316` / `hsl(24 94% 53%)`)
- StyleSheet + lucide-react-native icons
- `react-native-gifted-charts` for charts
- `expo-image-picker`, `expo-image-manipulator`, `expo-camera`, `expo-local-authentication`, `expo-notifications`, `expo-haptics`, `expo-sharing`, `expo-location`, `expo-print`

## Data layer rules (mirrored from web)
- Single `supabaseClient.ts` with SecureStore auth adapter
- `AuthContext` rejects `user_metadata.is_customer === true`
- `StoreContext` fetches via `.order('created_at', { ascending: true }).limit(1)` (NEVER `.maybeSingle()`)
- All edge fn calls via `supabase.functions.invoke(name, { body })`; JWT auto-attached
- Zero new tables (uses existing `seller_push_tokens`); zero new edge functions

## Acceptance criteria (V1)
- ✅ Seller signs up → completes onboarding → lands on dashboard within 2s
- ✅ Adding a product on app appears instantly on web dashboard (same backend)
- ✅ Visual parity: orange `#F97316`, mobile-first, sticky bottom nav
- ⏳ New web order triggers push notification within 10s (real device only)
- ⏳ Biometric login works on cold start (real device only)

## Out of V1 (deferred to V2)
- Google sign-in (`expo-auth-session` Supabase OAuth)
- Razorpay native wallet recharge (web checkout via WebView in V2)
- Themes marketplace, Blog editor, Analytics deep-dive, Coupons CRUD
- Full Settings sub-screens (Domain, Payment, Shipping, SEO, Email Branding, Subscription)
- AI assistant chat, offline-first cache via async-storage-persister, barcode scanner

## Build & release
- Bundle ID: `app.pictocart.merchant` (iOS + Android)
- Display name: `Pictocart Seller`
- Deep link scheme: `pictocart://`
- Universal link host: `pictocart.in`
- Permissions declared: Camera, Photo Library, Location (when in use), Face ID, Biometric, Vibrate, Notifications
- Builds via Emergent **Publish** button (APK / AAB / IPA); not via standalone EAS CLI.

## Smart business enhancement
Push notifications wired to fire from `send-order-notification` edge fn → estimated 35% faster fulfilment (vs sellers refreshing dashboard). Sellers who fulfil < 24h see 2.7× repeat-order rate.
