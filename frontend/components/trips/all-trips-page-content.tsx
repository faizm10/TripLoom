"use client"

import Link from "next/link"
import { Trash2Icon } from "lucide-react"

import { useDeleteTrip } from "@/components/providers/trips-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Trip } from "@/lib/trips"
import { getDateRangeLabel, getTripStatusLabel } from "@/lib/trips"

function TripGroupSection({
  title,
  trips,
  emptyText,
  onDeleteTrip,
}: {
  title: string
  trips: Trip[]
  emptyText: string
  onDeleteTrip: (trip: Trip) => void
}) {
  return (
    <section className="rounded-sm border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-semibold">{title}</h2>

      {trips.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => (
            <article key={trip.id} className="rounded-sm border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{trip.destination}</p>
                  <p className="text-xs text-muted-foreground">{getDateRangeLabel(trip)}</p>
                </div>
                <Badge variant="secondary" className="rounded-none">
                  {getTripStatusLabel(trip.status)}
                </Badge>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Last updated: {trip.lastUpdated}
              </p>

              <div className="mt-3 flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/trips/${trip.id}`}>Open</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/trips/${trip.id}/itinerary`}>Itinerary</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-700"
                  onClick={() => onDeleteTrip(trip)}
                >
                  <Trash2Icon />
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function AllTripsPageContent({
  futureTrips,
  currentTrips,
  pastTrips,
}: {
  futureTrips: Trip[]
  currentTrips: Trip[]
  pastTrips: Trip[]
}) {
  const deleteTrip = useDeleteTrip()
  const handleDeleteTrip = (trip: Trip) => {
    const ok = window.confirm(`Delete trip "${trip.destination}"?`)
    if (!ok) return
    deleteTrip(trip.id)
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8 sm:px-10 sm:py-10">
      <div className="mb-4 rounded-sm border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Trips
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              All trips
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse upcoming, active, and completed trips in one place.
            </p>
          </div>
          <Button asChild>
            <Link href="/agent">Plan with Agent</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <TripGroupSection
          title="Future Trips"
          trips={futureTrips}
          emptyText="No future trips yet."
          onDeleteTrip={handleDeleteTrip}
        />
        <TripGroupSection
          title="Current Trips"
          trips={currentTrips}
          emptyText="No trips are currently in progress."
          onDeleteTrip={handleDeleteTrip}
        />
        <TripGroupSection
          title="Past Trips"
          trips={pastTrips}
          emptyText="No past trips yet."
          onDeleteTrip={handleDeleteTrip}
        />
      </div>
    </main>
  )
}
