/** Canonical storage: zero-padded hour 01–12, minutes, space, AM or PM (e.g. `06:40 PM`). */
export const CANONICAL_TIME_12H =
  /^(0[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/

export type Time12hParts = { hour: number; minute: number; meridiem: "AM" | "PM" }

export function formatCanonicalTime12h(parts: Time12hParts): string {
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")} ${parts.meridiem}`
}

export function isCanonicalTime12h(value: string): boolean {
  return CANONICAL_TIME_12H.test(value.trim())
}

/**
 * Parse user or legacy values into 12h parts.
 * Supports canonical `hh:mm AM|PM`, flexible `h:mm am|pm`, and `H:mm` / `HH:mm` (24h) when no AM/PM.
 */
export function parseFlexibleTime12h(input: string): Time12hParts | null {
  const s = input.trim()
  if (!s) return null

  let m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i)
  if (m) {
    const hour = parseInt(m[1], 10)
    const minute = parseInt(m[2], 10)
    const meridiem = m[3].toUpperCase() as "AM" | "PM"
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null
    return { hour, minute, meridiem }
  }

  m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (m) {
    const h24 = parseInt(m[1], 10)
    const minute = parseInt(m[2], 10)
    if (h24 < 0 || h24 > 23 || minute < 0 || minute > 59) return null
    const meridiem: "AM" | "PM" = h24 >= 12 ? "PM" : "AM"
    let hour = h24 % 12
    if (hour === 0) hour = 12
    return { hour, minute, meridiem }
  }

  return null
}

/** Returns canonical string, or empty if unparseable. */
export function coerceToCanonicalTime12h(input: string): string {
  const p = parseFlexibleTime12h(input)
  return p ? formatCanonicalTime12h(p) : ""
}

/** For read-only UI: canonical when parsable, otherwise original or em dash. */
export function formatTime12hForDisplay(input: string): string {
  const t = input.trim()
  if (!t) return "—"
  const c = coerceToCanonicalTime12h(t)
  return c || t
}

/** 12h clock → 24h hour (0–23) and minute. */
export function time12hPartsTo24h(p: Time12hParts): { hour: number; minute: number } {
  let hour: number
  if (p.meridiem === "AM") {
    hour = p.hour === 12 ? 0 : p.hour
  } else {
    hour = p.hour === 12 ? 12 : p.hour + 12
  }
  return { hour, minute: p.minute }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function addCalendarDaysToIsoLocal(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  const dt = new Date(y, (m || 1) - 1, (d || 1) + delta)
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`
}

/**
 * Build `YYYY-MM-DDTHH:mm` range for itinerary/calendar from travel date + leg times.
 * If arrival is not after departure on the same calendar day, arrival is placed on the next day (overnight).
 */
export function travelLegTimesToLocalRange(
  travelDateIso: string,
  departureStr: string,
  arrivalStr: string
): { startTimeLocal: string; endTimeLocal: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(travelDateIso)) return null
  const depP = parseFlexibleTime12h(departureStr)
  const arrP = parseFlexibleTime12h(arrivalStr)
  if (!depP || !arrP) return null

  const dep24 = time12hPartsTo24h(depP)
  const arr24 = time12hPartsTo24h(arrP)
  const depMin = dep24.hour * 60 + dep24.minute
  const arrMin = arr24.hour * 60 + arr24.minute

  const startTimeLocal = `${travelDateIso}T${pad2(dep24.hour)}:${pad2(dep24.minute)}`

  let endDate = travelDateIso
  if (arrMin <= depMin) {
    endDate = addCalendarDaysToIsoLocal(travelDateIso, 1)
  }
  const endTimeLocal = `${endDate}T${pad2(arr24.hour)}:${pad2(arr24.minute)}`

  return { startTimeLocal, endTimeLocal }
}
