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

function buildGoogleFlightsUrl(params: {
  departureId: string
  arrivalId: string
  outboundDate: string
  returnDate?: string
  oneWay: boolean
}): string {
  const u = new URL("https://www.google.com/travel/flights")
  u.searchParams.set("hl", "en")
  u.searchParams.set("departure_id", params.departureId)
  u.searchParams.set("arrival_id", params.arrivalId)
  u.searchParams.set("outbound_date", params.outboundDate)
  if (!params.oneWay && params.returnDate) {
    u.searchParams.set("return_date", params.returnDate)
  }
  if (params.oneWay) {
    u.searchParams.set("type", "2") // one way
  } else {
    u.searchParams.set("type", "1") // round trip
  }
  return u.toString()
}

function serpOfferToFlightOffer(
  serp: SerpOffer,
  index: number,
  params: {
    departureId: string
    arrivalId: string
    outboundDate: string
    returnDate?: string
    oneWay: boolean
    currency: string
  }
): FlightOffer {
  const flights = serp.flights ?? []
  const first = flights[0]
  const last = flights[flights.length - 1]
  const airlineName = first?.airline ?? "Airline"
  const totalDuration = serp.total_duration != null ? durationMinToStr(serp.total_duration) : ""

  const toSegment = (f: SerpFlight) => ({
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
  })

  const id = `serp-${index}-${serp.departure_token ?? index}`

  let slices: FlightOffer["slices"]
  if (!params.oneWay && params.returnDate && params.arrivalId && flights.length > 1) {
    const arrivalIdUpper = params.arrivalId.toUpperCase()
    const splitIndex = flights.findIndex(
      (f) => (f.arrival_airport?.id ?? "").toUpperCase() === arrivalIdUpper
    )
    if (splitIndex >= 0 && splitIndex < flights.length - 1) {
      const outboundFlights = flights.slice(0, splitIndex + 1)
      const returnFlights = flights.slice(splitIndex + 1)
      const outboundDur = outboundFlights.reduce((s, f) => s + (f.duration ?? 0), 0)
      const returnDur = returnFlights.reduce((s, f) => s + (f.duration ?? 0), 0)
      const obFirst = outboundFlights[0]
      const obLast = outboundFlights[outboundFlights.length - 1]
      const retFirst = returnFlights[0]
      const retLast = returnFlights[returnFlights.length - 1]
      slices = [
        {
          origin: {
            name: obFirst?.departure_airport?.name ?? "",
            iataCode: obFirst?.departure_airport?.id ?? "",
            cityName: undefined,
          },
          destination: {
            name: obLast?.arrival_airport?.name ?? "",
            iataCode: obLast?.arrival_airport?.id ?? "",
            cityName: undefined,
          },
          duration: durationMinToStr(outboundDur),
          segments: outboundFlights.map(toSegment),
        },
        {
          origin: {
            name: retFirst?.departure_airport?.name ?? "",
            iataCode: retFirst?.departure_airport?.id ?? "",
            cityName: undefined,
          },
          destination: {
            name: retLast?.arrival_airport?.name ?? "",
            iataCode: retLast?.arrival_airport?.id ?? "",
            cityName: undefined,
          },
          duration: durationMinToStr(returnDur),
          segments: returnFlights.map(toSegment),
        },
      ]
    } else {
      slices = [
        {
          origin: {
            name: first?.departure_airport?.name ?? "",
            iataCode: first?.departure_airport?.id ?? "",
            cityName: undefined,
          },
          destination: {
            name: last?.arrival_airport?.name ?? "",
            iataCode: last?.arrival_airport?.id ?? "",
            cityName: undefined,
          },
          duration: totalDuration,
          segments: flights.map(toSegment),
        },
      ]
    }
  } else {
    slices = [
      {
        origin: {
          name: first?.departure_airport?.name ?? "",
          iataCode: first?.departure_airport?.id ?? "",
          cityName: undefined,
        },
        destination: {
          name: last?.arrival_airport?.name ?? "",
          iataCode: last?.arrival_airport?.id ?? "",
          cityName: undefined,
        },
        duration: totalDuration,
        segments: flights.map(toSegment),
      },
    ]
  }

  return {
    id,
    totalAmount: String(serp.price ?? 0),
    totalCurrency: params.currency,
    owner: { name: airlineName, iataCode: "" },
    bookUrl: buildGoogleFlightsUrl({
      departureId: params.departureId,
      arrivalId: params.arrivalId,
      outboundDate: params.outboundDate,
      returnDate: params.returnDate,
      oneWay: params.oneWay,
    }),
    ...(serp.booking_token && { bookingToken: serp.booking_token }),
    ...(serp.departure_token && { departureToken: serp.departure_token }),
    slices,
    expiresAt: "",
  }
}

export async function POST(request: Request) {
  const apiKey = getSerpApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "SerpAPI flight search unavailable. Set SERPAPI_API_KEY in env." },
      { status: 503 }
    )
  }

  type SliceInput = { origin: string; destination: string; departure_date: string }
  let body: {
    slices?: SliceInput[]
    origin?: string
    destination?: string
    departure_date?: string
    return_date?: string
    adults?: number
    cabin_class?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 })
  }

  const adults = Math.min(10, Math.max(1, Number(body.adults) || 1))
  let slices: SliceInput[]
  if (Array.isArray(body.slices) && body.slices.length > 0 && body.slices.length <= 6) {
    slices = body.slices.map((s) => ({
      origin: (s.origin || "").trim().toUpperCase(),
      destination: (s.destination || "").trim().toUpperCase(),
      departure_date: (s.departure_date || "").trim(),
    }))
  } else if (body.origin && body.destination && body.departure_date) {
    slices = [
      {
        origin: (body.origin || "").trim().toUpperCase(),
        destination: (body.destination || "").trim().toUpperCase(),
        departure_date: (body.departure_date || "").trim(),
      },
    ]
  } else {
    return NextResponse.json(
      { ok: false, error: "Provide either slices[] or origin, destination, and departure_date." },
      { status: 400 }
    )
  }

  for (const s of slices) {
    if (!s.origin || s.origin.length !== 3) {
      return NextResponse.json(
        { ok: false, error: "Each slice needs a 3-letter IATA origin." },
        { status: 400 }
      )
    }
    if (!s.destination || s.destination.length !== 3) {
      return NextResponse.json(
        { ok: false, error: "Each slice needs a 3-letter IATA destination." },
        { status: 400 }
      )
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.departure_date)) {
      return NextResponse.json(
        { ok: false, error: "Each slice needs departure_date YYYY-MM-DD." },
        { status: 400 }
      )
    }
  }

  const oneWay = slices.length === 1 && !body.return_date
  const departureId = slices[0].origin
  const arrivalId = slices[0].destination
  const outboundDate = slices[0].departure_date
  const returnDate = body.return_date?.trim()

  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: apiKey,
    hl: "en",
    departure_id: departureId,
    arrival_id: arrivalId,
    outbound_date: outboundDate,
    adults: String(adults),
    currency: "USD",
    type: oneWay ? "2" : "1",
  })
  if (!oneWay && returnDate && /^\d{4}-\d{2}-\d{2}$/.test(returnDate)) {
    params.set("return_date", returnDate)
  }

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
    const currency = "USD"

    const normalized: FlightOffer[] = all.map((offer, i) =>
      serpOfferToFlightOffer(offer, i, {
        departureId,
        arrivalId,
        outboundDate,
        returnDate,
        oneWay,
        currency,
      })
    )

    return NextResponse.json({ ok: true, offers: normalized })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "SerpAPI flight search failed",
      },
      { status: 500 }
    )
  }
}
