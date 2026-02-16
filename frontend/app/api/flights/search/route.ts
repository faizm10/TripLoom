import { NextResponse } from "next/server"

import type { FlightOffer } from "@/lib/flights"

const DUFFEL_BASE = "https://api.duffel.com"
const DUFFEL_VERSION = "v2"

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
            name: first.origin.name ?? "",
            iataCode: first.origin.iata_code ?? "",
            cityName: (first.origin as { city_name?: string }).city_name,
          }
        : { name: "", iataCode: "", cityName: undefined },
      destination: last?.destination
        ? {
            name: last.destination.name ?? "",
            iataCode: last.destination.iata_code ?? "",
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
type RawSlice = {
  segments?: RawSegment[]
  duration?: string
}
type RawOffer = {
  id: string
  total_amount?: string
  total_currency?: string
  owner?: { name?: string; iata_code?: string }
  slices?: RawSlice[]
  expires_at?: string
}

export async function POST(request: Request) {
  const token = getDuffelToken()
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Flight search unavailable. Set DUFFEL_API_KEY or DUFFEL in env." },
      { status: 503 }
    )
  }

  type SliceInput = { origin: string; destination: string; departure_date: string }
  let body: {
    slices?: SliceInput[]
    origin?: string
    destination?: string
    departure_date?: string
    adults?: number
    cabin_class?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    )
  }

  const adults = Math.min(10, Math.max(1, Number(body.adults) || 1))
  const cabin_class =
    body.cabin_class && ["economy", "premium_economy", "business", "first"].includes(body.cabin_class)
      ? body.cabin_class
      : "economy"

  let slices: SliceInput[]
  if (Array.isArray(body.slices) && body.slices.length > 0 && body.slices.length <= 6) {
    slices = body.slices.map((s) => ({
      origin: (s.origin || "").trim().toUpperCase(),
      destination: (s.destination || "").trim().toUpperCase(),
      departure_date: (s.departure_date || "").trim(),
    }))
  } else if (
    body.origin &&
    body.destination &&
    body.departure_date
  ) {
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

  const passengers = Array.from({ length: adults }, () => ({ type: "adult" as const }))

  try {
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
          slices: slices.map((s) => ({
            origin: s.origin,
            destination: s.destination,
            departure_date: s.departure_date,
          })),
          passengers,
          cabin_class,
          max_connections: 2,
        },
      }),
      cache: "no-store",
    })

    const data = (await res.json().catch(() => null)) as
      | { data?: { offers?: RawOffer[] }; error?: { message?: string } }
      | null

    if (!res.ok) {
      const msg =
        data && data.error?.message
          ? data.error.message
          : `Duffel API error: ${res.status}`
      return NextResponse.json({ ok: false, error: msg }, { status: res.status >= 500 ? 502 : 400 })
    }

    const offers = (data?.data as { offers?: RawOffer[] })?.offers ?? []
    const normalized = offers.map(normalizeOffer)

    return NextResponse.json({ ok: true, offers: normalized })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Flight search failed",
      },
      { status: 500 }
    )
  }
}
