const MONTH_DAY_YEAR_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

function parseIsoDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split("-").map(Number)
  const parsed = new Date(Date.UTC(year, (month || 1) - 1, day || 1))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatMonthDayYear(value: string): string {
  const parsed = parseIsoDateOnly(value)
  if (!parsed) return value
  return MONTH_DAY_YEAR_FORMATTER.format(parsed)
}

export function formatMonthDayYearRange(start: string, end: string): string {
  return `${formatMonthDayYear(start)} to ${formatMonthDayYear(end)}`
}
