import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

function redirectSameHost(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ""
  return NextResponse.redirect(url)
}

function redirectLoginFailed(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = "/auth/login"
  url.search = ""
  url.searchParams.set("error", "auth_callback_failed")
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const nextRaw = searchParams.get("next") ?? "/dashboard"
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/dashboard"

  if (code) {
    const supabaseResponse = redirectSameHost(request, next)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return supabaseResponse
  }

  return redirectLoginFailed(request)
}
