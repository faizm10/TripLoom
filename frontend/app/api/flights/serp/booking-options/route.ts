import { NextResponse } from "next/server"

const SERPAPI_BASE = "https://serpapi.com/search"

function getSerpApiKey(): string | undefined {
  return process.env.SERPAPI_API_KEY || process.env.SERP_API_KEY
}

type BookingRequest = {
  url?: string
  post_data?: string
}

type BookingOption = {
  booking_request?: BookingRequest
  /** SerpAPI nests booking_request inside "together" for round-trip options */
  together?: { booking_request?: BookingRequest }
}

type SerpBookingResponse = {
  booking_options?: BookingOption[]
  error?: string
  search_metadata?: { status?: string }
}

function getBookingRequest(opt: BookingOption): BookingRequest | undefined {
  return opt.together?.booking_request ?? opt.booking_request
}

/**
 * Resolve a SerpAPI booking_token to a direct booking URL + POST data
 * so the user can be sent to Google Flights with the flight pre-selected.
 */
export async function POST(request: Request) {
  const apiKey = getSerpApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "SerpAPI unavailable. Set SERPAPI_API_KEY in env." },
      { status: 503 }
    )
  }

  let body: { booking_token?: string; departure_token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 })
  }

  const bookingToken = (body.booking_token ?? "").trim()
  const departureToken = (body.departure_token ?? "").trim()
  if (!bookingToken && !departureToken) {
    return NextResponse.json(
      { ok: false, error: "Missing booking_token or departure_token." },
      { status: 400 }
    )
  }
  const tokenParam = bookingToken ? "booking_token" : "departure_token"
  const tokenValue = bookingToken || departureToken

  const params = new URLSearchParams({
    engine: "google_flights",
    api_key: apiKey,
    hl: "en",
    currency: "USD",
    [tokenParam]: tokenValue,
  })

  try {
    const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`, { cache: "no-store" })
    const data = (await res.json().catch(() => null)) as SerpBookingResponse | null

    if (!res.ok) {
      const msg = data?.error ?? `SerpAPI error: ${res.status}`
      return NextResponse.json({ ok: false, error: msg }, { status: res.status >= 500 ? 502 : 400 })
    }

    if (data?.search_metadata?.status === "Error" && data?.error) {
      return NextResponse.json({ ok: false, error: data.error }, { status: 400 })
    }

    const options = data?.booking_options ?? []
    let req: BookingRequest | undefined
    for (const opt of options) {
      req = getBookingRequest(opt)
      if (req?.url) break
    }
    if (!req?.url) {
      return NextResponse.json(
        { ok: false, error: "No booking option available for this flight." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      url: req.url,
      post_data: req.post_data ?? null,
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to get booking options",
      },
      { status: 500 }
    )
  }
}
