// Captures and reads the ?ref=CODE referral cookie used by the Partner program.
// 30-day expiry, root path, lax samesite.

const COOKIE_NAME = 'ptc_ref';
const MAX_AGE_DAYS = 30;

export function captureReferralFromUrl() {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('ref');
    if (!code) return;
    const clean = code.trim().toUpperCase().slice(0, 16);
    if (!/^[A-Z0-9]+$/.test(clean)) return;
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=${clean}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  } catch {
    /* noop */
  }
}

export function getReferralCode(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearReferralCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}
