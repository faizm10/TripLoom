import Link from "next/link"
import { ArrowRightIcon, PlaneIcon, HotelIcon, MapIcon, CalendarDaysIcon, WalletIcon, CheckCircle2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Trip } from "@/lib/trips"
import { getNextStep } from "@/lib/trips"

const STEP_ICONS: Record<string, React.ElementType> = {
  "Choose Flights": PlaneIcon,
  "Book a Hotel": HotelIcon,
  "Plan Itinerary": CalendarDaysIcon,
  "Add Transit": MapIcon,
  "Set Budget": WalletIcon,
}

export function ContinuePlanningCard({ trip }: { trip: Trip }) {
  const nextStep = getNextStep(trip)
  const StepIcon = STEP_ICONS[nextStep.cta] ?? CheckCircle2Icon

  return (
    <section className="rounded-sm border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-semibold">{trip.destination}</h2>

      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium tabular-nums">{trip.progress}%</span>
        </div>
        <Progress className="h-3" value={trip.progress} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild className="gap-2">
          <Link href={nextStep.href}>
            <StepIcon className="size-4" />
            {nextStep.cta}
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <Link href={`/trips/${trip.id}`}>
            Open trip
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
