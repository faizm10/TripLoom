import { notFound } from "next/navigation"

import { TransitPageClient } from "@/components/trips/pages/transit-page-client"
import { getTripById } from "@/lib/trips"

export default async function TripTransitPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const trip = getTripById(tripId)
  if (!trip) notFound()

  return <TransitPageClient trip={trip} />
}
