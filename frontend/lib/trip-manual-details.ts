import type { SavedFlightRow } from "@/lib/supabase-trip-flights"
import type { TripHotelStay } from "@/lib/supabase-trip-hotels"

export function summarizeFlights(flights: SavedFlightRow[]): string | undefined {
  if (flights.length === 0) return undefined
  if (flights.length === 1) {
    const flight = flights[0]
    const via =
      flight.stopDetails.length > 0
        ? `via ${flight.stopDetails.map((stop) => stop.airport).filter(Boolean).join(", ")}`
        : undefined
    return [flight.route, via, flight.date, flight.flightNumber].filter(Boolean).join(" · ")
  }
  return `${flights.length} flights logged`
}

export function summarizeHotels(stays: TripHotelStay[]): string | undefined {
  if (stays.length === 0) return undefined
  if (stays.length === 1) {
    const stay = stays[0]
    return [stay.propertyName, stay.area].filter(Boolean).join(" · ")
  }
  return `${stays.length} stays logged`
}
