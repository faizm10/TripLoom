import { notFound } from "next/navigation"

import { TripLayoutClient } from "@/components/trips/trip-layout-client"
import { getTripByIdFromSupabase } from "@/lib/supabase-trips-server"

export default async function TripLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}>) {
  const { tripId } = await params
  const trip = await getTripByIdFromSupabase(tripId)

  if (!trip) notFound()

  return (
    <TripLayoutClient tripId={tripId} serverTrip={trip}>
      {children}
    </TripLayoutClient>
  )
}
