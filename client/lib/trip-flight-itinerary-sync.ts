import type { SavedFlightRow } from "@/lib/supabase-trip-flights"
import type { SavedGroundTripRow } from "@/lib/supabase-trip-ground"
import {
  parseFlexibleTime12h,
  time12hPartsTo24h,
  travelLegTimesToLocalRange,
} from "@/lib/time-12h"
import type { ItineraryTimeBlock, Trip, TripItineraryItem } from "@/lib/trips"
import { computeItineraryDaysPlanned, getTripItineraryItems } from "@/lib/trips"

function parseUtcNoonMs(isoDate: string): number {
  return new Date(`${isoDate}T12:00:00.000Z`).getTime()
}

export function autoFlightItemId(tripId: string, leg: "outbound" | "inbound"): string {
  return `${tripId}:auto-flight:${leg}`
}

export function autoGroundItemId(tripId: string, leg: "outbound" | "inbound"): string {
  return `${tripId}:auto-ground:${leg}`
}

function dayIndexForTravelDate(trip: Trip, travelDate: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(travelDate)) return 1
  const start = parseUtcNoonMs(trip.startDate)
  const end = parseUtcNoonMs(trip.endDate)
  const d = parseUtcNoonMs(travelDate)
  if (![start, end, d].every(Number.isFinite)) return 1
  if (d <= start) return 1
  if (d >= end) return Math.max(1, trip.totalDays)
  const day = Math.floor((d - start) / 86400000) + 1
  return Math.min(Math.max(1, day), Math.max(1, trip.totalDays))
}

function stripAutoTransportItems(trip: Trip): TripItineraryItem[] {
  return getTripItineraryItems(trip).filter(
    (item) => !item.id.includes(":auto-flight:") && !item.id.includes(":auto-ground:")
  )
}

function pickOutboundFlight(flights: SavedFlightRow[]): SavedFlightRow | undefined {
  const pool = flights.filter((f) => f.source === "outbound" || f.source === "one_way")
  if (pool.length === 0) return undefined
  return [...pool].sort((a, b) => (a.date || "").localeCompare(b.date || ""))[0]
}

function pickInboundFlight(flights: SavedFlightRow[]): SavedFlightRow | undefined {
  const pool = flights.filter((f) => f.source === "inbound")
  if (pool.length === 0) return undefined
  return [...pool].sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0]
}

function pickOutboundGround(ground: SavedGroundTripRow[]): SavedGroundTripRow | undefined {
  const pool = ground.filter((g) => g.source === "outbound" || g.source === "one_way")
  if (pool.length === 0) return undefined
  return [...pool].sort((a, b) => (a.date || "").localeCompare(b.date || ""))[0]
}

function pickInboundGround(ground: SavedGroundTripRow[]): SavedGroundTripRow | undefined {
  const pool = ground.filter((g) => g.source === "inbound")
  if (pool.length === 0) return undefined
  return [...pool].sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0]
}

function timeBlockFromDeparture(departure: string, legFallback: "outbound" | "inbound"): ItineraryTimeBlock {
  const dep = parseFlexibleTime12h(departure)
  if (!dep) {
    return legFallback === "outbound" ? "morning" : "evening"
  }
  const { hour } = time12hPartsTo24h(dep)
  if (hour < 12) return "morning"
  if (hour < 17) return "afternoon"
  return "evening"
}

function buildFlightAutoItem(trip: Trip, leg: "outbound" | "inbound", flight: SavedFlightRow): TripItineraryItem {
  const stableTs = `${flight.date.trim() || "1970-01-01"}T12:00:00.000Z`
  const dayIndex = dayIndexForTravelDate(trip, flight.date)
  const category = leg === "outbound" ? "outbound_flight" : "inbound_flight"
  const timeRange = travelLegTimesToLocalRange(
    flight.date.trim(),
    flight.departure,
    flight.arrival
  )
  const timeBlock = timeBlockFromDeparture(flight.departure, leg)
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
    startTimeLocal: timeRange?.startTimeLocal,
    endTimeLocal: timeRange?.endTimeLocal,
    sortOrder: leg === "outbound" ? 5 : 15,
    createdAt: stableTs,
    updatedAt: stableTs,
  }
}

function buildGroundAutoItem(trip: Trip, leg: "outbound" | "inbound", row: SavedGroundTripRow): TripItineraryItem {
  const stableTs = `${row.date.trim() || "1970-01-01"}T12:00:00.000Z`
  const dayIndex = dayIndexForTravelDate(trip, row.date)
  const timeRange = travelLegTimesToLocalRange(row.date.trim(), row.departure, row.arrival)
  const timeBlock = timeBlockFromDeparture(row.departure, leg)
  const route = row.route.trim()
  const svc = row.serviceNumber.trim()
  const title =
    route && svc ? `${route} · ${svc}` : route || (leg === "outbound" ? "Outbound bus/train" : "Return bus/train")
  const noteBits = [row.operator.trim(), row.departure && `Dep ${row.departure}`, row.arrival && `Arr ${row.arrival}`].filter(
    Boolean
  ) as string[]
  const notes = noteBits.length > 0 ? noteBits.join(" · ") : undefined

  return {
    id: autoGroundItemId(trip.id, leg),
    tripId: trip.id,
    dayIndex,
    timeBlock,
    status: "planned",
    category: "commute",
    title,
    locationLabel: route || (leg === "outbound" ? "Departure" : "Return"),
    notes,
    startTimeLocal: timeRange?.startTimeLocal,
    endTimeLocal: timeRange?.endTimeLocal,
    sortOrder: leg === "outbound" ? 6 : 16,
    createdAt: stableTs,
    updatedAt: stableTs,
  }
}

/**
 * Drops auto flight + auto ground rows and re-adds from saved legs (flights take outbound/inbound slots first; ground fills only if no flight on that leg).
 */
export function mergeTransportLegsIntoItinerary(
  trip: Trip,
  flights: SavedFlightRow[],
  groundTrips: SavedGroundTripRow[]
): TripItineraryItem[] {
  const existing = stripAutoTransportItems(trip)
  const added: TripItineraryItem[] = []

  const obF = pickOutboundFlight(flights)
  const ibF = pickInboundFlight(flights)
  const obG = pickOutboundGround(groundTrips)
  const ibG = pickInboundGround(groundTrips)

  if (obF) added.push(buildFlightAutoItem(trip, "outbound", obF))
  else if (obG) added.push(buildGroundAutoItem(trip, "outbound", obG))

  if (ibF) added.push(buildFlightAutoItem(trip, "inbound", ibF))
  else if (ibG) added.push(buildGroundAutoItem(trip, "inbound", ibG))

  return [...existing, ...added]
}

/** @deprecated Use mergeTransportLegsIntoItinerary with empty ground. */
export function mergeFlightLegsIntoItinerary(trip: Trip, flights: SavedFlightRow[]): TripItineraryItem[] {
  return mergeTransportLegsIntoItinerary(trip, flights, [])
}

export function itineraryWithFlightsSummary(trip: Trip, flights: SavedFlightRow[]) {
  const itineraryItems = mergeTransportLegsIntoItinerary(trip, flights, [])
  return {
    itineraryItems,
    itineraryDaysPlanned: computeItineraryDaysPlanned(itineraryItems),
  }
}

export function itineraryWithTransportSummary(
  trip: Trip,
  flights: SavedFlightRow[],
  groundTrips: SavedGroundTripRow[]
) {
  const itineraryItems = mergeTransportLegsIntoItinerary(trip, flights, groundTrips)
  return {
    itineraryItems,
    itineraryDaysPlanned: computeItineraryDaysPlanned(itineraryItems),
  }
}
