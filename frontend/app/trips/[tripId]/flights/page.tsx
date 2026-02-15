import { notFound } from "next/navigation"

import { FlightsPageContent } from "@/components/trips/pages/flights-page-content"
import { getTripById } from "@/lib/trips"

export default async function TripFlightsPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const trip = getTripById(tripId)
  if (!trip) notFound()

  return <FlightsPageContent trip={trip} />
}
