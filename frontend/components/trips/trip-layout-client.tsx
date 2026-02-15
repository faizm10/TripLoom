"use client"

import { useTrip } from "@/components/providers/trips-provider"
import type { Trip } from "@/lib/trips"
import { TripShell } from "@/components/trips/trip-shell"

export function TripLayoutClient({
  tripId,
  serverTrip,
  children,
}: {
  tripId: string
  serverTrip: Trip
  children: React.ReactNode
}) {
  const trip = useTrip(tripId, serverTrip) ?? serverTrip
  return <TripShell trip={trip}>{children}</TripShell>
}
