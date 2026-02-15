import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Trip } from "@/lib/trips"
import { getNextStep } from "@/lib/trips"

export function ContinuePlanningCard({ trip }: { trip: Trip }) {
  const nextStep = getNextStep(trip)

  return (
    <section className="rounded-sm border bg-card p-5 sm:p-6">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Continue Planning
      </p>
      <h2 className="mt-2 text-xl font-semibold">{trip.destination}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Progress {trip.progress}% • Next: {nextStep.title}
      </p>

      <Progress className="mt-4 h-2" value={trip.progress} />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={nextStep.href}>{nextStep.cta}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/trips/${trip.id}`}>Open Trip Dashboard</Link>
        </Button>
      </div>
    </section>
  )
}
