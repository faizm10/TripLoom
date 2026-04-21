import { createClient } from "@/lib/supabase/client"
import type { TripRow } from "@/lib/supabase-trip-row"
import { tripFromRow } from "@/lib/supabase-trip-row"
import type { Trip } from "@/lib/trips"

export type CreateTripPayload = {
  id: string
  destination: string
  startDate: string
  endDate: string
  timezone?: string
  travelers: number
  isGroupTrip: boolean
  totalDays: number
  travelScope: "domestic" | "international"
}

/**
 * Load trips for the current user from Supabase. Returns [] if not signed in or on error.
 */
export async function getTripsFromSupabase(): Promise<Trip[]> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data: rows, error } = await supabase
    .from("trips")
    .select(
      "id, destination, start_date, end_date, timezone, travelers, is_group_trip, total_days, travel_scope, created_at, updated_at"
    )
    .order("updated_at", { ascending: false })
  if (error) return []
  if (!rows?.length) return []
  return (rows as TripRow[]).map(tripFromRow)
}

/**
 * Create a trip in Supabase (trips + trip_members) from the frontend.
 * Requires the user to be signed in.
 */
export async function createTripInSupabase(payload: CreateTripPayload): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!user) throw new Error("You must be signed in to save trips to the cloud.")

  const { error: tripError } = await supabase.from("trips").insert({
    id: payload.id,
    destination: payload.destination,
    start_date: payload.startDate,
    end_date: payload.endDate,
    timezone: payload.timezone ?? "UTC",
    travelers: payload.travelers,
    is_group_trip: payload.isGroupTrip,
    total_days: payload.totalDays,
    travel_scope: payload.travelScope,
  })
  if (tripError) throw new Error(tripError.message)

  const { error: memberError } = await supabase.from("trip_members").insert({
    trip_id: payload.id,
    user_id: user.id,
    role: "owner",
  })
  if (memberError) throw new Error(memberError.message)
}

export type UpdateTripPayload = {
  destination?: string
  startDate?: string
  endDate?: string
  timezone?: string
  travelers?: number
  isGroupTrip?: boolean
  totalDays?: number
  travelScope?: "domestic" | "international"
}

/**
 * Map a Partial<Trip> (e.g. Overview "save") to DB columns. Used when the trip
 * is not yet in TripsProvider state but must still persist to Supabase.
 */
export function tripOverviewPatchToPayload(partial: Partial<Trip>): UpdateTripPayload {
  const payload: UpdateTripPayload = {}
  if ("destination" in partial && partial.destination !== undefined) {
    payload.destination = partial.destination
  }
  if ("startDate" in partial && partial.startDate !== undefined) {
    payload.startDate = partial.startDate
  }
  if ("endDate" in partial && partial.endDate !== undefined) {
    payload.endDate = partial.endDate
  }
  if ("timezone" in partial && partial.timezone !== undefined) {
    payload.timezone = partial.timezone
  }
  if ("travelers" in partial && partial.travelers !== undefined) {
    payload.travelers = partial.travelers
  }
  if ("isGroupTrip" in partial && partial.isGroupTrip !== undefined) {
    payload.isGroupTrip = partial.isGroupTrip
  }
  if ("totalDays" in partial && partial.totalDays !== undefined) {
    payload.totalDays = partial.totalDays
  }
  if ("travelScope" in partial && partial.travelScope !== undefined) {
    payload.travelScope = partial.travelScope
  }
  return payload
}

/**
 * Update a trip in Supabase. Only Overview fields are persisted.
 */
export async function updateTripInSupabase(tripId: string, payload: UpdateTripPayload): Promise<void> {
  const supabase = createClient()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (payload.destination != null) updates.destination = payload.destination
  if (payload.startDate != null) updates.start_date = payload.startDate
  if (payload.endDate != null) updates.end_date = payload.endDate
  if (payload.timezone != null) updates.timezone = payload.timezone
  if (payload.travelers != null) updates.travelers = payload.travelers
  if (payload.isGroupTrip != null) updates.is_group_trip = payload.isGroupTrip
  if (payload.totalDays != null) updates.total_days = payload.totalDays
  if (payload.travelScope != null) updates.travel_scope = payload.travelScope
  if (Object.keys(updates).length <= 1) return

  const { error } = await supabase.from("trips").update(updates).eq("id", tripId)
  if (error) throw new Error(error.message)
}

/**
 * Delete a trip in Supabase. Cascade will remove trip_members and related rows.
 */
export async function deleteTripInSupabase(tripId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("trips").delete().eq("id", tripId)
  if (error) throw new Error(error.message)
}
