import { AllTripsPageContent } from "@/components/trips/all-trips-page-content"
import { getTrips, getTripsByTimeline } from "@/lib/trips"

export default function TripsPage() {
  const trips = getTrips()
  const { future, current, past } = getTripsByTimeline(trips)

  return (
    <AllTripsPageContent
      futureTrips={future}
      currentTrips={current}
      pastTrips={past}
    />
  )
}
