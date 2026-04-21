"use client"

import Link from "next/link"
import { CalendarDays, ExternalLink, Trash2 } from "lucide-react"

import { useDeleteTrip } from "@/components/providers/trips-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Trip } from "@/lib/trips"
import { getDateRangeLabel, getTripStatusLabel } from "@/lib/trips"

const STATUS_CLASSES: Record<Trip["status"], string> = {
  planning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  booked: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

export function TripListSection({ trips }: { trips: Trip[] }) {
  const deleteTrip = useDeleteTrip()

  const handleDelete = (trip: Trip) => {
    const ok = window.confirm(`Delete trip "${trip.destination}"?`)
    if (!ok) return
    deleteTrip(trip.id)
  }

  return (
    <section className="rounded-sm border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Your Trips</h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/trips">View all</Link>
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {trips.map((trip) => (
          <article key={trip.id} className="flex flex-col rounded-sm border overflow-hidden">
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium leading-tight">{trip.destination}</p>
                <Badge className={STATUS_CLASSES[trip.status]}>
                  {getTripStatusLabel(trip.status)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{getDateRangeLabel(trip)}</p>
            </div>

            <div className="flex items-center justify-between gap-2 border-t px-4 py-2">
              <span className="text-xs text-muted-foreground tabular-nums">
                {trip.progress}% complete
              </span>
              <div className="flex items-center gap-1">
                <Button asChild variant="ghost" size="icon" className="size-7" title="Open trip">
                  <Link href={`/trips/${trip.id}`}>
                    <ExternalLink className="size-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="size-7" title="Itinerary">
                  <Link href={`/trips/${trip.id}/itinerary`}>
                    <CalendarDays className="size-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  title="Delete trip"
                  onClick={() => handleDelete(trip)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <Progress className="h-1 rounded-none" value={trip.progress} />
          </article>
        ))}
      </div>
    </section>
  )
}
