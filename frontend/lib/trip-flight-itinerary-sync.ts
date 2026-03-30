import type { SavedFlightRow } from "@/lib/supabase-trip-flights"
import type { ItineraryTimeBlock, Trip, TripItineraryItem } from "@/lib/trips"
import { computeItineraryDaysPlanned, getTripItineraryItems } from "@/lib/trips"

function parseUtcNoonMs(isoDate: string): number {
  return new Date(`${isoDate}T12:00:00.000Z`).getTime()
}

export function autoFlightItemId(tripId: string, leg: "outbound" | "inbound"): string {
  return `${tripId}:auto-flight:${leg}`
}

function dayIndexForFlightDate(trip: Trip, flightDate: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(flightDate)) return 1
  const start = parseUtcNoonMs(trip.startDate)
  const end = parseUtcNoonMs(trip.endDate)
  const flight = parseUtcNoonMs(flightDate)
  if (![start, end, flight].every(Number.isFinite)) return 1
  if (flight <= start) return 1
  if (flight >= end) return Math.max(1, trip.totalDays)
  const day = Math.floor((flight - start) / 86400000) + 1
  return Math.min(Math.max(1, day), Math.max(1, trip.totalDays))
}

function pickOutbound(flights: SavedFlightRow[]): SavedFlightRow | undefined {
  const pool = flights.filter((f) => f.source === "outbound" || f.source === "one_way")
  if (pool.length === 0) return undefined
  return [...pool].sort((a, b) => (a.date || "").localeCompare(b.date || ""))[0]
}

function pickInbound(flights: SavedFlightRow[]): SavedFlightRow | undefined {
  const pool = flights.filter((f) => f.source === "inbound")
  if (pool.length === 0) return undefined
  return [...pool].sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0]
}

function buildAutoItem(trip: Trip, leg: "outbound" | "inbound", flight: SavedFlightRow): TripItineraryItem {
  const now = new Date().toISOString()
  const dayIndex = dayIndexForFlightDate(trip, flight.date)
  const timeBlock: ItineraryTimeBlock = leg === "outbound" ? "morning" : "evening"
  const category = leg === "outbound" ? "outbound_flight" : "inbound_flight"
  const route = flight.route.trim()
  const fn = flight.flightNumber.trim()
  const title =
    route && fn ? `${route} · ${fn}` : route || (leg === "outbound" ? "Outbound flight" : "Inbound flight")
  const noteBits = [flight.airline.trim(), flight.departure && `Dep ${flight.departure}`, flight.arrival && `Arr ${flight.arrival}`].filter(
    Boolean
  ) as string[]
  const notes = noteBits.length > 0 ? noteBits.join(" · ") : undefined

  return {
    id: autoFlightItemId(trip.id, leg),
    tripId: trip.id,
    dayIndex,
    timeBlock,
    status: "planned",
    category,
    title,
    locationLabel: route || (leg === "outbound" ? "Departure" : "Return"),
    notes,
    sortOrder: leg === "outbound" ? 5 : 15,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Drops prior auto-generated flight rows and re-adds itinerary rows from saved outbound/inbound legs.
 */
export function mergeFlightLegsIntoItinerary(trip: Trip, flights: SavedFlightRow[]): TripItineraryItem[] {
  const existing = getTripItineraryItems(trip).filter((item) => !item.id.includes(":auto-flight:"))
  const outbound = pickOutbound(flights)
  const inbound = pickInbound(flights)
  const added: TripItineraryItem[] = []
  if (outbound) added.push(buildAutoItem(trip, "outbound", outbound))
  if (inbound) added.push(buildAutoItem(trip, "inbound", inbound))
  return [...existing, ...added]
}

export function itineraryWithFlightsSummary(trip: Trip, flights: SavedFlightRow[]) {
  const itineraryItems = mergeFlightLegsIntoItinerary(trip, flights)
  return {
    itineraryItems,
    itineraryDaysPlanned: computeItineraryDaysPlanned(itineraryItems),
  }
}
