import { createClient } from "@/lib/supabase/client"

export type SavedFlightRow = {
  id: string
  source: string
  route: string
  date: string
  departure: string
  arrival: string
  duration: string
  stops: string
  airline: string
  cost: string
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
  cost: string
  offer_id: string | null
  book_url: string | null
}

function rowToSaved(row: TripFlightRow): SavedFlightRow {
  return {
    id: row.id,
    source: row.source,
    route: row.route ?? "",
    date: row.flight_date ?? "",
    departure: row.departure ?? "",
    arrival: row.arrival ?? "",
    duration: row.duration ?? "",
    stops: row.stops ?? "",
    airline: row.airline ?? "",
    cost: row.cost ?? "",
  }
}

/**
 * Load saved flights for a trip from the DB. Returns [] if not signed in or on error.
 */
export async function getTripFlightsFromSupabase(tripId: string): Promise<SavedFlightRow[]> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data: rows, error } = await supabase
    .from("trip_flights")
    .select("id, trip_id, source, route, flight_date, departure, arrival, duration, stops, airline, cost, offer_id, book_url")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
  if (error) return []
  if (!rows?.length) return []
  return (rows as TripFlightRow[]).map(rowToSaved)
}

export type SaveTripFlightPayload = {
  id: string
  source: string
  route: string
  date: string
  departure: string
  arrival: string
  duration: string
  stops: string
  airline: string
  cost: string
  offerId?: string
  bookUrl?: string
}

/**
 * Save a flight choice to the DB. Upserts by id (same id = replace).
 */
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
      cost: payload.cost,
      offer_id: payload.offerId ?? null,
      book_url: payload.bookUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  )
  if (error) throw new Error(error.message)
}

/**
 * Remove a saved flight from the DB.
 */
export async function deleteTripFlightFromSupabase(tripId: string, id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("trip_flights")
    .delete()
    .eq("trip_id", tripId)
    .eq("id", id)
  if (error) throw new Error(error.message)
}
