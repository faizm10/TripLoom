/**
 * Canonical site origin for user-facing absolute URLs (share/invite links, OAuth redirects).
 *
 * Set `NEXT_PUBLIC_SITE_URL` in production (e.g. `https://triploom.com` or your Vercel URL).
 * No trailing slash. Leave unset locally and on preview deploys — the browser origin is used.
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
