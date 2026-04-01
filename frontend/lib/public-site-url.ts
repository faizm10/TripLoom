/**
 * Canonical site origin for share/invite links and email confirmation redirects.
 *
 * Set `NEXT_PUBLIC_SITE_URL` in production (e.g. `https://triploom.com`). No trailing slash.
 * Leave unset locally — the browser origin is used when this runs on the client.
 *
 * Do not use this for Google OAuth `redirectTo`; use {@link getOAuthCallbackOrigin} instead.
 */
export function getPublicSiteOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "")
  if (env) return env
  if (typeof window !== "undefined") return window.location.origin
  return ""
}

export function toPublicAbsoluteUrl(path: string): string {
  const base = getPublicSiteOrigin()
  const normalized = path.startsWith("/") ? path : `/${path}`
  if (!base) return normalized
  return `${base}${normalized}`
}

/**
 * Supabase OAuth must redirect back to the same host as the tab (localhost vs production).
 * If `redirectTo` used `NEXT_PUBLIC_SITE_URL` while you develop on localhost, Google would
 * send the auth `code` to prod or Supabase would fall back to Site URL (`/` + `?code=`), and
 * the session would never exchange on your dev server.
 */
export function getOAuthCallbackOrigin(): string {
  if (typeof window === "undefined") return ""
  return window.location.origin
}
