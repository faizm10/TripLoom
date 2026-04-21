import { notFound } from "next/navigation"

import { TripLayoutClient } from "@/components/trips/trip-layout-client"
import { getTripByIdFromSupabase } from "@/lib/supabase-trips-server"

export default async function TripLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ id: string }>
}>) {
  const { id } = await params
  const trip = await getTripByIdFromSupabase(id)

  if (!trip) notFound()

  return (
    <TripLayoutClient tripId={id} serverTrip={trip}>
      {children}
    </TripLayoutClient>
  )
}
