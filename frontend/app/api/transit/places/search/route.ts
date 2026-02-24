import { NextResponse } from "next/server"

export type TransitPlaceSuggestion = {
  id: string
  name: string
  displayName: string
  placeId: string
  mainText: string
  secondaryText: string | null
  types: string[]
}

type GoogleAutocompletePrediction = {
  description?: string
  place_id?: string
  types?: string[]
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

type GoogleAutocompleteResponse = {
  status?: string
  error_message?: string
  predictions?: GoogleAutocompletePrediction[]
}

function normalizePrediction(
  prediction: GoogleAutocompletePrediction
): TransitPlaceSuggestion | null {
  const placeId = prediction.place_id ?? ""
  const description = prediction.description ?? ""
  if (!placeId || !description) return null

  const mainText = prediction.structured_formatting?.main_text ?? description
  const secondaryText = prediction.structured_formatting?.secondary_text ?? null

  return {
    id: placeId,
    name: mainText,
    displayName: description,
    placeId,
    mainText,
    secondaryText,
    types: prediction.types ?? [],
  }
}

export async function GET(request: Request) {
  const key =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY
  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Transit place search requires GOOGLE_MAPS_API_KEY (or NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY).",
      },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json(
      { ok: true, data: [] as TransitPlaceSuggestion[] },
      { status: 200 }
    )
  }

  try {
    const params = new URLSearchParams({
      input: q,
      key,
      types: "geocode",
      language: "en",
    })

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    )

    const payload = (await res.json().catch(() => null)) as
      | GoogleAutocompleteResponse
      | null

    if (!res.ok || !payload) {
      return NextResponse.json(
        { ok: false, error: `Transit place search failed (${res.status}).` },
        { status: 502 }
      )
    }

    if (
      payload.status &&
      payload.status !== "OK" &&
      payload.status !== "ZERO_RESULTS"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: payload.error_message || `Places API status: ${payload.status}`,
        },
        { status: 502 }
      )
    }

    const data = (payload.predictions ?? [])
      .map((prediction) => normalizePrediction(prediction))
      .filter((item): item is TransitPlaceSuggestion => Boolean(item))
      .filter((item) => !item.types.includes("airport"))
      .slice(0, 8)

    return NextResponse.json({ ok: true, data }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Transit place search failed.",
      },
      { status: 500 }
    )
  }
}
