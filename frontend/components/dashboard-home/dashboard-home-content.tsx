"use client"

import { useTrips } from "@/components/providers/trips-provider"
import { ContinuePlanningCard } from "@/components/dashboard-home/continue-planning-card"
import { NewTripCard } from "@/components/dashboard-home/new-trip-card"
import { TripListSection } from "@/components/dashboard-home/trip-list-section"

export function DashboardHomeContent() {
  const trips = useTrips()
  const mostActiveTrip = [...trips].sort((a, b) => b.progress - a.progress)[0]

  return (
    <div className="space-y-4">
      <NewTripCard />
      {mostActiveTrip && (
        <ContinuePlanningCard trip={mostActiveTrip} />
      )}
      <TripListSection trips={trips} />
    </div>
  )
}
