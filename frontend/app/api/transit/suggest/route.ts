import { NextResponse } from "next/server"

type SuggestBody = {
  origin?: string
  destination?: string
  departure_time?: string
  arrival_time?: string
  day_index?: number
}

type GoogleDirectionsResponse = {
  status?: string
  error_message?: string
  routes?: Array<{
    summary?: string
    overview_polyline?: { points?: string }
    legs?: Array<{
      duration?: { value?: number }
      fare?: { value?: number; currency?: string }
      departure_time?: { value?: number; text?: string; time_zone?: string }
      arrival_time?: { value?: number; text?: string; time_zone?: string }
      steps?: Array<{
        travel_mode?: string
        duration?: { value?: number }
        transit_details?: {
          line?: {
            short_name?: string
            name?: string
            vehicle?: { type?: string }
          }
        }
      }>
    }>
  }>
}

type TransitMode =
  | "subway"
  | "bus"
  | "tram"
  | "rail"
  | "ferry"
  | "walk_mix"
  | "other"

type NormalizedOption = {
  summaryLabel: string
  durationMinutes: number
  estimatedCost: number | null
  currency: string
  transfers: number
  walkingMinutes: number
  departureTimeLocal?: string
  arrivalTimeLocal?: string
  providerRouteRef?: string
  mode: TransitMode
}

function toIsoLocal(value?: number): string | undefined {
  if (!value) return undefined
  return new Date(value * 1000).toISOString().slice(0, 16)
}

function vehicleToMode(vehicleType?: string): TransitMode {
  const type = (vehicleType ?? "").toUpperCase()
  if (type === "SUBWAY") return "subway"
  if (type === "BUS") return "bus"
  if (type === "TRAM" || type === "LIGHT_RAIL") return "tram"
  if (
    type === "RAIL" ||
    type === "HEAVY_RAIL" ||
    type === "COMMUTER_TRAIN" ||
    type === "HIGH_SPEED_TRAIN" ||
    type === "LONG_DISTANCE_TRAIN"
  ) {
    return "rail"
  }
  if (type === "FERRY") return "ferry"
  return "other"
}

function normalizeRoutes(
  origin: string,
  destination: string,
  payload: GoogleDirectionsResponse
): NormalizedOption[] {
  const routes = payload.routes ?? []

  const normalized: NormalizedOption[] = []

  for (const [index, route] of routes.entries()) {
      const leg = route.legs?.[0]
      if (!leg) continue

      const durationSeconds = leg.duration?.value ?? 0
      const steps = leg.steps ?? []
      const transitSteps = steps.filter((step) => step.travel_mode === "TRANSIT")
      const walkingMinutes = Math.round(
        steps
          .filter((step) => step.travel_mode === "WALKING")
          .reduce((total, step) => total + (step.duration?.value ?? 0), 0) / 60
      )

      const primaryMode = vehicleToMode(
        transitSteps[0]?.transit_details?.line?.vehicle?.type
      )

      const mode: TransitMode =
        walkingMinutes > 0 && transitSteps.length > 0 ? "walk_mix" : primaryMode

      const summaryFromLines = transitSteps
        .map(
          (step) =>
            step.transit_details?.line?.short_name ||
            step.transit_details?.line?.name ||
            "Transit"
        )
        .join(" + ")

      normalized.push({
        summaryLabel:
          route.summary || summaryFromLines || `${origin} to ${destination}`,
        durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
        estimatedCost:
          typeof leg.fare?.value === "number" ? Number(leg.fare.value) : null,
        currency: leg.fare?.currency || "USD",
        transfers: Math.max(0, transitSteps.length - 1),
        walkingMinutes,
        departureTimeLocal: toIsoLocal(leg.departure_time?.value),
        arrivalTimeLocal: toIsoLocal(leg.arrival_time?.value),
        providerRouteRef: route.overview_polyline?.points || `route-${index + 1}`,
        mode,
      })
  }

  return normalized.sort((a, b) => a.durationMinutes - b.durationMinutes).slice(0, 3)
}

export async function POST(request: Request) {
  const key =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY
  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing GOOGLE_MAPS_API_KEY (or NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY) on server. Transit suggestions unavailable.",
      },
      { status: 503 }
    )
  }

  const body = (await request.json().catch(() => null)) as SuggestBody | null
  const origin = body?.origin?.trim() ?? ""
  const destination = body?.destination?.trim() ?? ""

  if (!origin || !destination) {
    return NextResponse.json(
      { ok: false, error: "origin and destination are required" },
      { status: 400 }
    )
  }

  if (body?.departure_time && body?.arrival_time) {
    return NextResponse.json(
      {
        ok: false,
        error: "Use either departure_time or arrival_time, not both.",
      },
      { status: 400 }
    )
  }

  const params = new URLSearchParams({
    origin,
    destination,
    mode: "transit",
    alternatives: "true",
    key,
  })

  if (body?.departure_time) {
    const parsed = new Date(body.departure_time)
    if (!Number.isNaN(parsed.getTime())) {
      params.set("departure_time", String(Math.floor(parsed.getTime() / 1000)))
    }
  }

  if (body?.arrival_time) {
    const parsed = new Date(body.arrival_time)
    if (!Number.isNaN(parsed.getTime())) {
      params.set("arrival_time", String(Math.floor(parsed.getTime() / 1000)))
    }
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    )

    const payload = (await response.json().catch(() => null)) as
      | GoogleDirectionsResponse
      | null

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Transit provider error: ${response.status}`,
        },
        { status: 502 }
      )
    }

    if (!payload || payload.status === "REQUEST_DENIED") {
      return NextResponse.json(
        {
          ok: false,
          error: payload?.error_message || "Transit provider denied the request.",
        },
        { status: 502 }
      )
    }

    if (payload.status === "ZERO_RESULTS") {
      return NextResponse.json({ ok: true, data: [] }, { status: 200 })
    }

    if (payload.status !== "OK") {
      return NextResponse.json(
        {
          ok: false,
          error:
            payload.error_message ||
            `Transit provider returned status ${payload.status || "UNKNOWN"}`,
        },
        { status: 502 }
      )
    }

    const data = normalizeRoutes(origin, destination, payload)
    return NextResponse.json({ ok: true, data }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Transit suggestions failed. Use manual entry.",
      },
      { status: 500 }
    )
  }
}
