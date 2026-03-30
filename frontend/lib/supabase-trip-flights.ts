import { createClient } from "@/lib/supabase/client"

export type FlightLegType = "outbound" | "inbound" | "one_way" | "internal" | "other"

export type FlightStopDetail = {
  airport: string
  layover: string
}

export type SavedFlightRow = {
  id: string
  source: FlightLegType
  route: string
  date: string
  departure: string
  arrival: string
  duration: string
  stops: string
  airline: string
  flightNumber: string
  cost: string
  notes: string
  stopDetails: FlightStopDetail[]
}

type TripFlightRow = {
  id: string
  trip_id: string
  source: string
  route: string
  flight_date: string
  departure: string
  arrival: string
  duration: string
  stops: string
  airline: string
  flight_number?: string | null
  cost: string
  notes?: string | null
  stop_details?: FlightStopDetail[] | null
}

function normalizeLegType(value: string): FlightLegType {
  if (
    value === "outbound" ||
    value === "inbound" ||
    value === "one_way" ||
    value === "internal" ||
    value === "other"
  ) {
    return value
  }
  return "other"
}

function rowToSaved(row: TripFlightRow): SavedFlightRow {
  return {
    id: row.id,
    source: normalizeLegType(row.source),
    route: row.route ?? "",
    date: row.flight_date ?? "",
    departure: row.departure ?? "",
    arrival: row.arrival ?? "",
    duration: row.duration ?? "",
    stops: row.stops ?? "",
    airline: row.airline ?? "",
    flightNumber: row.flight_number ?? "",
    cost: row.cost ?? "",
    notes: row.notes ?? "",
    stopDetails: Array.isArray(row.stop_details)
      ? row.stop_details.map((item) => ({
          airport: typeof item?.airport === "string" ? item.airport : "",
          layover: typeof item?.layover === "string" ? item.layover : "",
        }))
      : [],
  }
}

export async function getTripFlightsFromSupabase(tripId: string): Promise<SavedFlightRow[]> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data: rows, error } = await supabase
    .from("trip_flights")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
  if (error) return []
  if (!rows?.length) return []
  return (rows as TripFlightRow[]).map(rowToSaved)
}

export type SaveTripFlightPayload = {
  id: string
  source: FlightLegType
  route: string
  date: string
  departure: string
  arrival: string
  duration: string
  stops: string
  airline: string
  flightNumber: string
  cost: string
  notes: string
  stopDetails: FlightStopDetail[]
}

export async function saveTripFlightToSupabase(
  tripId: string,
  payload: SaveTripFlightPayload
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!user) throw new Error("You must be signed in to save flights.")

  const { error } = await supabase.from("trip_flights").upsert(
    {
      id: payload.id,
      trip_id: tripId,
      source: payload.source,
      route: payload.route,
      flight_date: payload.date,
      departure: payload.departure,
      arrival: payload.arrival,
      duration: payload.duration,
      stops: payload.stops,
      airline: payload.airline,
      flight_number: payload.flightNumber,
      cost: payload.cost,
      notes: payload.notes,
      stop_details: payload.stopDetails,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  )
  if (error) throw new Error(error.message)
}

export async function updateTripFlightInSupabase(
  tripId: string,
  id: string,
  payload: Partial<Omit<SaveTripFlightPayload, "id">>
): Promise<void> {
  const supabase = createClient()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (payload.source != null) updates.source = payload.source
  if (payload.route != null) updates.route = payload.route
  if (payload.date != null) updates.flight_date = payload.date
  if (payload.departure != null) updates.departure = payload.departure
  if (payload.arrival != null) updates.arrival = payload.arrival
  if (payload.duration != null) updates.duration = payload.duration
  if (payload.stops != null) updates.stops = payload.stops
  if (payload.airline != null) updates.airline = payload.airline
  if (payload.flightNumber != null) updates.flight_number = payload.flightNumber
  if (payload.cost != null) updates.cost = payload.cost
  if (payload.notes != null) updates.notes = payload.notes
  if (payload.stopDetails != null) updates.stop_details = payload.stopDetails
  if (Object.keys(updates).length <= 1) return

  const { error } = await supabase
    .from("trip_flights")
    .update(updates)
    .eq("trip_id", tripId)
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deleteTripFlightFromSupabase(tripId: string, id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("trip_flights")
    .delete()
    .eq("trip_id", tripId)
    .eq("id", id)
  if (error) throw new Error(error.message)
}
