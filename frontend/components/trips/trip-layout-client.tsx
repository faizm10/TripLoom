"use client"

import * as React from "react"

import { useEnsureTripInStore, useTrip, useUpdateTrip } from "@/components/providers/trips-provider"
import { getTripFlightsFromSupabase } from "@/lib/supabase-trip-flights"
import { getTripHotelStaysFromSupabase, sumHotelStayNights } from "@/lib/supabase-trip-hotels"
import { itineraryWithFlightsSummary } from "@/lib/trip-flight-itinerary-sync"
import { summarizeFlights, summarizeHotels } from "@/lib/trip-manual-details"
import type { Trip } from "@/lib/trips"
import { TripShell } from "@/components/trips/trip-shell"

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
  }, [tripId, updateTrip])

  const trip = liveTrip
  return <TripShell trip={trip}>{children}</TripShell>
}
