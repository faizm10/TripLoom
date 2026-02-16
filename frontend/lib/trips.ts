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
export type TransitMode =
  | "subway"
  | "bus"
  | "tram"
  | "rail"
  | "ferry"
  | "walk_mix"
  | "other"

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
  activities: string[]
}

export type TripBuckets = {
  future: Trip[]
  current: Trip[]
  past: Trip[]
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

const trips: Trip[] = [
  {
    id: "toronto-spring",
    destination: "Toronto, Canada",
    startDate: "2026-04-12",
    endDate: "2026-04-20",
    travelers: 1,
    isGroupTrip: false,
    status: "planning",
    lastUpdated: "2026-02-14",
    progress: 0,
    selectedFlights: false,
    selectedHotel: false,
    itineraryDaysPlanned: 0,
    totalDays: 8,
    transitSaved: false,
    transitRoutes: [],
    financeSet: false,
    approvalsPending: 0,
    budgetTotal: 0,
    perPerson: 0,
    activities: [],
  },
  {
    id: "tokyo-fall",
    destination: "Tokyo, Japan",
    startDate: "2026-10-03",
    endDate: "2026-10-12",
    travelers: 1,
    isGroupTrip: false,
    status: "booked",
    lastUpdated: "2026-02-14",
    progress: 78,
    selectedFlights: true,
    selectedHotel: true,
    itineraryDaysPlanned: 7,
    totalDays: 9,
    transitSaved: true,
    transitRoutes: [
      {
        id: "tokyo-route-1",
        tripId: "tokyo-fall",
        dayIndex: 1,
        fromLabel: "Shinjuku Station",
        toLabel: "Senso-ji Temple",
        mode: "rail",
        durationMinutes: 34,
        departureTimeLocal: "2026-10-03T08:30",
        arrivalTimeLocal: "2026-10-03T09:04",
        estimatedCost: 2.15,
        currency: "USD",
        provider: "manual",
        transfers: 1,
        walkingMinutes: 9,
        notes: "Use Suica card",
        createdAt: "2026-02-14T09:15:00.000Z",
        updatedAt: "2026-02-14T09:15:00.000Z",
      },
    ],
    financeSet: true,
    approvalsPending: 0,
    budgetTotal: 2940,
    perPerson: 2940,
    hotelArea: "Shinjuku",
    flightSummary: "Round-trip, non-stop, 13h 15m",
    hotelSummary: "4-star near transit hub",
    activities: [
      "Hotel confirmation uploaded",
      "Transit routes saved for Days 1-3",
      "FX alert: JPY improved by 1.2%",
    ],
  },
  {
    id: "lisbon-weekend",
    destination: "Lisbon, Portugal",
    startDate: "2026-06-05",
    endDate: "2026-06-08",
    travelers: 2,
    isGroupTrip: true,
    status: "in_progress",
    lastUpdated: "2026-02-13",
    progress: 64,
    selectedFlights: true,
    selectedHotel: true,
    itineraryDaysPlanned: 1,
    totalDays: 3,
    transitSaved: false,
    transitRoutes: [],
    financeSet: false,
    approvalsPending: 1,
    budgetTotal: 1320,
    perPerson: 660,
    hotelArea: "Baixa",
    flightSummary: "Round-trip, non-stop, 2h 40m",
    hotelSummary: "Boutique stay in city center",
    activities: [
      "Added tram loop as Day 1 route",
      "Approval requested for hotel room upgrade",
    ],
  },
]

export function hasTransitRoutes(trip: Trip): boolean {
  if (Array.isArray(trip.transitRoutes)) return trip.transitRoutes.length > 0
  return trip.transitSaved
}

export function getTripTransitRoutes(trip: Trip): TransitRoute[] {
  return Array.isArray(trip.transitRoutes) ? trip.transitRoutes : []
}

export function getTrips(): Trip[] {
  return trips
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
      title: "Pick your flights",
      description: "Compare top offer combinations and lock your best route.",
      href: `/trips/${trip.id}/flights`,
      cta: "Choose Flights",
      recommendations: [
        "Best pick: 1 stop, good baggage, balanced duration",
        "Cheapest pick: save $120 with longer layover",
        "Fastest pick: non-stop, slightly higher fare",
      ],
    }
  }

  if (!trip.selectedHotel) {
    return {
      title: "Choose your hotel",
      description: "Select a stay close to saved places and transit nodes.",
      href: `/trips/${trip.id}/hotels`,
      cta: "Choose Hotel",
      recommendations: [
        "Best area for first timers near city center",
        "Filter by cancellation policy and guest rating",
      ],
    }
  }

  if (trip.itineraryDaysPlanned === 0) {
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
      description: "Your group has votes waiting before bookings are finalized.",
      href: `/trips/${trip.id}/group`,
      cta: "Review Approvals",
      recommendations: [
        "1 flight vote and 1 hotel vote are pending",
        "Finalize to avoid price movement",
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
  if (!trip.selectedFlights) missing.push("Flights not selected")
  if (!trip.selectedHotel) missing.push("Hotel not selected")
  if (trip.itineraryDaysPlanned === 0) missing.push("Itinerary not started")
  if (!trip.transitSaved) missing.push("Transit routes not saved")
  if (!isFinanceComplete(trip)) missing.push("Finance setup incomplete")
  if (!hasTransitRoutes(trip)) missing.push("Transit routes not saved")
  if (!trip.financeSet) missing.push("Finance setup incomplete")
  if (trip.isGroupTrip && trip.approvalsPending > 0) {
    missing.push(`${trip.approvalsPending} approvals pending`)
  }
  return missing
}

export function getDateRangeLabel(trip: Trip): string {
  return `${trip.startDate} to ${trip.endDate}`
}

function parseDateUtc(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
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
