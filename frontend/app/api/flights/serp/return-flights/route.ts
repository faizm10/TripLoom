import { NextResponse } from "next/server"

import type { FlightOffer } from "@/lib/flights"

const SERPAPI_BASE = "https://serpapi.com/search"

function getSerpApiKey(): string | undefined {
  return process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY
}

function durationMinToStr(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

type SerpFlight = {
  departure_airport?: { id?: string; name?: string; time?: string }
  arrival_airport?: { id?: string; name?: string; time?: string }
  duration?: number
  airline?: string
  flight_number?: string
}

type SerpOffer = {
  flights?: SerpFlight[]
  total_duration?: number
  price?: number
  type?: string
  departure_token?: string
  booking_token?: string
}

type SerpResponse = {
  search_metadata?: { status?: string }
  best_flights?: SerpOffer[]
  other_flights?: SerpOffer[]
  error?: string
}

function serpOfferToFlightOffer(
  serp: SerpOffer,
  index: number,
  params: {
    departureId: string
    arrivalId: string
    outboundDate: string
    returnDate: string
    currency: string
    outboundOfferId: string
  }
): FlightOffer {
  const flights = serp.flights ?? []
  const first = flights[0]
  const last = flights[flights.length - 1]
  const airlineName = first?.airline ?? "Airline"
  const totalDuration = serp.total_duration != null ? durationMinToStr(serp.total_duration) : ""

  const segments = flights.map((f) => ({
    operatingCarrier: { name: f.airline ?? "", iataCode: "" },
    marketingCarrier: { name: f.airline ?? "", iataCode: "" },
    flightNumber: f.flight_number ?? "",
    departingAt: f.departure_airport?.time ?? "",
    arrivingAt: f.arrival_airport?.time ?? "",
    origin: {
      name: f.departure_airport?.name ?? "",
      iataCode: f.departure_airport?.id ?? "",
    },
    destination: {
      name: f.arrival_airport?.name ?? "",
      iataCode: f.arrival_airport?.id ?? "",
    },
    duration: f.duration != null ? durationMinToStr(f.duration) : "",
  }))

  const origin = first?.departure_airport
  const destination = last?.arrival_airport
  const id = `serp-return-${params.outboundOfferId}-${index}-${serp.booking_token ?? serp.departure_token ?? index}`

  return {
    id,
    totalAmount: String(serp.price ?? 0),
    totalCurrency: params.currency,
    owner: { name: airlineName, iataCode: "" },
    ...(serp.booking_token && { bookingToken: serp.booking_token }),
    ...(serp.departure_token && { departureToken: serp.departure_token }),
    slices: [
      {
        origin: {
          name: origin?.name ?? "",
          iataCode: origin?.id ?? "",
          cityName: undefined,
        },
        destination: {
          name: destination?.name ?? "",
          iataCode: destination?.id ?? "",
          cityName: undefined,
        },
        duration: totalDuration,
        segments,
      },
    ],
    expiresAt: "",
  }
}

/**
 * Fetch return flight options for round trip after user selects an outbound.
 * Uses SerpAPI with departure_token from the selected outbound offer.
 */
export async function POST(request: Request) {
  const apiKey = getSerpApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "SerpAPI unavailable. Set SERPAPI_API_KEY in env." },
      { status: 503 }
    )
  }

  let body: {
    departure_token: string
    outbound_date: string
    return_date: string
    /** IATA of origin (outbound departure) - return flies TO this */
    arrival_id: string
    /** IATA of destination (outbound arrival) - return flies FROM this */
    departure_id: string
    adults?: number
    outbound_offer_id?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 })
  }

  const departureToken = (body.departure_token ?? "").trim()
  const outboundDate = (body.outbound_date ?? "").trim()
  const returnDate = (body.return_date ?? "").trim()
  const arrivalId = (body.arrival_id ?? "").trim().toUpperCase()
  const departureId = (body.departure_id ?? "").trim().toUpperCase()

  if (!departureToken) {
    return NextResponse.json(
      { ok: false, error: "Missing departure_token." },
      { status: 400 }
    )
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(outboundDate)) {
    return NextResponse.json(
      { ok: false, error: "outbound_date must be YYYY-MM-DD." },
      { status: 400 }
    )
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(returnDate)) {
    return NextResponse.json(
      { ok: false, error: "return_date must be YYYY-MM-DD." },
      { status: 400 }
    )
  }
  if (departureId.length !== 3 || arrivalId.length !== 3) {
    return NextResponse.json(
      { ok: false, error: "departure_id and arrival_id must be 3-letter IATA codes." },
      { status: 400 }
    )
  }

  const adults = Math.min(10, Math.max(1, Number(body.adults) || 1))

  // SerpAPI uses the same convention as the initial round-trip search: departure_id = trip
  // origin (we return TO), arrival_id = trip destination (we return FROM). Our body uses
  // departure_id = return origin (FROM), arrival_id = return destination (TO), so swap.
  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: apiKey,
    hl: "en",
    type: "1", // round trip (required when using departure_token for return leg)
    departure_token: departureToken,
    outbound_date: outboundDate,
    return_date: returnDate,
    departure_id: arrivalId,   // trip origin = return destination (YYZ)
    arrival_id: departureId,   // trip destination = return origin (BER)
    adults: String(adults),
    currency: "USD",
  })

  try {
    const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, { cache: "no-store" })
    const data = (await res.json().catch(() => null)) as SerpResponse | null

    if (!res.ok) {
      const msg = data?.error ?? `SerpAPI error: ${res.status}`
      return NextResponse.json({ ok: false, error: msg }, { status: res.status >= 500 ? 502 : 400 })
    }

    if (data?.search_metadata?.status === "Error" && data?.error) {
      return NextResponse.json({ ok: false, error: data.error }, { status: 400 })
    }

    const best = data?.best_flights ?? []
    const other = data?.other_flights ?? []
    const all = [...best, ...other]
    const outboundOfferId = body.outbound_offer_id ?? ""

    const normalized: FlightOffer[] = all.map((offer, i) =>
      serpOfferToFlightOffer(offer, i, {
        departureId,
        arrivalId,
        outboundDate,
        returnDate,
        currency: "USD",
        outboundOfferId,
      })
    )

    return NextResponse.json({ ok: true, offers: normalized })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to fetch return flights",
      },
      { status: 500 }
    )
  }
}
