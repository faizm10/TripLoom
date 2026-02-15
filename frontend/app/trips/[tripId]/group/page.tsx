import { notFound } from "next/navigation"

import { GroupPageContent } from "@/components/trips/pages/group-page-content"
import { getTripById } from "@/lib/trips"

export default async function TripGroupPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const trip = getTripById(tripId)
  if (!trip) notFound()

  return <GroupPageContent trip={trip} />
}
