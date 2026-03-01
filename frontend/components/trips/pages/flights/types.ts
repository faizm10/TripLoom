/**
 * Types used by the flights page (manual search, saved flights, inbound lookup).
 */

export type Place = { displayName: string; iataCode: string }

export type TripType = "one_way" | "round_trip" | "multi_city"

export type Leg = { origin: Place | null; destination: Place | null; date: string }

export type SavedFlightChoice = {
  id: string
  source: string
  route: string
  date: string
  departure: string
  arrival: string
  duration: string
  stops: string
  airline: string
  cost: string
  bookUrl?: string | null
}

export type ManualSortKey =
  | "route"
  | "date"
  | "departure"
  | "arrival"
  | "duration"
  | "stops"
  | "cost"
  | "airline"

export type StopDetail = {
  sliceIndex: number
  stopIndex: number
  airportCode: string
  airportName: string
  layoverMinutes: number
}

export type InboundStopDetail = { airport: string; layover: string }

export type InboundLookupResult = {
  flightNumber: string
  airline: string
  airlineLogoUrl?: string
  routeFrom: string
  routeTo: string
  departureAirportName?: string
  arrivalAirportName?: string
  departureLocal: string
  arrivalLocal: string
  departureTimezone?: string
  arrivalTimezone?: string
  duration: string
  terminalGate?: string
  stops: number
}

export type InboundLookupDraft = InboundLookupResult & {
  cost: string
  stopDetails: InboundStopDetail[]
}

export type InboundFlightEntry = InboundLookupDraft & { id: string; date: string }
