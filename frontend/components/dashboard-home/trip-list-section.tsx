"use client"

import Link from "next/link"
import { ExternalLinkIcon, CalendarDaysIcon, Trash2Icon, ClockIcon } from "lucide-react"

import { useDeleteTrip } from "@/components/providers/trips-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Trip } from "@/lib/trips"
import { getDateRangeLabel, getTripStatusLabel } from "@/lib/trips"
import { cn } from "@/lib/utils"

function getStatusColor(status: Trip["status"]) {
  if (status === "planning") return "bg-amber-500/15 text-amber-700 border-amber-200"
  if (status === "booked") return "bg-blue-500/15 text-blue-700 border-blue-200"
  if (status === "in_progress") return "bg-green-500/15 text-green-700 border-green-200"
  return ""
}

function getProgressColor(progress: number) {
  if (progress >= 80) return "bg-green-500"
  if (progress >= 40) return "bg-blue-500"
  return "bg-amber-500"
}

function relativeTime(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days === 0) return "today"
  if (days === 1) return "1d ago"
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
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
            <div className="flex flex-col gap-2 p-4 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium leading-snug">{trip.destination}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{getDateRangeLabel(trip)}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("rounded-sm text-xs shrink-0", getStatusColor(trip.status))}
                >
                  {getTripStatusLabel(trip.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto pt-1">
                <ClockIcon className="size-3" />
                <span>{relativeTime(trip.lastUpdated)}</span>
                <span className="ml-auto font-medium tabular-nums">{trip.progress}%</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full bg-muted">
              <div
                className={cn("h-full transition-all", getProgressColor(trip.progress))}
                style={{ width: `${trip.progress}%` }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 border-t px-3 py-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="size-8">
                    <Link href={`/trips/${trip.id}`}>
                      <ExternalLinkIcon className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open trip</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="ghost" size="icon" className="size-8">
                    <Link href={`/trips/${trip.id}/itinerary`}>
                      <CalendarDaysIcon className="size-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Itinerary</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 ml-auto text-destructive hover:text-destructive"
                    onClick={() => handleDelete(trip)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete trip</TooltipContent>
              </Tooltip>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
