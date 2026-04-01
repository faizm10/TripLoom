import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

type RpcResult = {
  ok?: boolean
  error?: string
  trip_id?: string
  already_member?: boolean
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { token } = await context.params
  const raw = decodeURIComponent(token).trim()
  if (!raw) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 })
  }

  const { data, error } = await supabase.rpc("accept_collaborator_invite", {
    p_token: raw,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  let result: RpcResult | null = null
  if (typeof data === "string") {
    try {
      result = JSON.parse(data) as RpcResult
    } catch {
      return NextResponse.json({ error: "invalid_rpc_response" }, { status: 500 })
    }
  } else {
    result = data as RpcResult | null
  }
  if (!result?.ok) {
    const code = result?.error ?? "invite_failed"
    const status =
      code === "not_authenticated" ? 401 : code === "invalid_or_expired" ? 404 : 400
    return NextResponse.json({ error: code }, { status })
  }

  return NextResponse.json({
    tripId: result.trip_id,
    alreadyMember: Boolean(result.already_member),
  })
}
