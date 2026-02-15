import { NextResponse } from "next/server"

import type { FlightOffer } from "@/lib/flights"

const DUFFEL_BASE = "https://api.duffel.com"
const DUFFEL_VERSION = "v2"
const MAX_DATES = 14
const DEFAULT_DATES = 7

function getDuffelToken(): string | undefined {
  return process.env.DUFFEL_API_KEY || process.env.DUFFEL
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return iso
  const h = parseInt(match[1] || "0", 10)
  const m = parseInt(match[2] || "0", 10)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

type RawOffer = {
  id: string
  total_amount?: string
  total_currency?: string
  owner?: { name?: string; iata_code?: string }
  slices?: RawSlice[]
  expires_at?: string
}
type RawSlice = {
  segments?: RawSegment[]
  duration?: string
}
type RawSegment = {
  operating_carrier?: { name?: string; iata_code?: string }
  marketing_carrier?: { name?: string; iata_code?: string }
  operating_carrier_flight_number?: string
  marketing_carrier_flight_number?: string
  departing_at?: string
  arriving_at?: string
  origin?: { name?: string; iata_code?: string }
  destination?: { name?: string; iata_code?: string }
  duration?: string
}

function normalizeOffer(offer: RawOffer): FlightOffer {
  const owner = offer.owner
  const slices = (offer.slices || []).map((sl: RawSlice) => {
    const segs = sl.segments || []
    const first = segs[0]
    const last = segs[segs.length - 1]
    const totalDuration = sl.duration ? parseDuration(sl.duration) : ""
    return {
      origin: first?.origin
        ? {
            name: first.origin.name,
            iataCode: first.origin.iata_code,
            cityName: (first.origin as { city_name?: string }).city_name,
          }
        : { name: "", iataCode: "", cityName: undefined },
      destination: last?.destination
        ? {
            name: last.destination.name,
            iataCode: last.destination.iata_code,
            cityName: (last.destination as { city_name?: string }).city_name,
          }
        : { name: "", iataCode: "", cityName: undefined },
      duration: totalDuration,
      segments: segs.map((s: RawSegment) => ({
        operatingCarrier: {
          name: s.operating_carrier?.name ?? "",
          iataCode: s.operating_carrier?.iata_code ?? "",
        },
        marketingCarrier: {
          name: s.marketing_carrier?.name ?? "",
          iataCode: s.marketing_carrier?.iata_code ?? "",
        },
        flightNumber:
          s.operating_carrier_flight_number || s.marketing_carrier_flight_number || "",
        departingAt: s.departing_at ?? "",
        arrivingAt: s.arriving_at ?? "",
        origin: {
          name: s.origin?.name ?? "",
          iataCode: s.origin?.iata_code ?? "",
        },
        destination: {
          name: s.destination?.name ?? "",
          iataCode: s.destination?.iata_code ?? "",
        },
        duration: s.duration ? parseDuration(s.duration) : "",
      })),
    }
  })
  return {
    id: offer.id,
    totalAmount: offer.total_amount ?? "",
    totalCurrency: offer.total_currency ?? "",
    owner: {
      name: owner?.name ?? "",
      iataCode: owner?.iata_code ?? "",
    },
    slices,
    expiresAt: offer.expires_at ?? "",
  }
}

async function searchOneDate(
  token: string,
  origin: string,
  destination: string,
  date: string,
  adults: number
): Promise<FlightOffer[]> {
  const res = await fetch(`${DUFFEL_BASE}/air/offer_requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Duffel-Version": DUFFEL_VERSION,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        slices: [{ origin, destination, departure_date: date }],
        passengers: Array.from({ length: adults }, () => ({ type: "adult" as const })),
        cabin_class: "economy",
        max_connections: 2,
      },
    }),
    cache: "no-store",
  })
  const data = (await res.json().catch(() => null)) as { data?: { offers?: RawOffer[] } } | null
  const offers = (data?.data as { offers?: RawOffer[] })?.offers ?? []
  return offers.map(normalizeOffer)
}

export async function POST(request: Request) {
  const token = getDuffelToken()
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Flight explore unavailable. Set DUFFEL_API_KEY or DUFFEL in env." },
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
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    )
  }

  const origin = (body.origin || "").trim().toUpperCase()
  const destInput = (body.destination || "").trim().toUpperCase()
  const destinations =
    destInput && destInput.length === 3
      ? [destInput]
      : DEFAULT_DESTINATIONS
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
    return NextResponse.json(
      { ok: false, error: "No dates to search." },
      { status: 400 }
    )
  }

  try {
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
        const offers = await searchOneDate(token, origin, dest, date, adults)
        if (offers.length > 0) {
          const sorted = [...offers].sort(
            (a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount)
          )
          const cheapest = sorted[0]
          const destName =
            cheapest.slices[0]?.destination?.name ||
            cheapest.slices[0]?.destination?.iataCode ||
            dest
          rows.push({
            date,
            destination: dest,
            destinationName: destName,
            offer: cheapest,
          })
          const amount = parseFloat(cheapest.totalAmount)
          if (amount < overallMin) {
            overallMin = amount
            overallCheapest = cheapest
          }
        }
      }
    }

    rows.sort(
      (a, b) =>
        parseFloat(a.offer.totalAmount) - parseFloat(b.offer.totalAmount)
    )

    return NextResponse.json({
      ok: true,
      origin,
      rows,
      overallCheapest: overallCheapest ?? null,
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Explore search failed",
      },
      { status: 500 }
    )
  }
}
