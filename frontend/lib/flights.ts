export type FlightOffer = {
  id: string
  totalAmount: string
  totalCurrency: string
  owner: { name: string; iataCode: string }
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
