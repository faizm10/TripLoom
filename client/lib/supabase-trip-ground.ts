import { createClient } from "@/lib/supabase/client"

export type GroundLegType = "outbound" | "inbound" | "one_way" | "other"

export type SavedGroundTripRow = {
  id: string
  source: GroundLegType
  route: string
  date: string
  departure: string
  arrival: string
  duration: string
  operator: string
  serviceNumber: string
  cost: string
  notes: string
}

type TripGroundRow = {
  id: string
  trip_id: string
  source: string
  route: string
  travel_date: string
  departure: string
  arrival: string
  duration: string
  operator: string
  service_number?: string | null
  cost: string
  notes?: string | null
}

function normalizeLegType(value: string): GroundLegType {
  if (value === "outbound" || value === "inbound" || value === "one_way" || value === "other") {
    return value
  }
  return "other"
}

function rowToSaved(row: TripGroundRow): SavedGroundTripRow {
  return {
    id: row.id,
    source: normalizeLegType(row.source),
    route: row.route ?? "",
    date: row.travel_date ?? "",
    departure: row.departure ?? "",
    arrival: row.arrival ?? "",
    duration: row.duration ?? "",
    operator: row.operator ?? "",
    serviceNumber: row.service_number ?? "",
    cost: row.cost ?? "",
    notes: row.notes ?? "",
  }
}

export async function getTripGroundTripsFromSupabase(tripId: string): Promise<SavedGroundTripRow[]> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data: rows, error } = await supabase
    .from("trip_ground_trips")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
  if (error) return []
  if (!rows?.length) return []
  return (rows as TripGroundRow[]).map(rowToSaved)
}

export type SaveTripGroundPayload = Omit<SavedGroundTripRow, "id"> & { id: string }

export async function saveTripGroundToSupabase(tripId: string, payload: SaveTripGroundPayload): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!user) throw new Error("You must be signed in to save bus & train trips.")

  const { error } = await supabase.from("trip_ground_trips").upsert(
    {
      id: payload.id,
      trip_id: tripId,
      source: payload.source,
      route: payload.route,
      travel_date: payload.date,
      departure: payload.departure,
      arrival: payload.arrival,
      duration: payload.duration,
      operator: payload.operator,
      service_number: payload.serviceNumber,
      cost: payload.cost,
      notes: payload.notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  )
  if (error) throw new Error(error.message)
}

export async function deleteTripGroundFromSupabase(tripId: string, id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("trip_ground_trips")
    .delete()
    .eq("trip_id", tripId)
    .eq("id", id)
  if (error) throw new Error(error.message)
}
