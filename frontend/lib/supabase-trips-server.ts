import { createClient } from "@/lib/supabase/server"
import type { TripRow } from "@/lib/supabase-trip-row"
import { tripFromRow } from "@/lib/supabase-trip-row"
import type { Trip } from "@/lib/trips"

export async function getTripByIdFromSupabase(tripId: string): Promise<Trip | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return null

  const { data, error } = await supabase
    .from("trips")
    .select(
      "id, destination, start_date, end_date, timezone, travelers, is_group_trip, total_days, created_at, updated_at"
    )
    .eq("id", tripId)
    .single()

  if (error || !data) return null
  return tripFromRow(data as TripRow)
}
