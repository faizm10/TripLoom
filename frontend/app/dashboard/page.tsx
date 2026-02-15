import { ContinuePlanningCard } from "@/components/dashboard-home/continue-planning-card"
import { NewTripCard } from "@/components/dashboard-home/new-trip-card"
import { TripListSection } from "@/components/dashboard-home/trip-list-section"
import { getTrips } from "@/lib/trips"

export default function DashboardHomePage() {
  const trips = getTrips()
  const mostActiveTrip = [...trips].sort((a, b) => b.progress - a.progress)[0]

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8 sm:px-10 sm:py-10">
      <div className="space-y-4">
        <NewTripCard />
        <ContinuePlanningCard trip={mostActiveTrip} />
        <TripListSection trips={trips} />
      </div>
    </main>
  )
}
