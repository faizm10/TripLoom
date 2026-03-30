export type TripStatus = "planning" | "booked" | "in_progress"

export type ExpenseCategory =
  | "flights"
  | "hotels"
  | "transit"
  | "food"
  | "activities"
  | "misc"

export type SplitMode = "equal" | "custom"

export type FinanceGuardrailStatus = "on_track" | "watch" | "over"

export type TripExpenseSplit = {
  travelerId: string
  amount: number
}

export type TripExpense = {
  id: string
  tripId: string
  date: string
  category: ExpenseCategory
  title: string
  amount: number
  currency: string
  payerName: string
  splitMode: SplitMode
  splits?: TripExpenseSplit[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export type TransitMode =
  | "subway"
  | "bus"
  | "tram"
  | "rail"
  | "ferry"
  | "walk_mix"
  | "other"

export type ItineraryTimeBlock = "morning" | "afternoon" | "evening"

export type ItineraryStatus = "planned" | "todo" | "finished"

export type ItineraryCategory =
  | "outbound_flight"
  | "inbound_flight"
  | "commute"
  | "activities"
  | "games"
  | "food"
  | "sightseeing"
  | "shopping"
  | "rest"
  | "other"

export type TripItineraryItem = {
  id: string
  tripId: string
  dayIndex: number
  timeBlock: ItineraryTimeBlock
  status: ItineraryStatus
  category: ItineraryCategory
  title: string
  locationLabel: string
  placeId?: string
  lat?: number
  lng?: number
  locationLink?: string
  googleMapsLink?: string
  commuteDetails?: string
  notes?: string
  startTimeLocal?: string
  endTimeLocal?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type TransitRoute = {
  id: string
  tripId: string
  dayIndex: number
  fromLabel: string
  toLabel: string
  fromPlaceId?: string
  toPlaceId?: string
  mode: TransitMode
  durationMinutes: number
  departureTimeLocal?: string
  arrivalTimeLocal?: string
  estimatedCost: number
  currency: string
  provider: "google_maps" | "manual"
  providerRouteRef?: string
  referenceUrl?: string
  transfers?: number
  walkingMinutes?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type TripFinanceAutomation = {
  enabled: boolean
  warnAtPercent: number
  criticalAtPercent: number
  showDailyPaceAlerts: boolean
  suggestCutbackCategories: boolean
  lastRunAt?: string
  lastStatus?: FinanceGuardrailStatus
}

export type TripFinance = {
  budgetTotal: number
  currency: string
  groupModeEnabled: boolean
  groupSize: number
  exchangeRates: Record<string, number>
  expenses: TripExpense[]
  automation: TripFinanceAutomation
}

export type Trip = {
  id: string
  destination: string
  timezone?: string
  startDate: string
  endDate: string
  travelers: number
  isGroupTrip: boolean
  status: TripStatus
  lastUpdated: string
  progress: number
  selectedFlights: boolean
  selectedHotel: boolean
  itineraryDaysPlanned: number
  totalDays: number
  itineraryItems?: TripItineraryItem[]
  transitSaved: boolean
  transitRoutes?: TransitRoute[]
  financeSet: boolean
  approvalsPending: number
  budgetTotal: number
  perPerson: number
  finance?: TripFinance
  hotelArea?: string
  flightSummary?: string
  hotelSummary?: string
  /** Sum of night counts from saved hotel stays (client-synced). */
  hotelNightsBooked?: number
  activities: string[]
}

export type TripBuckets = {
  future: Trip[]
  current: Trip[]
  past: Trip[]
}

export type CreateTripInput = {
  id: string
  destination: string
  dateMode: "exact" | "weekend" | "flexible"
  travelers: "solo" | "group"
}

const DEFAULT_FINANCE_AUTOMATION: TripFinanceAutomation = {
  enabled: false,
  warnAtPercent: 90,
  criticalAtPercent: 100,
  showDailyPaceAlerts: true,
  suggestCutbackCategories: true,
}

const DEFAULT_FINANCE_CURRENCY = "CAD"
const HOTEL_ALLOCATOR_NOTE_PREFIX = "[hotel_allocator_v1]"
const TIME_BLOCK_ORDER: Record<ItineraryTimeBlock, number> = {
  morning: 1,
  afternoon: 2,
  evening: 3,
}

const trips: Trip[] = []

export function hasTransitRoutes(trip: Trip): boolean {
  if (Array.isArray(trip.transitRoutes)) return trip.transitRoutes.length > 0
  return trip.transitSaved
}

export function getTripTransitRoutes(trip: Trip): TransitRoute[] {
  return Array.isArray(trip.transitRoutes) ? trip.transitRoutes : []
}

function isValidTimeBlock(value: unknown): value is ItineraryTimeBlock {
  return value === "morning" || value === "afternoon" || value === "evening"
}

function isValidStatus(value: unknown): value is ItineraryStatus {
  return value === "planned" || value === "todo" || value === "finished"
}

function sanitizeItineraryItem(
  trip: Trip,
  raw: Partial<TripItineraryItem>
): TripItineraryItem | null {
  if (!raw.id) return null
  if (typeof raw.title !== "string" || !raw.title.trim()) return null
  if (typeof raw.locationLabel !== "string" || !raw.locationLabel.trim()) return null
  const dayIndex = Math.floor(Number(raw.dayIndex))
  if (!Number.isFinite(dayIndex) || dayIndex < 1 || dayIndex > Math.max(1, trip.totalDays)) {
    return null
  }
  if (!isValidTimeBlock(raw.timeBlock)) return null
  if (!isValidStatus(raw.status)) return null
  const category: ItineraryCategory =
    raw.category === "outbound_flight" ||
    raw.category === "inbound_flight" ||
    raw.category === "commute" ||
    raw.category === "activities" ||
    raw.category === "games" ||
    raw.category === "food" ||
    raw.category === "sightseeing" ||
    raw.category === "shopping" ||
    raw.category === "rest" ||
    raw.category === "other"
      ? raw.category
      : "activities"

  return {
    id: raw.id,
    tripId: trip.id,
    dayIndex,
    timeBlock: raw.timeBlock,
    status: raw.status,
    category,
    title: raw.title.trim(),
    locationLabel: raw.locationLabel.trim(),
    placeId: raw.placeId?.trim() || undefined,
    lat: typeof raw.lat === "number" && Number.isFinite(raw.lat) ? raw.lat : undefined,
    lng: typeof raw.lng === "number" && Number.isFinite(raw.lng) ? raw.lng : undefined,
    locationLink: raw.locationLink?.trim() || undefined,
    googleMapsLink: raw.googleMapsLink?.trim() || undefined,
    commuteDetails: raw.commuteDetails?.trim() || undefined,
    notes: raw.notes?.trim() || undefined,
    startTimeLocal: raw.startTimeLocal || undefined,
    endTimeLocal: raw.endTimeLocal || undefined,
    sortOrder: Number.isFinite(raw.sortOrder) ? Number(raw.sortOrder) : 0,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

function itinerarySort(a: TripItineraryItem, b: TripItineraryItem): number {
  if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex
  const blockA = TIME_BLOCK_ORDER[a.timeBlock] ?? 99
  const blockB = TIME_BLOCK_ORDER[b.timeBlock] ?? 99
  if (blockA !== blockB) return blockA - blockB
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  return a.createdAt.localeCompare(b.createdAt)
}

export function normalizeSortOrder(items: TripItineraryItem[]): TripItineraryItem[] {
  const buckets = new Map<string, TripItineraryItem[]>()
  for (const item of items) {
    const key = `${item.dayIndex}-${item.timeBlock}`
    const existing = buckets.get(key) ?? []
    existing.push(item)
    buckets.set(key, existing)
  }

  const normalized: TripItineraryItem[] = []
  for (const group of buckets.values()) {
    group
      .slice()
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
        return a.createdAt.localeCompare(b.createdAt)
      })
      .forEach((item, index) => {
        normalized.push({
          ...item,
          sortOrder: (index + 1) * 10,
        })
      })
  }

  return normalized.sort(itinerarySort)
}

export function getTripItineraryItems(trip: Trip): TripItineraryItem[] {
  if (!Array.isArray(trip.itineraryItems)) return []
  const normalized = trip.itineraryItems
    .map((raw) => sanitizeItineraryItem(trip, raw))
    .filter((item): item is TripItineraryItem => Boolean(item))
  return normalizeSortOrder(normalized)
}

export function computeItineraryDaysPlanned(items: TripItineraryItem[]): number {
  return new Set(items.map((item) => item.dayIndex)).size
}

export function getTripItineraryDaysPlanned(trip: Trip): number {
  const items = getTripItineraryItems(trip)
  if (items.length === 0) return Math.max(0, Math.floor(trip.itineraryDaysPlanned || 0))
  return computeItineraryDaysPlanned(items)
}

/** Days with at least one non–flight-synced itinerary item (for “build itinerary” prompts). */
export function getManualItineraryDaysPlanned(trip: Trip): number {
  const items = getTripItineraryItems(trip).filter((item) => !item.id.includes(":auto-flight:"))
  return computeItineraryDaysPlanned(items)
}

/** Nights between trip start and end (last night is trip end date). */
export function tripRequiredHotelNights(trip: Trip): number {
  return Math.max(1, trip.totalDays - 1)
}

export function hasStayCoverage(trip: Trip): boolean {
  const required = tripRequiredHotelNights(trip)
  if (trip.hotelNightsBooked != null) {
    return trip.hotelNightsBooked >= required
  }
  return trip.selectedHotel
}

export function validateItineraryItemDraft(
  draft: Pick<TripItineraryItem, "title" | "locationLabel" | "dayIndex">,
  totalDays: number
): string | null {
  if (!draft.title.trim()) return "Title is required."
  if (!draft.locationLabel.trim()) return "Location is required."
  if (draft.dayIndex < 1 || draft.dayIndex > Math.max(1, totalDays)) {
    return "Day is out of range."
  }
  return null
}

export function defaultBlockWindow(block: ItineraryTimeBlock): {
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
} {
  if (block === "morning") {
    return { startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 }
  }
  if (block === "afternoon") {
    return { startHour: 13, startMinute: 0, endHour: 17, endMinute: 0 }
  }
  return { startHour: 18, startMinute: 0, endHour: 21, endMinute: 0 }
}

function addDays(isoDate: string, dayOffset: number): string {
  const parsed = parseDateUtc(isoDate)
  if (Number.isNaN(parsed.getTime())) return isoDate
  parsed.setUTCDate(parsed.getUTCDate() + dayOffset)
  return parsed.toISOString().slice(0, 10)
}

function toLocalDateTimeString(
  isoDate: string,
  hour: number,
  minute: number
): string {
  const hh = String(Math.max(0, Math.min(23, hour))).padStart(2, "0")
  const mm = String(Math.max(0, Math.min(59, minute))).padStart(2, "0")
  return `${isoDate}T${hh}:${mm}`
}

export function resolveItineraryStartLocal(item: TripItineraryItem, trip: Trip): string {
  if (item.startTimeLocal) return item.startTimeLocal
  const dayDate = addDays(trip.startDate, Math.max(0, item.dayIndex - 1))
  const block = defaultBlockWindow(item.timeBlock)
  return toLocalDateTimeString(dayDate, block.startHour, block.startMinute)
}

export function resolveItineraryEndLocal(item: TripItineraryItem, trip: Trip): string {
  if (item.endTimeLocal) return item.endTimeLocal
  const dayDate = addDays(trip.startDate, Math.max(0, item.dayIndex - 1))
  const block = defaultBlockWindow(item.timeBlock)
  return toLocalDateTimeString(dayDate, block.endHour, block.endMinute)
}

export function getDestinationTimezone(destinationValue: string): string {
  const destination = destinationValue.toLowerCase()
  if (destination.includes("germany") || destination.includes("berlin")) return "Europe/Berlin"
  if (destination.includes("tokyo") || destination.includes("japan")) return "Asia/Tokyo"
  if (destination.includes("lisbon") || destination.includes("portugal")) return "Europe/Lisbon"
  return "UTC"
}

export function getTripTimezone(trip: Trip): string {
  if (trip.timezone && trip.timezone.trim()) return trip.timezone.trim()
  return getDestinationTimezone(trip.destination)
}

export function groupItineraryByDayAndBlock(
  items: TripItineraryItem[],
  totalDays: number
): Record<number, Record<ItineraryTimeBlock, TripItineraryItem[]>> {
  const grouped: Record<number, Record<ItineraryTimeBlock, TripItineraryItem[]>> = {}
  for (let day = 1; day <= Math.max(1, totalDays); day++) {
    grouped[day] = { morning: [], afternoon: [], evening: [] }
  }

  for (const item of items) {
    if (!grouped[item.dayIndex]) continue
    grouped[item.dayIndex][item.timeBlock].push(item)
  }

  for (const day of Object.keys(grouped)) {
    const dayNum = Number(day)
    grouped[dayNum].morning.sort(itinerarySort)
    grouped[dayNum].afternoon.sort(itinerarySort)
    grouped[dayNum].evening.sort(itinerarySort)
  }

  return grouped
}

export function coerceTripItineraryForTotalDays(trip: Trip): TripItineraryItem[] {
  const clamped = getTripItineraryItems(trip).map((item) => ({
    ...item,
    dayIndex: Math.min(Math.max(1, item.dayIndex), Math.max(1, trip.totalDays)),
    updatedAt: new Date().toISOString(),
  }))
  return normalizeSortOrder(clamped)
}

export function getTrips(): Trip[] {
  return trips
}

export function createFallbackTrip(tripId: string): Trip {
  const safeId = tripId || "new-trip"
  return {
    id: safeId,
    destination: "New Trip",
    timezone: "UTC",
    startDate: "2026-04-01",
    endDate: "2026-04-08",
    travelers: 1,
    isGroupTrip: false,
    status: "planning",
    lastUpdated: new Date().toISOString().slice(0, 10),
    progress: 0,
    selectedFlights: false,
    selectedHotel: false,
    itineraryDaysPlanned: 0,
    itineraryItems: [],
    totalDays: 7,
    transitSaved: false,
    transitRoutes: [],
    financeSet: false,
    approvalsPending: 0,
    budgetTotal: 0,
    perPerson: 0,
    activities: [],
  }
}

export function getTripById(tripId: string): Trip | undefined {
  return trips.find((trip) => trip.id === tripId)
}

export function getTripStatusLabel(status: TripStatus): string {
  if (status === "in_progress") return "In Progress"
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function sanitizeNumber(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback
  }
  return value
}

function sanitizePositive(value: unknown, fallback = 0): number {
  const num = sanitizeNumber(value, fallback)
  return num < 0 ? fallback : num
}

function toIsoDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toISOString().slice(0, 10)
}

function normalizeExpense(tripId: string, raw: Partial<TripExpense>): TripExpense | null {
  if (!raw.id || !raw.title || !raw.payerName || !raw.date || !raw.category) return null
  const amount = sanitizePositive(raw.amount, 0)
  if (amount <= 0) return null

  return {
    id: raw.id,
    tripId,
    date: toIsoDate(raw.date),
    category: raw.category,
    title: raw.title,
    amount,
    currency: raw.currency || DEFAULT_FINANCE_CURRENCY,
    payerName: raw.payerName,
    splitMode: raw.splitMode === "custom" ? "custom" : "equal",
    splits:
      raw.splitMode === "custom" && Array.isArray(raw.splits)
        ? raw.splits
            .map((split) => ({
              travelerId: split.travelerId,
              amount: sanitizePositive(split.amount, 0),
            }))
            .filter((split) => split.travelerId && split.amount >= 0)
        : undefined,
    notes: raw.notes?.trim() || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  }
}

function getPaceWeightedAmount(expense: TripExpense, totalTripDays: number): number {
  if (expense.category !== "hotels") return expense.amount
  // Allocator entries are already split per day.
  if (typeof expense.notes === "string" && expense.notes.startsWith(HOTEL_ALLOCATOR_NOTE_PREFIX)) {
    return expense.amount
  }
  return expense.amount / Math.max(1, totalTripDays)
}

export function getTripFinance(trip: Trip): TripFinance {
  const legacyBudget = sanitizePositive(trip.budgetTotal, 0)

  const automationInput = trip.finance?.automation
  const automation: TripFinanceAutomation = {
    enabled: Boolean(automationInput?.enabled ?? DEFAULT_FINANCE_AUTOMATION.enabled),
    warnAtPercent: sanitizePositive(
      automationInput?.warnAtPercent,
      DEFAULT_FINANCE_AUTOMATION.warnAtPercent
    ),
    criticalAtPercent: sanitizePositive(
      automationInput?.criticalAtPercent,
      DEFAULT_FINANCE_AUTOMATION.criticalAtPercent
    ),
    showDailyPaceAlerts:
      automationInput?.showDailyPaceAlerts ?? DEFAULT_FINANCE_AUTOMATION.showDailyPaceAlerts,
    suggestCutbackCategories:
      automationInput?.suggestCutbackCategories ??
      DEFAULT_FINANCE_AUTOMATION.suggestCutbackCategories,
    lastRunAt: automationInput?.lastRunAt,
    lastStatus: automationInput?.lastStatus,
  }

  if (automation.criticalAtPercent < automation.warnAtPercent) {
    automation.criticalAtPercent = automation.warnAtPercent
  }

  const expenses = Array.isArray(trip.finance?.expenses)
    ? trip.finance?.expenses
        .map((expense) => normalizeExpense(trip.id, expense))
        .filter((expense): expense is TripExpense => Boolean(expense))
    : []

  const exchangeRatesRaw = trip.finance?.exchangeRates ?? {}
  const exchangeRates: Record<string, number> = {}
  for (const [currency, rate] of Object.entries(exchangeRatesRaw)) {
    const normalizedCurrency = currency.toUpperCase()
    const numericRate = sanitizePositive(rate, 0)
    if (!normalizedCurrency) continue
    if (numericRate > 0) exchangeRates[normalizedCurrency] = numericRate
  }
  const baseCurrency = (trip.finance?.currency || DEFAULT_FINANCE_CURRENCY).toUpperCase()
  exchangeRates[baseCurrency] = 1

  return {
    budgetTotal: sanitizePositive(trip.finance?.budgetTotal, legacyBudget),
    currency: baseCurrency,
    groupModeEnabled: Boolean(trip.finance?.groupModeEnabled ?? trip.isGroupTrip),
    groupSize: Math.max(
      1,
      sanitizePositive(trip.finance?.groupSize, trip.travelers > 0 ? trip.travelers : 1)
    ),
    exchangeRates,
    expenses,
    automation,
  }
}

export function getFinanceSummary(
  trip: Trip,
  referenceDate = new Date()
): {
  budgetTotal: number
  currency: string
  spent: number
  remaining: number
  perPersonEstimate: number
  expenseCount: number
  missingRateCurrencies: string[]
  totalTripDays: number
  elapsedTripDays: number
  actualDaily: number
  plannedDaily: number
} {
  const finance = getTripFinance(trip)
  const missingRateCurrencies = new Set<string>()
  const spent = finance.expenses.reduce((total, expense) => {
    const expenseCurrency = (expense.currency || finance.currency).toUpperCase()
    if (expenseCurrency === finance.currency.toUpperCase()) return total + expense.amount
    const rate = finance.exchangeRates[expenseCurrency]
    if (!rate || rate <= 0) {
      missingRateCurrencies.add(expenseCurrency)
      return total + expense.amount
    }
    return total + expense.amount * rate
  }, 0)
  const remaining = finance.budgetTotal - spent
  const travelers = finance.groupModeEnabled
    ? Math.max(1, finance.groupSize)
    : trip.travelers > 0
      ? trip.travelers
      : 1
  const perPersonEstimate = spent / travelers
  const totalTripDays = trip.totalDays > 0 ? trip.totalDays : 1

  const today = startOfUtcDay(referenceDate)
  const start = parseDateUtc(trip.startDate)
  const end = parseDateUtc(trip.endDate)

  let elapsedTripDays = 1
  if (today < start) {
    elapsedTripDays = 1
  } else if (today > end) {
    elapsedTripDays = totalTripDays
  } else {
    const elapsedMs = today.getTime() - start.getTime()
    elapsedTripDays = Math.min(totalTripDays, Math.max(1, Math.floor(elapsedMs / 86400000) + 1))
  }

  const paceWeightedSpend = finance.expenses.reduce(
    (total, expense) => total + getPaceWeightedAmount(expense, totalTripDays),
    0
  )
  const plannedDaily = finance.budgetTotal > 0 ? finance.budgetTotal / totalTripDays : 0
  const actualDaily = paceWeightedSpend > 0 ? paceWeightedSpend / elapsedTripDays : 0

  return {
    budgetTotal: finance.budgetTotal,
    currency: finance.currency,
    spent,
    remaining,
    perPersonEstimate,
    expenseCount: finance.expenses.length,
    missingRateCurrencies: Array.from(missingRateCurrencies).sort(),
    totalTripDays,
    elapsedTripDays,
    actualDaily,
    plannedDaily,
  }
}

export function runFinanceGuardrails(
  trip: Trip,
  referenceDate = new Date()
): {
  status: FinanceGuardrailStatus
  ratioPercent: number
  projectedExceedDay: number | null
  suggestions: string[]
} {
  const finance = getTripFinance(trip)
  const summary = getFinanceSummary(trip, referenceDate)
  const trackedPaceSpend = finance.expenses
    .filter((expense) => expense.category !== "flights")
    .reduce((total, expense) => total + getPaceWeightedAmount(expense, summary.totalTripDays), 0)
  const trackedActualDaily =
    trackedPaceSpend > 0 ? trackedPaceSpend / summary.elapsedTripDays : 0

  if (summary.budgetTotal <= 0 || summary.plannedDaily <= 0) {
    return {
      status: "on_track",
      ratioPercent: 0,
      projectedExceedDay: null,
      suggestions: ["Set a trip budget to enable pacing guidance."],
    }
  }

  const ratioPercent = (trackedActualDaily / summary.plannedDaily) * 100
  let status: FinanceGuardrailStatus = "on_track"

  if (ratioPercent > finance.automation.criticalAtPercent) {
    status = "over"
  } else if (ratioPercent > finance.automation.warnAtPercent) {
    status = "watch"
  }

  const projectedExceedDay =
    trackedActualDaily > 0 ? Math.ceil(summary.budgetTotal / trackedActualDaily) : null

  const suggestions: string[] = []
  if (
    projectedExceedDay &&
    projectedExceedDay <= summary.totalTripDays &&
    Number.isFinite(projectedExceedDay)
  ) {
    suggestions.push(`At current pace you may exceed budget by Day ${projectedExceedDay}.`)
  }

  const remainingDays = Math.max(1, summary.totalTripDays - summary.elapsedTripDays + 1)
  const expectedSpend = trackedActualDaily * summary.totalTripDays
  const overrun = Math.max(0, expectedSpend - summary.budgetTotal)

  if (overrun > 0) {
    const cutPerDay = overrun / remainingDays
    suggestions.push(`Reduce daily spend by about ${cutPerDay.toFixed(0)} to stay on plan.`)
    suggestions.push(
      `You can still stay under budget if the next ${remainingDays} days cap near ${(summary.remaining / remainingDays).toFixed(0)} per day.`
    )
  }

  if (finance.automation.suggestCutbackCategories && finance.expenses.length > 0) {
    const categoryTotals = finance.expenses.reduce<Record<ExpenseCategory, number>>(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      },
      {
        flights: 0,
        hotels: 0,
        transit: 0,
        food: 0,
        activities: 0,
        misc: 0,
      }
    )
    const topCategory = (Object.keys(categoryTotals) as ExpenseCategory[])
      .filter((category) => category !== "flights")
      .sort((a, b) => categoryTotals[b] - categoryTotals[a])[0]
    if (topCategory && categoryTotals[topCategory] > 0) {
      suggestions.push(
        `${topCategory.charAt(0).toUpperCase() + topCategory.slice(1)} is the highest spend category so far.`
      )
    }
  }

  if (suggestions.length === 0) {
    suggestions.push("Spending pace is healthy. Keep logging expenses daily.")
  }

  return { status, ratioPercent, projectedExceedDay: projectedExceedDay ?? null, suggestions }
}

export function isFinanceComplete(trip: Trip): boolean {
  const finance = getTripFinance(trip)
  return finance.budgetTotal > 0 && finance.expenses.length > 0
}

export function getNextStep(trip: Trip): {
  title: string
  description: string
  href: string
  cta: string
  recommendations: string[]
} {
  if (!trip.selectedFlights) {
    return {
      title: "Add your flights",
      description: "Log the flights you plan to take so the trip details stay complete.",
      href: `/trips/${trip.id}/flights`,
      cta: "Add Flights",
      recommendations: [
        "Start with your main outbound or one-way leg",
        "Add flight numbers, times, and notes while details are fresh",
      ],
    }
  }

  if (!hasStayCoverage(trip)) {
    const required = tripRequiredHotelNights(trip)
    const booked = trip.hotelNightsBooked ?? 0
    const shortBy = Math.max(0, required - booked)
    return {
      title: trip.selectedHotel ? "Extend your stay coverage" : "Add your stay",
      description:
        trip.selectedHotel && shortBy > 0
          ? `Bookings cover ${booked} night${booked === 1 ? "" : "s"}; this trip needs about ${required} night${required === 1 ? "" : "s"}.`
          : "Save where you are staying so the rest of the trip can stay organized.",
      href: `/trips/${trip.id}/hotels`,
      cta: "Add Stay",
      recommendations: [
        "Match check-in and check-out to your trip dates",
        "Add the main property first, then any extra stays",
      ],
    }
  }

  if (getManualItineraryDaysPlanned(trip) === 0) {
    return {
      title: "Auto-fill your itinerary",
      description: "Generate a day-by-day starter plan and refine it quickly.",
      href: `/trips/${trip.id}/itinerary`,
      cta: "Build Itinerary",
      recommendations: [
        "Create timeline blocks for each day",
        "Add must-see and hidden gem mix",
      ],
    }
  }

  if (!hasTransitRoutes(trip)) {
    return {
      title: "Save transit routes",
      description: "Connect itinerary points with practical transit plans.",
      href: `/trips/${trip.id}/transit`,
      cta: "Plan Transit",
      recommendations: [
        "Save hotel to first attraction route",
        "Fallback routing runs automatically when needed",
      ],
    }
  }

  if (trip.isGroupTrip && trip.approvalsPending > 0) {
    return {
      title: "Resolve pending approvals",
      description: "Your group has votes waiting before shared trip details are finalized.",
      href: `/trips/${trip.id}/group`,
      cta: "Review Approvals",
      recommendations: [
        "Review the latest flight and stay choices together",
        "Clear approvals so the plan stays aligned",
      ],
    }
  }

  if (!isFinanceComplete(trip)) {
    return {
      title: "Set finance tracking",
      description: "Configure split rules, budget timeline, and FX alerts.",
      href: `/trips/${trip.id}/finance`,
      cta: "Setup Finance",
      recommendations: [
        "Enable equal or custom split",
        "Track daily budget against total",
      ],
    }
  }

  return {
    title: "Trip is ready",
    description: "Everything critical is set. Review confirmations and documents.",
    href: `/trips/${trip.id}/docs`,
    cta: "Open Documents",
    recommendations: [
      "Verify tickets and hotel confirmations",
      "Share final plan with travelers",
    ],
  }
}

export function getMissingChecklist(trip: Trip): string[] {
  const missing: string[] = []
  if (!trip.selectedFlights) missing.push("Flights not added")
  if (!hasStayCoverage(trip)) {
    const required = tripRequiredHotelNights(trip)
    const booked = trip.hotelNightsBooked ?? 0
    if (trip.selectedHotel && booked < required) {
      missing.push(`Stay: need ${required} nights, have ${booked}`)
    } else {
      missing.push("Stay not added")
    }
  }
  if (getManualItineraryDaysPlanned(trip) === 0) missing.push("Itinerary not started")
  if (!hasTransitRoutes(trip)) missing.push("Transit routes not saved")
  if (!isFinanceComplete(trip)) missing.push("Finance setup incomplete")
  if (trip.isGroupTrip && trip.approvalsPending > 0) {
    missing.push(`${trip.approvalsPending} approvals pending`)
  }
  return missing
}

export function getDateRangeLabel(trip: Trip): string {
  return `${formatHumanDate(trip.startDate)} to ${formatHumanDate(trip.endDate)}`
}

function parseDateUtc(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function getOrdinalSuffix(day: number): string {
  const mod10 = day % 10
  const mod100 = day % 100
  if (mod100 >= 11 && mod100 <= 13) return "th"
  if (mod10 === 1) return "st"
  if (mod10 === 2) return "nd"
  if (mod10 === 3) return "rd"
  return "th"
}

function formatHumanDate(isoDate: string): string {
  const parsed = parseDateUtc(isoDate)
  if (Number.isNaN(parsed.getTime())) return isoDate
  const month = parsed.toLocaleString("en-US", { month: "short", timeZone: "UTC" })
  const day = parsed.getUTCDate()
  const year = parsed.getUTCFullYear()
  return `${month} ${day}${getOrdinalSuffix(day)} ${year}`
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
}

export function getTripsByTimeline(
  allTrips: Trip[],
  referenceDate = new Date()
): TripBuckets {
  const today = startOfUtcDay(referenceDate)

  return allTrips.reduce<TripBuckets>(
    (acc, trip) => {
      const start = parseDateUtc(trip.startDate)
      const end = parseDateUtc(trip.endDate)

      if (today < start) {
        acc.future.push(trip)
      } else if (today > end) {
        acc.past.push(trip)
      } else {
        acc.current.push(trip)
      }

      return acc
    },
    { future: [], current: [], past: [] }
  )
}

function setTripTransitRoutes(trip: Trip, nextRoutes: TransitRoute[]): Trip {
  const now = new Date().toISOString().slice(0, 10)
  trip.transitRoutes = nextRoutes
  trip.transitSaved = nextRoutes.length > 0
  trip.lastUpdated = now
  return trip
}

export function getTransitRoutes(tripId: string): TransitRoute[] {
  const trip = getTripById(tripId)
  return trip?.transitRoutes ?? []
}

export function saveTransitRoute(
  tripId: string,
  route: TransitRoute
): TransitRoute[] {
  const trip = getTripById(tripId)
  if (!trip) return []

  const nextRoute: TransitRoute = {
    ...route,
    tripId,
    updatedAt: route.updatedAt || new Date().toISOString(),
    createdAt: route.createdAt || new Date().toISOString(),
  }

  return setTripTransitRoutes(trip, [...(trip.transitRoutes ?? []), nextRoute])
    .transitRoutes as TransitRoute[]
}

export function updateTransitRoute(
  tripId: string,
  routeId: string,
  patch: Partial<TransitRoute>
): TransitRoute[] {
  const trip = getTripById(tripId)
  if (!trip) return []

  const nextRoutes = (trip.transitRoutes ?? []).map((route) =>
    route.id === routeId
      ? {
          ...route,
          ...patch,
          tripId,
          id: route.id,
          updatedAt: new Date().toISOString(),
        }
      : route
  )

  return setTripTransitRoutes(trip, nextRoutes).transitRoutes as TransitRoute[]
}

export function deleteTransitRoute(
  tripId: string,
  routeId: string
): TransitRoute[] {
  const trip = getTripById(tripId)
  if (!trip) return []

  const nextRoutes = (trip.transitRoutes ?? []).filter(
    (route) => route.id !== routeId
  )

  return setTripTransitRoutes(trip, nextRoutes).transitRoutes as TransitRoute[]
}
