import Link from "next/link"
import { CheckCircle2Icon, Share2Icon, UserPlusIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Trip } from "@/lib/trips"
import { getDateRangeLabel, getMissingChecklist, getNextStep } from "@/lib/trips"

const progressSteps = [
  "Trip Basics",
  "Flights",
  "Hotels",
  "Itinerary",
  "Transit",
  "Finance",
  "Ready",
]

export function OverviewPageContent({ trip }: { trip: Trip }) {
  const nextStep = getNextStep(trip)
  const missing = getMissingChecklist(trip)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{trip.destination}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {getDateRangeLabel(trip)} • {trip.travelers} travelers
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2Icon /> Share
              </Button>
              <Button variant="outline" size="sm">
                <UserPlusIcon /> Invite
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex flex-wrap gap-2">
            {progressSteps.map((step, idx) => {
              const done = Math.floor((trip.progress / 100) * progressSteps.length) > idx
              return (
                <Badge key={step} variant={done ? "secondary" : "outline"} className="rounded-none">
                  {step}
                </Badge>
              )
            })}
          </div>
          <Progress value={trip.progress} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Best Action</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-base font-medium">{nextStep.title}</p>
            <p className="text-sm text-muted-foreground">{nextStep.description}</p>
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {nextStep.recommendations.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
          <Button asChild>
            <Link href={nextStep.href}>{nextStep.cta}</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Flights</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {trip.selectedFlights ? trip.flightSummary || "Selected" : "Not selected"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Hotel</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {trip.selectedHotel ? trip.hotelSummary || trip.hotelArea || "Selected" : "Not selected"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Itinerary</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {trip.itineraryDaysPlanned}/{trip.totalDays} days planned
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Budget</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            ${trip.budgetTotal} total • ${trip.perPerson}/person
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s Missing</CardTitle>
          </CardHeader>
          <CardContent>
            {missing.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2Icon className="size-4" /> Everything essential is complete.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {missing.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What Changed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {trip.activities.map((event) => (
                <li key={event}>• {event}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
