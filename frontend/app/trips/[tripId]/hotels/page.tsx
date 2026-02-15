import { notFound } from "next/navigation"

import { HotelsPageContent } from "@/components/trips/pages/hotels-page-content"
import { getTripById } from "@/lib/trips"

export default async function TripHotelsPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const trip = getTripById(tripId)
  if (!trip) notFound()

  return <HotelsPageContent trip={trip} />
}
