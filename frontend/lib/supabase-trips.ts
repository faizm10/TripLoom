import { createClient } from "@/lib/supabase/client"
import type { Trip } from "@/lib/trips"

export type CreateTripPayload = {
  id: string
  destination: string
  startDate: string
  endDate: string
  timezone?: string
}

type TripRow = {
  id: string
  destination: string
  start_date: string
  end_date: string
  timezone: string | null
  created_at?: string
  updated_at?: string
}

function totalDaysFromRange(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff + 1)
}

function tripFromRow(row: TripRow): Trip {
  const start = row.start_date
  const end = row.end_date
  const totalDays = totalDaysFromRange(start, end)
  const lastUpdated = row.updated_at ? row.updated_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  return {
    id: row.id,
    destination: row.destination,
    timezone: row.timezone ?? undefined,
    startDate: start,
    endDate: end,
    travelers: 1,
    isGroupTrip: false,
    status: "planning",
    lastUpdated,
    progress: 0,
    selectedFlights: false,
    selectedHotel: false,
    itineraryDaysPlanned: 0,
    itineraryItems: [],
    totalDays,
    transitSaved: false,
    transitRoutes: [],
    financeSet: false,
    approvalsPending: 0,
    budgetTotal: 0,
    perPerson: 0,
    activities: ["Trip created"],
  }
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
    .select("id, destination, start_date, end_date, timezone, created_at, updated_at")
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
}

/**
 * Update a trip in Supabase. Only destination, startDate, endDate, timezone are persisted.
 */
export async function updateTripInSupabase(tripId: string, payload: UpdateTripPayload): Promise<void> {
  const supabase = createClient()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (payload.destination != null) updates.destination = payload.destination
  if (payload.startDate != null) updates.start_date = payload.startDate
  if (payload.endDate != null) updates.end_date = payload.endDate
  if (payload.timezone != null) updates.timezone = payload.timezone
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
