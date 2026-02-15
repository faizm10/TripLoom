import { notFound } from "next/navigation"

import { TransitPageContent } from "@/components/trips/pages/transit-page-content"
import { getTripById } from "@/lib/trips"

export default async function TripTransitPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const trip = getTripById(tripId)
  if (!trip) notFound()

  return <TransitPageContent trip={trip} />
}
