import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { hashShareToken } from "@/lib/trip-share-token"
import type { TripRow } from "@/lib/supabase-trip-row"
import { tripFromRow } from "@/lib/supabase-trip-row"
import type { Trip } from "@/lib/trips"

export type PublicFlightShare = {
  id: string
  source: string
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
  stopDetails: unknown
}

export type PublicGroundShare = {
  id: string
  source: string
  route: string
  travelDate: string
  departure: string
  arrival: string
  duration: string
  operator: string
  serviceNumber: string
  cost: string
  notes: string
}

export type PublicHotelShare = {
  id: string
  propertyName: string
  area: string
  checkIn: string
  checkOut: string
  notes: string
}

export type PublicPackingShare = {
  id: string
  label: string
  isChecked: boolean
  sortOrder: number
}

export type PublicTripSharePayload = {
  trip: Trip
  flights: PublicFlightShare[]
  groundTrips: PublicGroundShare[]
  hotels: PublicHotelShare[]
  groupPacking: PublicPackingShare[]
}

function isLinkUsable(expiresAt: string | null, revokedAt: string | null): boolean {
  if (revokedAt) return false
  if (expiresAt && new Date(expiresAt) <= new Date()) return false
  return true
}

/**
 * Load a redacted trip snapshot for an active view-only share token. Returns null if invalid/expired/revoked.
 */
export async function getPublicTripSharePayload(rawToken: string): Promise<PublicTripSharePayload | null> {
  const trimmed = rawToken?.trim()
  if (!trimmed) return null

  const admin = createAdminClient()
  const tokenHash = hashShareToken(trimmed)

  const { data: link, error: linkError } = await admin
    .from("trip_share_links")
    .select("id, trip_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (linkError || !link || !isLinkUsable(link.expires_at, link.revoked_at)) {
    return null
  }

  const tripId = link.trip_id as string

  const { data: tripRow, error: tripError } = await admin
    .from("trips")
    .select(
      "id, destination, start_date, end_date, timezone, travelers, is_group_trip, total_days, travel_scope, created_at, updated_at"
    )
    .eq("id", tripId)
    .maybeSingle()

  if (tripError || !tripRow) return null

  const trip = tripFromRow(tripRow as TripRow)

  const [flightsRes, groundRes, hotelsRes, packingRes] = await Promise.all([
    admin
      .from("trip_flights")
      .select(
        "id, source, route, flight_date, departure, arrival, duration, stops, airline, flight_number, cost, notes, stop_details"
      )
      .eq("trip_id", tripId)
      .order("flight_date", { ascending: true }),
    admin
      .from("trip_ground_trips")
      .select(
        "id, source, route, travel_date, departure, arrival, duration, operator, service_number, cost, notes"
      )
      .eq("trip_id", tripId)
      .order("travel_date", { ascending: true }),
    admin
      .from("trip_hotel_stays")
      .select("id, property_name, area, check_in, check_out, notes")
      .eq("trip_id", tripId)
      .order("check_in", { ascending: true }),
    admin
      .from("trip_packing_items")
      .select("id, label, is_checked, sort_order")
      .eq("trip_id", tripId)
      .is("user_id", null)
      .order("sort_order", { ascending: true }),
  ])

  const flights: PublicFlightShare[] = (flightsRes.data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    source: String(r.source ?? ""),
    route: String(r.route ?? ""),
    date: String(r.flight_date ?? ""),
    departure: String(r.departure ?? ""),
    arrival: String(r.arrival ?? ""),
    duration: String(r.duration ?? ""),
    stops: String(r.stops ?? ""),
    airline: String(r.airline ?? ""),
    flightNumber: String(r.flight_number ?? ""),
    cost: String(r.cost ?? ""),
    notes: String(r.notes ?? ""),
    stopDetails: r.stop_details ?? [],
  }))

  const groundTrips: PublicGroundShare[] = (groundRes.data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    source: String(r.source ?? ""),
    route: String(r.route ?? ""),
    travelDate: String(r.travel_date ?? ""),
    departure: String(r.departure ?? ""),
    arrival: String(r.arrival ?? ""),
    duration: String(r.duration ?? ""),
    operator: String(r.operator ?? ""),
    serviceNumber: String(r.service_number ?? ""),
    cost: String(r.cost ?? ""),
    notes: String(r.notes ?? ""),
  }))

  const hotels: PublicHotelShare[] = (hotelsRes.data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    propertyName: String(r.property_name ?? ""),
    area: String(r.area ?? ""),
    checkIn: String(r.check_in ?? ""),
    checkOut: String(r.check_out ?? ""),
    notes: String(r.notes ?? ""),
  }))

  const groupPacking: PublicPackingShare[] = (packingRes.data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    label: String(r.label ?? ""),
    isChecked: Boolean(r.is_checked),
    sortOrder: Number(r.sort_order ?? 0),
  }))

  return { trip, flights, groundTrips, hotels, groupPacking }
}
