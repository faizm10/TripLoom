import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminEmail } from "@/lib/admin"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const admin = createAdminClient()

  const [
    tripsRes,
    usersRes,
    flightsRes,
    hotelsRes,
    itineraryRes,
    packingRes,
    recentTripsRes,
    recentUsersRes,
    auditRes,
  ] = await Promise.all([
    admin.from("trips").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("user_id", { count: "exact", head: true }),
    admin.from("trip_flights").select("id", { count: "exact", head: true }),
    admin.from("trip_hotel_stays").select("id", { count: "exact", head: true }),
    admin.from("itinerary_items").select("id", { count: "exact", head: true }),
    admin.from("trip_packing_items").select("id", { count: "exact", head: true }),
    admin
      .from("trips")
      .select("id, destination, start_date, end_date, total_days, travelers, travel_scope, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("profiles")
      .select("user_id, country_code, updated_at")
      .order("updated_at", { ascending: false })
      .limit(20),
    admin
      .from("ai_audit_logs")
      .select("id, user_id, trip_id, action, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  // Fetch auth user details (name, email, provider) via Supabase Auth Admin API
  const profileUserIds = (recentUsersRes.data ?? []).map((p: Record<string, unknown>) => String(p.user_id))
  const authUsersMap = new Map<string, { email: string; name: string; provider: string; createdAt: string }>()

  if (profileUserIds.length > 0) {
    const { data: authList } = await admin.auth.admin.listUsers({ perPage: 100 })
    for (const u of authList?.users ?? []) {
      const provider = u.app_metadata?.provider ?? u.app_metadata?.providers?.[0] ?? "email"
      const name =
        u.user_metadata?.full_name ??
        u.user_metadata?.name ??
        u.user_metadata?.display_name ??
        ""
      authUsersMap.set(u.id, {
        email: u.email ?? "",
        name: String(name),
        provider: String(provider),
        createdAt: u.created_at ?? "",
      })
    }
  }

  const enrichedUsers = (recentUsersRes.data ?? []).map((p: Record<string, unknown>) => {
    const uid = String(p.user_id)
    const auth = authUsersMap.get(uid)
    return {
      user_id: uid,
      country_code: String(p.country_code ?? ""),
      updated_at: String(p.updated_at ?? ""),
      email: auth?.email ?? "",
      name: auth?.name ?? "",
      provider: auth?.provider ?? "unknown",
      created_at: auth?.createdAt ?? "",
    }
  })

  return NextResponse.json({
    counts: {
      trips: tripsRes.count ?? 0,
      users: usersRes.count ?? 0,
      flights: flightsRes.count ?? 0,
      hotels: hotelsRes.count ?? 0,
      itineraryItems: itineraryRes.count ?? 0,
      packingItems: packingRes.count ?? 0,
    },
    recentTrips: recentTripsRes.data ?? [],
    recentUsers: enrichedUsers,
    auditLogs: auditRes.data ?? [],
  })
}
