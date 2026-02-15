import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Trip } from "@/lib/trips"
import { getDateRangeLabel, getTripStatusLabel } from "@/lib/trips"

export function TripListSection({ trips }: { trips: Trip[] }) {
  return (
    <section className="rounded-sm border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            All Trips
          </p>
          <h2 className="mt-2 text-xl font-semibold">Trip list</h2>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/trips">View all trips</Link>
        </Button>
      </div>

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
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
