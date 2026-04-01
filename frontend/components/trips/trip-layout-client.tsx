"use client"

import * as React from "react"

import { useEnsureTripInStore, useTrip, useUpdateTrip } from "@/components/providers/trips-provider"
import { getTripFlightsFromSupabase, type SavedFlightRow } from "@/lib/supabase-trip-flights"
import {
  getTripHotelStaysFromSupabase,
  sumHotelStayNights,
  type TripHotelStay,
} from "@/lib/supabase-trip-hotels"
import { itineraryWithFlightsSummary } from "@/lib/trip-flight-itinerary-sync"
import { summarizeFlights, summarizeHotels } from "@/lib/trip-manual-details"
import type { Trip, TripItineraryItem } from "@/lib/trips"
import { TripShell } from "@/components/trips/trip-shell"

function fingerprintItineraryForSync(items: TripItineraryItem[] | undefined): string {
  if (!items?.length) return ""
  return JSON.stringify(items.map((i) => [i.id, i.dayIndex, i.timeBlock, i.title, i.category]))
}

function isFlightHotelSyncRedundant(
  base: Trip,
  flights: SavedFlightRow[],
  stays: TripHotelStay[]
): boolean {
  const flightSummary = summarizeFlights(flights)
  const hotelSummary = summarizeHotels(stays)
  const nights = sumHotelStayNights(stays)
  const area = stays[0]?.area || undefined
  const { itineraryItems, itineraryDaysPlanned } = itineraryWithFlightsSummary(base, flights)
  return (
    base.selectedFlights === (flights.length > 0) &&
    base.selectedHotel === (stays.length > 0) &&
    base.flightSummary === flightSummary &&
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

  React.useEffect(() => {
    let cancelled = false

    void Promise.all([
      getTripFlightsFromSupabase(tripId),
      getTripHotelStaysFromSupabase(tripId),
    ]).then(([flights, stays]) => {
      if (cancelled) return
      const base = liveTripRef.current
      if (isFlightHotelSyncRedundant(base, flights, stays)) return
      const { itineraryItems, itineraryDaysPlanned } = itineraryWithFlightsSummary(base, flights)
      updateTrip(tripId, {
        selectedFlights: flights.length > 0,
        selectedHotel: stays.length > 0,
        flightSummary: summarizeFlights(flights),
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
  }, [tripId, updateTrip, liveTrip.startDate, liveTrip.endDate, liveTrip.totalDays])

  const trip = liveTrip
  return <TripShell trip={trip}>{children}</TripShell>
}
