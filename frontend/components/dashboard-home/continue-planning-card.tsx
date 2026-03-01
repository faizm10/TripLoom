import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Trip } from "@/lib/trips"
import { getNextStep } from "@/lib/trips"

export function ContinuePlanningCard({ trip }: { trip: Trip }) {
  const nextStep = getNextStep(trip)

  return (
    <section className="flex flex-col justify-between gap-4 rounded-sm border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold">{trip.destination}</h2>
        <div className="mt-3 flex items-center gap-3">
          <Progress className="h-3 flex-1" value={trip.progress} />
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {trip.progress}%
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href={nextStep.href}>
            {nextStep.cta}
            <ArrowRight className="ml-1 size-3.5" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/trips/${trip.id}`}>Open dashboard</Link>
        </Button>
      </div>
    </section>
  )
}
