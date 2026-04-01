import { NextResponse } from "next/server"

import { getPublicTripSharePayload } from "@/lib/public-trip-share"

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params
    const payload = await getPublicTripSharePayload(decodeURIComponent(token))
    if (!payload) {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "server_error"
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json({ error: "share_unconfigured" }, { status: 503 })
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
