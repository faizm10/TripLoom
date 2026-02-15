export type TripStatus = "planning" | "booked" | "in_progress"

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
  financeSet: boolean
  approvalsPending: number
  budgetTotal: number
  perPerson: number
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

  if (!trip.transitSaved) {
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

  if (!trip.financeSet) {
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
