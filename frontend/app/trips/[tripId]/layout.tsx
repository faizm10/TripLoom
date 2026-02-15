import { notFound } from "next/navigation"

import { TripShell } from "@/components/trips/trip-shell"
import { getTripById } from "@/lib/trips"

export default async function TripLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}>) {
  const { tripId } = await params
  const trip = getTripById(tripId)

  if (!trip) notFound()

  return <TripShell trip={trip}>{children}</TripShell>
}
