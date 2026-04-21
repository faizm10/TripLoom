import { createClient } from "@/lib/supabase/client"
import type {
  ItineraryCategory,
  ItineraryStatus,
  ItineraryTimeBlock,
  TripItineraryItem,
} from "@/lib/trips"

type ItineraryRow = {
  id: string
  trip_id: string
  day_index: number
  time_block: string
  status: string
  category: string
  title: string
  location_label: string
  place_id: string | null
  lat: number | null
  lng: number | null
  location_link: string | null
  google_maps_link: string | null
  commute_details: string | null
  notes: string | null
  start_time_local: string | null
  end_time_local: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

function rowToItem(row: ItineraryRow): TripItineraryItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayIndex: row.day_index,
    timeBlock: row.time_block as ItineraryTimeBlock,
    status: row.status as ItineraryStatus,
    category: row.category as ItineraryCategory,
    title: row.title,
    locationLabel: row.location_label,
    placeId: row.place_id ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    locationLink: row.location_link ?? undefined,
    googleMapsLink: row.google_maps_link ?? undefined,
    commuteDetails: row.commute_details ?? undefined,
    notes: row.notes ?? undefined,
    startTimeLocal: row.start_time_local ?? undefined,
    endTimeLocal: row.end_time_local ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getTripItineraryFromSupabase(
  tripId: string,
): Promise<TripItineraryItem[]> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data: rows, error } = await supabase
    .from("itinerary_items")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_index", { ascending: true })
    .order("sort_order", { ascending: true })
  if (error || !rows?.length) return []
  return (rows as ItineraryRow[]).map(rowToItem)
}

export async function saveTripItineraryItemToSupabase(
  tripId: string,
  item: TripItineraryItem,
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!user) throw new Error("You must be signed in to save itinerary items.")

  const { error } = await supabase.from("itinerary_items").upsert(
    {
      id: item.id,
      trip_id: tripId,
      day_index: item.dayIndex,
      time_block: item.timeBlock,
      status: item.status,
      category: item.category,
      title: item.title,
      location_label: item.locationLabel,
      place_id: item.placeId ?? null,
      lat: item.lat ?? null,
      lng: item.lng ?? null,
      location_link: item.locationLink ?? null,
      google_maps_link: item.googleMapsLink ?? null,
      commute_details: item.commuteDetails ?? null,
      notes: item.notes ?? null,
      start_time_local: item.startTimeLocal ?? null,
      end_time_local: item.endTimeLocal ?? null,
      sort_order: item.sortOrder,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )
  if (error) throw new Error(error.message)
}

export async function saveTripItineraryBatchToSupabase(
  tripId: string,
  items: TripItineraryItem[],
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!user) throw new Error("You must be signed in to save itinerary items.")

  const now = new Date().toISOString()
  const rows = items.map((item) => ({
    id: item.id,
    trip_id: tripId,
    day_index: item.dayIndex,
    time_block: item.timeBlock,
    status: item.status,
    category: item.category,
    title: item.title,
    location_label: item.locationLabel,
    place_id: item.placeId ?? null,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    location_link: item.locationLink ?? null,
    google_maps_link: item.googleMapsLink ?? null,
    commute_details: item.commuteDetails ?? null,
    notes: item.notes ?? null,
    start_time_local: item.startTimeLocal ?? null,
    end_time_local: item.endTimeLocal ?? null,
    sort_order: item.sortOrder,
    updated_at: now,
  }))

  const { error } = await supabase
    .from("itinerary_items")
    .upsert(rows, { onConflict: "id" })
  if (error) throw new Error(error.message)
}

export async function deleteTripItineraryItemFromSupabase(
  tripId: string,
  itemId: string,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("itinerary_items")
    .delete()
    .eq("trip_id", tripId)
    .eq("id", itemId)
  if (error) throw new Error(error.message)
}

/** Remove items that exist in the DB but are no longer in the local set. */
export async function syncDeletedItineraryItems(
  tripId: string,
  currentItemIds: Set<string>,
  previousItemIds: Set<string>,
): Promise<void> {
  const removed = [...previousItemIds].filter((id) => !currentItemIds.has(id))
  if (removed.length === 0) return
  await Promise.all(
    removed.map((id) => deleteTripItineraryItemFromSupabase(tripId, id)),
  )
}
