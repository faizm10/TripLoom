"use client"

import * as React from "react"

import { useEnsureTripInStore, useTrip, useUpdateTrip } from "@/components/providers/trips-provider"
import { getTripFlightsFromSupabase, type SavedFlightRow } from "@/lib/supabase-trip-flights"
import { getTripGroundTripsFromSupabase, type SavedGroundTripRow } from "@/lib/supabase-trip-ground"
import {
  getTripHotelStaysFromSupabase,
  sumHotelStayNights,
  type TripHotelStay,
} from "@/lib/supabase-trip-hotels"
import { itineraryWithTransportSummary } from "@/lib/trip-flight-itinerary-sync"
import { summarizeFlights, summarizeGroundTrips, summarizeHotels } from "@/lib/trip-manual-details"
import type { Trip, TripItineraryItem } from "@/lib/trips"
import { getTripTravelScope } from "@/lib/trips"
import { TripShell } from "@/components/trips/trip-shell"

function fingerprintItineraryForSync(items: TripItineraryItem[] | undefined): string {
  if (!items?.length) return ""
  return JSON.stringify(items.map((i) => [i.id, i.dayIndex, i.timeBlock, i.title, i.category]))
}

function isTripDetailSyncRedundant(
  base: Trip,
  flights: SavedFlightRow[],
  ground: SavedGroundTripRow[],
  stays: TripHotelStay[]
): boolean {
  const flightSummary = summarizeFlights(flights)
  const groundSummary = summarizeGroundTrips(ground)
  const hotelSummary = summarizeHotels(stays)
  const nights = sumHotelStayNights(stays)
  const area = stays[0]?.area || undefined
  const { itineraryItems, itineraryDaysPlanned } = itineraryWithTransportSummary(base, flights, ground)
  return (
    base.selectedFlights === (flights.length > 0) &&
    base.selectedGroundTransport === (ground.length > 0) &&
    base.selectedHotel === (stays.length > 0) &&
    base.flightSummary === flightSummary &&
    base.groundTransportSummary === groundSummary &&
    base.hotelSummary === hotelSummary &&
    (base.hotelArea ?? "") === (area ?? "") &&
    (base.hotelNightsBooked ?? 0) === nights &&
    base.itineraryDaysPlanned === itineraryDaysPlanned &&
    fingerprintItineraryForSync(base.itineraryItems) === fingerprintItineraryForSync(itineraryItems)
  )
}

export function TripLayoutClient({
  tripId,
  serverTrip,
  children,
}: {
  tripId: string
  serverTrip: Trip
  children: React.ReactNode
}) {
  const ensureTripInStore = useEnsureTripInStore()
  const updateTrip = useUpdateTrip()

  React.useLayoutEffect(() => {
    ensureTripInStore(serverTrip)
  }, [ensureTripInStore, serverTrip])

  const liveTrip = useTrip(tripId, serverTrip) ?? serverTrip
  const liveTripRef = React.useRef(liveTrip)
  liveTripRef.current = liveTrip

  const travelScope = getTripTravelScope(liveTrip)

  React.useEffect(() => {
    let cancelled = false

    const groundPromise =
      travelScope === "domestic"
        ? getTripGroundTripsFromSupabase(tripId)
        : Promise.resolve([] as SavedGroundTripRow[])

    void Promise.all([
      getTripFlightsFromSupabase(tripId),
      groundPromise,
      getTripHotelStaysFromSupabase(tripId),
    ]).then(([flights, ground, stays]) => {
      if (cancelled) return
      const base = liveTripRef.current
      if (isTripDetailSyncRedundant(base, flights, ground, stays)) return
      const { itineraryItems, itineraryDaysPlanned } = itineraryWithTransportSummary(base, flights, ground)
      updateTrip(tripId, {
        selectedFlights: flights.length > 0,
        selectedGroundTransport: ground.length > 0,
        selectedHotel: stays.length > 0,
        flightSummary: summarizeFlights(flights),
        groundTransportSummary: summarizeGroundTrips(ground),
        hotelSummary: summarizeHotels(stays),
        hotelArea: stays[0]?.area || undefined,
        hotelNightsBooked: sumHotelStayNights(stays),
        itineraryItems,
        itineraryDaysPlanned,
      })
    })

    return () => {
      cancelled = true
    }
  }, [tripId, travelScope, updateTrip, liveTrip.startDate, liveTrip.endDate, liveTrip.totalDays])

  const trip = liveTrip
  return <TripShell trip={trip}>{children}</TripShell>
}
