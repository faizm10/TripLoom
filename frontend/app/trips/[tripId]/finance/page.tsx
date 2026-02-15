import { notFound } from "next/navigation"

import { FinancePageContent } from "@/components/trips/pages/finance-page-content"
import { getTripById } from "@/lib/trips"

export default async function TripFinancePage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const trip = getTripById(tripId)
  if (!trip) notFound()

  return <FinancePageContent trip={trip} />
}
