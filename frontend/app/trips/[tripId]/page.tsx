import { notFound } from "next/navigation"

import { OverviewPageContent } from "@/components/trips/pages/overview-page-content"
import { getTripById } from "@/lib/trips"

export default async function TripOverviewPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const trip = getTripById(tripId)
  if (!trip) notFound()

  return <OverviewPageContent trip={trip} />
}
