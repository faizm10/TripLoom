import type { TravelScope } from "@/lib/trips"
import { ISO_COUNTRIES } from "@/lib/iso-countries"

/**
 * Guess ISO country code from a free-text destination (e.g. "Berlin, Germany", "Canada").
 */
export function inferCountryCodeFromDestinationLabel(label: string): string | null {
  const trimmed = label.trim()
  if (!trimmed) return null

  const upper = trimmed.toUpperCase()
  if (/^[A-Z]{2}$/.test(upper)) {
    if (ISO_COUNTRIES.some((c) => c.code === upper)) return upper
  }

  const commaIdx = trimmed.lastIndexOf(",")
  if (commaIdx >= 0) {
    const after = trimmed.slice(commaIdx + 1).trim()
    const fromFragment = matchCountryFragment(after)
    if (fromFragment) return fromFragment
  }

  const whole = matchCountryFragment(trimmed)
  if (whole) return whole

  const lower = trimmed.toLowerCase()
  let best: { code: string; len: number } | null = null
  for (const { code, name } of ISO_COUNTRIES) {
    const n = name.toLowerCase()
    if (lower === n) return code
    if (lower.includes(n) && (!best || n.length > best.len)) {
      best = { code, len: n.length }
    }
  }
  return best?.code ?? null
}

function matchCountryFragment(fragment: string): string | null {
  const f = fragment.trim()
  if (!f) return null
  const lower = f.toLowerCase()
  if (lower === "turkey") return "TR"
  if (lower === "uk" || lower === "u.k." || lower === "great britain") return "GB"
  if (lower === "usa" || lower === "u.s.a." || lower === "united states of america") return "US"
  for (const { code, name } of ISO_COUNTRIES) {
    if (name.toLowerCase() === lower || code.toLowerCase() === lower) return code
  }
  return null
}

/**
 * Prefer structured country from search; fall back to parsing the label.
 */
export function resolveDestinationCountryCode(
  destinationLabel: string,
  picked: { displayName: string; countryCode: string | null } | null
): string | null {
  const label = destinationLabel.trim()
  if (!label) return null
  if (
    picked &&
    picked.displayName.trim() === label &&
    picked.countryCode &&
    picked.countryCode.trim()
  ) {
    return picked.countryCode.trim().toUpperCase()
  }
  return inferCountryCodeFromDestinationLabel(label)
}

export function computeTravelScope(
  residenceCountryCode: string,
  destinationCountryCode: string | null
): TravelScope {
  const res = residenceCountryCode.trim().toUpperCase()
  if (!res || !destinationCountryCode) return "international"
  return destinationCountryCode.trim().toUpperCase() === res ? "domestic" : "international"
}
