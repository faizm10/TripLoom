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
      <div className={mostActiveTrip ? "grid gap-4 md:grid-cols-2" : undefined}>
        <NewTripCard />
        {mostActiveTrip && <ContinuePlanningCard trip={mostActiveTrip} />}
      </div>
      <TripListSection trips={trips} />
    </div>
  )
}
