import { createClient } from "@/lib/supabase/client"
import type { TransitMode, TransitRoute } from "@/lib/trips"

type TransitRouteRow = {
  id: string
  trip_id: string
  day_index: number
  from_label: string
  to_label: string
  from_place_id: string
  to_place_id: string
  mode: string
  duration_minutes: number
  departure_time_local: string
  arrival_time_local: string
  estimated_cost: number
  currency: string
  provider: string
  provider_route_ref: string
  reference_url: string
  transfers: number
  walking_minutes: number
  notes: string
  created_at: string
  updated_at: string
}

const VALID_MODES: Set<string> = new Set([
  "subway", "bus", "tram", "rail", "ferry", "walk_mix", "other",
])

function rowToTransitRoute(row: TransitRouteRow): TransitRoute {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayIndex: row.day_index,
    fromLabel: row.from_label,
    toLabel: row.to_label,
    fromPlaceId: row.from_place_id || undefined,
    toPlaceId: row.to_place_id || undefined,
    mode: (VALID_MODES.has(row.mode) ? row.mode : "other") as TransitMode,
    durationMinutes: row.duration_minutes,
    departureTimeLocal: row.departure_time_local || undefined,
    arrivalTimeLocal: row.arrival_time_local || undefined,
    estimatedCost: Number(row.estimated_cost) || 0,
    currency: row.currency || "CAD",
    provider: row.provider === "google_maps" ? "google_maps" : "manual",
    providerRouteRef: row.provider_route_ref || undefined,
    referenceUrl: row.reference_url || undefined,
    transfers: row.transfers || undefined,
    walkingMinutes: row.walking_minutes || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getTripTransitRoutesFromSupabase(
  tripId: string,
): Promise<TransitRoute[]> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data: rows, error } = await supabase
    .from("trip_transit_routes")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_index", { ascending: true })
    .order("created_at", { ascending: true })
  if (error || !rows?.length) return []
  return (rows as TransitRouteRow[]).map(rowToTransitRoute)
}

export async function saveTripTransitRouteToSupabase(
  tripId: string,
  route: TransitRoute,
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!user) throw new Error("You must be signed in to save transit routes.")

  const { error } = await supabase.from("trip_transit_routes").upsert(
    {
      id: route.id,
      trip_id: tripId,
      day_index: route.dayIndex,
      from_label: route.fromLabel,
      to_label: route.toLabel,
      from_place_id: route.fromPlaceId ?? "",
      to_place_id: route.toPlaceId ?? "",
      mode: route.mode,
      duration_minutes: route.durationMinutes,
      departure_time_local: route.departureTimeLocal ?? "",
      arrival_time_local: route.arrivalTimeLocal ?? "",
      estimated_cost: route.estimatedCost,
      currency: route.currency,
      provider: route.provider,
      provider_route_ref: route.providerRouteRef ?? "",
      reference_url: route.referenceUrl ?? "",
      transfers: route.transfers ?? 0,
      walking_minutes: route.walkingMinutes ?? 0,
      notes: route.notes ?? "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  )
  if (error) throw new Error(error.message)
}

export async function deleteTripTransitRouteFromSupabase(
  tripId: string,
  id: string,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("trip_transit_routes")
    .delete()
    .eq("trip_id", tripId)
    .eq("id", id)
  if (error) throw new Error(error.message)
}
