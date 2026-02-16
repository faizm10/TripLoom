"use client"

import Link from "next/link"
import { CheckCircle2Icon, Share2Icon, UserPlusIcon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { useUpdateTrip } from "@/components/providers/trips-provider"
import { useTripPage } from "@/components/trips/trip-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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

export function OverviewPageContent({ trip: tripProp }: { trip: Trip }) {
  const fromContext = useTripPage()
  const trip = fromContext ?? tripProp
  const updateTrip = useUpdateTrip()
  const nextStep = getNextStep(trip)
  const missing = getMissingChecklist(trip)
  const [editOpen, setEditOpen] = React.useState(false)
  const [destinationDraft, setDestinationDraft] = React.useState(trip.destination)
  const [startDateDraft, setStartDateDraft] = React.useState(trip.startDate)
  const [endDateDraft, setEndDateDraft] = React.useState(trip.endDate)
  const [travelersDraft, setTravelersDraft] = React.useState(String(trip.travelers))

  React.useEffect(() => {
    if (!editOpen) return
    setDestinationDraft(trip.destination)
    setStartDateDraft(trip.startDate)
    setEndDateDraft(trip.endDate)
    setTravelersDraft(String(trip.travelers))
  }, [editOpen, trip.destination, trip.endDate, trip.startDate, trip.travelers])

  const handleSaveBasics = () => {
    const destination = destinationDraft.trim()
    const travelers = Number(travelersDraft)
    if (!destination) {
      toast.error("Destination is required.")
      return
    }
    if (!startDateDraft || !endDateDraft) {
      toast.error("Start and end date are required.")
      return
    }
    const start = new Date(`${startDateDraft}T00:00:00.000Z`)
    const end = new Date(`${endDateDraft}T00:00:00.000Z`)
    if (end < start) {
      toast.error("End date must be on or after start date.")
      return
    }
    if (!Number.isFinite(travelers) || travelers < 1) {
      toast.error("Travelers must be at least 1.")
      return
    }

    const totalDays = Math.max(
      1,
      Math.floor((end.getTime() - start.getTime()) / 86400000) + 1
    )
    updateTrip(trip.id, {
      destination,
      startDate: startDateDraft,
      endDate: endDateDraft,
      travelers,
      isGroupTrip: travelers > 1,
      totalDays,
    })
    toast.success("Trip details updated.")
    setEditOpen(false)
  }

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
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Edit Trip</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Trip Basics</DialogTitle>
                    <DialogDescription>
                      Update destination, dates, and traveler count.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Destination</label>
                      <Input
                        value={destinationDraft}
                        onChange={(event) => setDestinationDraft(event.target.value)}
                        placeholder="Destination"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Start date</label>
                        <Input
                          type="date"
                          value={startDateDraft}
                          onChange={(event) => setStartDateDraft(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">End date</label>
                        <Input
                          type="date"
                          value={endDateDraft}
                          onChange={(event) => setEndDateDraft(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Travelers</label>
                      <Input
                        type="number"
                        min="1"
                        value={travelersDraft}
                        onChange={(event) => setTravelersDraft(event.target.value)}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveBasics}>Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                {missing.map((item, index) => (
                  <li key={`${item}-${index}`}>• {item}</li>
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
