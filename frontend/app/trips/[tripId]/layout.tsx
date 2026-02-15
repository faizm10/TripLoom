import { notFound } from "next/navigation"

import { TripLayoutClient } from "@/components/trips/trip-layout-client"
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

  return (
    <TripLayoutClient tripId={tripId} serverTrip={trip}>
      {children}
    </TripLayoutClient>
  )
}
