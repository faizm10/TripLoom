import { createClient } from "@/lib/supabase/client"

export type TripHotelStay = {
  id: string
  propertyName: string
  area: string
  checkIn: string
  checkOut: string
  addressNote: string
  totalCost: string
  currency: string
  notes: string
}

type TripHotelStayRow = {
  id: string
  trip_id: string
  property_name: string
  area: string
  check_in: string
  check_out: string
  address_note?: string | null
  total_cost?: string | null
  currency?: string | null
  notes?: string | null
}

function rowToStay(row: TripHotelStayRow): TripHotelStay {
  return {
    id: row.id,
    propertyName: row.property_name ?? "",
    area: row.area ?? "",
    checkIn: row.check_in ?? "",
    checkOut: row.check_out ?? "",
    addressNote: row.address_note ?? "",
    totalCost: row.total_cost ?? "",
    currency: row.currency ?? "CAD",
    notes: row.notes ?? "",
  }
}

export async function getTripHotelStaysFromSupabase(tripId: string): Promise<TripHotelStay[]> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data: rows, error } = await supabase
    .from("trip_hotel_stays")
    .select("*")
    .eq("trip_id", tripId)
    .order("check_in", { ascending: true })
  if (error) return []
  if (!rows?.length) return []
  return (rows as TripHotelStayRow[]).map(rowToStay)
}

export type SaveTripHotelStayPayload = Omit<TripHotelStay, "id"> & { id: string }

export async function saveTripHotelStayToSupabase(
  tripId: string,
  payload: SaveTripHotelStayPayload
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!user) throw new Error("You must be signed in to save hotel stays.")

  const { error } = await supabase.from("trip_hotel_stays").upsert(
    {
      id: payload.id,
      trip_id: tripId,
      property_name: payload.propertyName,
      area: payload.area,
      check_in: payload.checkIn,
      check_out: payload.checkOut,
      address_note: payload.addressNote,
      total_cost: payload.totalCost,
      currency: payload.currency,
      notes: payload.notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  )
  if (error) throw new Error(error.message)
}

export async function deleteTripHotelStayFromSupabase(tripId: string, id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("trip_hotel_stays")
    .delete()
    .eq("trip_id", tripId)
    .eq("id", id)
  if (error) throw new Error(error.message)
}
