import { NextResponse } from "next/server"

const SERPAPI_BASE = "https://serpapi.com/search"

function getSerpApiKey(): string | undefined {
  return process.env.SERPAPI_API_KEY || process.env.SERPAPI_KEY
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

type SerpApiAirport = {
  name: string
  id: string
  city: string
  city_id?: string
  distance?: string
}

type SerpApiSuggestion = {
  position?: number
  name: string
  type: "city" | "region"
  description?: string
  id: string
  airports?: SerpApiAirport[]
}

function suggestionToDestinations(s: SerpApiSuggestion): DestinationSuggestion[] {
  const out: DestinationSuggestion[] = []
  const cityName = s.name
  const displayName = s.description ? `${s.name} - ${s.description}` : s.name

  out.push({
    id: s.id,
    name: cityName,
    displayName,
    type: "city",
    iataCode: null,
    cityName,
    countryCode: null,
  })

  if (Array.isArray(s.airports)) {
    for (const ap of s.airports) {
      out.push({
        id: ap.id,
        name: ap.name,
        displayName: `${ap.name} (${ap.id}), ${ap.city}`,
        type: "airport",
        iataCode: ap.id,
        cityName: ap.city,
        countryCode: null,
      })
    }
  }

  return out
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

  const apiKey = getSerpApiKey()
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Destination search requires SerpAPI key. Set SERPAPI_API_KEY or SERPAPI_KEY in env.",
      },
      { status: 503 }
    )
  }

  try {
    const params = new URLSearchParams({
      engine: "google_flights_autocomplete",
      q,
      api_key: apiKey,
      gl: "us",
      hl: "en",
      exclude_regions: "true",
    })
    const res = await fetch(`${SERPAPI_BASE}?${params}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })

    const body = (await res.json().catch(() => null)) as
      | { suggestions?: SerpApiSuggestion[] }
      | { error?: string }
      | null

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            body && typeof body === "object" && "error" in body
              ? (body as { error?: string }).error
              : `SerpAPI error: ${res.status}`,
        },
        { status: res.status >= 500 ? 502 : 400 }
      )
    }

    const raw = body && "suggestions" in body ? body.suggestions ?? [] : []
    const data = raw
      .filter((s) => s && s.name && s.id)
      .flatMap((s) => suggestionToDestinations(s as SerpApiSuggestion))
      .slice(0, 20)

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
