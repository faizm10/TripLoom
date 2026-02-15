import { notFound } from "next/navigation"

import { ItineraryPageContent } from "@/components/trips/pages/itinerary-page-content"
import { getTripById } from "@/lib/trips"

export default async function TripItineraryPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const trip = getTripById(tripId)
  if (!trip) notFound()

  return <ItineraryPageContent trip={trip} />
}
