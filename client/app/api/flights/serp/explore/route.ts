import { NextResponse } from "next/server"

import type { FlightOffer } from "@/lib/flights"

const SERPAPI_BASE = "https://serpapi.com/search"
const MAX_DATES = 14
const DEFAULT_DATES = 7

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
}

function serpOfferToFlightOffer(
  serp: SerpOffer,
  index: number,
  params: {
    departureId: string
    arrivalId: string
    outboundDate: string
    currency: string
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
  const id = `serp-exp-${index}-${serp.departure_token ?? index}`

  const u = new URL("https://www.google.com/travel/flights")
  u.searchParams.set("hl", "en")
  u.searchParams.set("departure_id", params.departureId)
  u.searchParams.set("arrival_id", params.arrivalId)
  u.searchParams.set("outbound_date", params.outboundDate)
  u.searchParams.set("type", "2")

  return {
    id,
    totalAmount: String(serp.price ?? 0),
    totalCurrency: params.currency,
    owner: { name: airlineName, iataCode: "" },
    bookUrl: u.toString(),
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

export async function POST(request: Request) {
  const apiKey = getSerpApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "SerpAPI explore unavailable. Set SERPAPI_API_KEY in env." },
      { status: 503 }
    )
  }

  const DEFAULT_DESTINATIONS = ["JFK", "LHR", "CDG", "YYZ", "LAX"]

  let body: {
    origin: string
    destination?: string
    date_from?: string
    date_to?: string
    num_days?: number
    adults?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 })
  }

  const origin = (body.origin || "").trim().toUpperCase()
  const destInput = (body.destination || "").trim().toUpperCase()
  const destinations =
    destInput && destInput.length === 3 ? [destInput] : DEFAULT_DESTINATIONS
  const adults = Math.min(10, Math.max(1, Number(body.adults) || 1))

  if (!origin || origin.length !== 3) {
    return NextResponse.json(
      { ok: false, error: "Origin must be a 3-letter IATA code." },
      { status: 400 }
    )
  }

  let dates: string[]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (body.date_from && body.date_to) {
    const from = new Date(body.date_from)
    const to = new Date(body.date_to)
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      return NextResponse.json(
        { ok: false, error: "date_from and date_to must be valid and date_from <= date_to." },
        { status: 400 }
      )
    }
    dates = []
    const d = new Date(from)
    while (d <= to && dates.length < MAX_DATES) {
      dates.push(d.toISOString().slice(0, 10))
      d.setDate(d.getDate() + 1)
    }
  } else {
    const numDays = Math.min(MAX_DATES, Math.max(1, Number(body.num_days) || DEFAULT_DATES))
    dates = []
    const d = new Date(today)
    for (let i = 0; i < numDays; i++) {
      dates.push(d.toISOString().slice(0, 10))
      d.setDate(d.getDate() + 1)
    }
  }

  if (dates.length === 0) {
    return NextResponse.json({ ok: false, error: "No dates to search." }, { status: 400 })
  }

  type Row = {
    date: string
    destination: string
    destinationName: string
    offer: FlightOffer
  }
  const rows: Row[] = []
  let overallCheapest: FlightOffer | null = null
  let overallMin = Infinity

  for (const dest of destinations) {
    for (const date of dates) {
      const params = new URLSearchParams({
        engine: "google_flights",
        api_key: apiKey,
        departure_id: origin,
        arrival_id: dest,
        outbound_date: date,
        adults: String(adults),
        currency: "USD",
        type: "2",
      })
      try {
        const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, { cache: "no-store" })
        const data = (await res.json().catch(() => null)) as {
          best_flights?: SerpOffer[]
          other_flights?: SerpOffer[]
          search_metadata?: { status?: string }
          error?: string
        } | null

        if (!res.ok || data?.search_metadata?.status === "Error") continue

        const best = data?.best_flights ?? []
        const other = data?.other_flights ?? []
        const first = best[0] ?? other[0]
        if (!first) continue

        const offer = serpOfferToFlightOffer(first, rows.length, {
          departureId: origin,
          arrivalId: dest,
          outboundDate: date,
          currency: "USD",
        })
        const destName =
          offer.slices[0]?.destination?.name ||
          offer.slices[0]?.destination?.iataCode ||
          dest
        rows.push({
          date,
          destination: dest,
          destinationName: destName,
          offer,
        })
        const amount = parseFloat(offer.totalAmount)
        if (amount < overallMin) {
          overallMin = amount
          overallCheapest = offer
        }
      } catch {
        // skip this date/dest
      }
    }
  }

  rows.sort((a, b) => parseFloat(a.offer.totalAmount) - parseFloat(b.offer.totalAmount))

  return NextResponse.json({
    ok: true,
    origin,
    rows,
    overallCheapest: overallCheapest ?? null,
  })
}
