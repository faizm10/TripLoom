export type FlightOffer = {
  id: string
  totalAmount: string
  totalCurrency: string
  owner: { name: string; iataCode: string }
  /** When set (e.g. SerpAPI), use this for Book instead of airline URL */
  bookUrl?: string
  /** SerpAPI: when set, resolve via /api/flights/serp/booking-options for direct booking link */
  bookingToken?: string
  /** SerpAPI round-trip: token to fetch return flights when user selects this outbound */
  departureToken?: string
  slices: {
    origin: { name: string; iataCode: string; cityName?: string }
    destination: { name: string; iataCode: string; cityName?: string }
    duration: string
    segments: {
      operatingCarrier: { name: string; iataCode: string }
      marketingCarrier: { name: string; iataCode: string }
      flightNumber: string
      departingAt: string
      arrivingAt: string
      origin: { name: string; iataCode: string }
      destination: { name: string; iataCode: string }
      duration: string
    }[]
  }[]
  expiresAt: string
}
