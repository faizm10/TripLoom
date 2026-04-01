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
 * Origin for Supabase OAuth `redirectTo`. Must match an entry in Supabase → Auth → Redirect URLs.
 *
 * - Local dev on `localhost`: always use the tab origin (even if `NEXT_PUBLIC_SITE_URL` points at prod).
 * - Production tab whose host matches `NEXT_PUBLIC_SITE_URL`: use that env value (canonical scheme/host).
 * - Otherwise use the tab origin (preview deploys, alternate domains).
 */
export function getOAuthCallbackOrigin(): string {
  if (typeof window === "undefined") return ""
  const tab = window.location.origin
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "")
  if (!env) return tab
  try {
    const envUrl = new URL(env)
    if (envUrl.host === window.location.host) {
      return envUrl.origin
    }
  } catch {
    /* invalid NEXT_PUBLIC_SITE_URL */
  }
  return tab
}
