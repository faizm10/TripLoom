"use client"

import { AllTripsPageContent } from "@/components/trips/all-trips-page-content"
import { useTrips } from "@/components/providers/trips-provider"
import { getTripsByTimeline } from "@/lib/trips"

export default function TripsPage() {
  const trips = useTrips()
  const { future, current, past } = getTripsByTimeline(trips)

  return (
    <AllTripsPageContent
      futureTrips={future}
      currentTrips={current}
      pastTrips={past}
    />
  )
}
