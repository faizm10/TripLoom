import { NextResponse } from "next/server"

const DUFFEL_BASE = "https://api.duffel.com"
const DUFFEL_VERSION = "v2"

function getDuffelToken(): string | undefined {
  return process.env.DUFFEL_API_KEY || process.env.DUFFEL
}

export type DestinationSuggestion = {
  id: string
  name: string
  displayName: string
  type: "city" | "airport"
  iataCode: string | null
  cityName: string | null
  countryCode: string | null
}

type DuffelPlace = {
  id: string
  type: "airport" | "city"
  name: string
  iata_code: string
  iata_country_code?: string
  city_name?: string
  city?: { name: string; iata_code: string }
}

function normalizePlace(p: DuffelPlace): DestinationSuggestion {
  const isCity = p.type === "city"
  const name = isCity ? (p.name ?? p.city?.name ?? "") : p.name
  const cityName = p.city_name ?? p.city?.name ?? null
  const displayName =
    cityName && !isCity
      ? `${p.name} (${p.iata_code}), ${cityName}`
      : `${name} (${p.iata_code})`
  return {
    id: p.id,
    name,
    displayName,
    type: p.type,
    iataCode: p.iata_code ?? null,
    cityName: cityName ?? null,
    countryCode: p.iata_country_code ?? null,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json(
      { ok: true, data: [] as DestinationSuggestion[] },
      { status: 200 }
    )
  }

  const token = getDuffelToken()
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Destination search requires Duffel API key. Set DUFFEL_API_KEY or DUFFEL in env.",
      },
      { status: 503 }
    )
  }

  try {
    const res = await fetch(
      `${DUFFEL_BASE}/places/suggestions?${new URLSearchParams({ query: q })}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Duffel-Version": DUFFEL_VERSION,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    )

    const body = (await res.json().catch(() => null)) as
      | { data?: DuffelPlace[] }
      | { error?: { message?: string } }
      | null

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            body && typeof body === "object" && "error" in body
              ? (body.error as { message?: string }).message
              : `Duffel API error: ${res.status}`,
        },
        { status: res.status >= 500 ? 502 : 400 }
      )
    }

    const raw = body && "data" in body ? body.data ?? [] : []
    const data = raw.map((p) => normalizePlace(p))

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Destination search failed",
      },
      { status: 500 }
    )
  }
}
