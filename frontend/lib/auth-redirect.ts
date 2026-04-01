/**
 * Prevent open redirects: only allow same-origin relative paths.
 */
export function safeAuthRedirectPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/dashboard"
  const t = raw.trim()
  if (!t.startsWith("/") || t.startsWith("//")) return "/dashboard"
  return t
}
