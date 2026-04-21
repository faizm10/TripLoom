"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
import { cn } from "@/lib/utils"
import {
  createTripCollaboratorInviteAction,
  createTripViewShareLinkAction,
  getTripMemberRoleAction,
} from "@/lib/actions/trip-share-actions"
import { toPublicAbsoluteUrl } from "@/lib/public-site-url"
import type { Trip, TripTimelinePhase } from "@/lib/trips"
import {
  getDateRangeLabel,
  getMissingChecklist,
  getNextStep,
  getTripStatusLabel,
  getTripTimelinePhase,
  getTripTimelineSummary,
  getTripTravelScope,
} from "@/lib/trips"

const progressSteps = [
  "Trip Basics",
  "Flights",
  "Hotels",
  "Itinerary",
  "Transit",
  "Finance",
  "Ready",
]

/** Match dashboard trip list badges; includes text + background (not color-only). */
const STATUS_BADGE_CLASSES: Record<Trip["status"], string> = {
  planning: "bg-amber-100 text-amber-900 dark:bg-amber-900/35 dark:text-amber-200",
  booked: "bg-blue-100 text-blue-900 dark:bg-blue-900/35 dark:text-blue-200",
  in_progress: "bg-green-100 text-green-900 dark:bg-green-900/35 dark:text-green-200",
}

/** Left accent pairs with timeline copy so state is not conveyed by color alone. */
const PHASE_ACCENT: Record<TripTimelinePhase, string> = {
  upcoming: "border-l-sky-500",
  active: "border-l-emerald-600 dark:border-l-emerald-500",
  past: "border-l-muted-foreground",
}

function TripOverviewStatusBar({
  trip,
  nextStep,
}: {
  trip: Trip
  nextStep: ReturnType<typeof getNextStep>
}) {
  const phase = getTripTimelinePhase(trip)
  const timelineSummary = getTripTimelineSummary(trip)
  const statusLabel = getTripStatusLabel(trip.status)

  return (
    <section
      role="region"
      aria-label={`Trip status ${statusLabel}. ${timelineSummary}. Next step: ${nextStep.title}.`}
      className={cn(
        "rounded-lg border border-border bg-card/90 px-4 py-3 shadow-sm",
        "border-l-4",
        PHASE_ACCENT[phase]
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Badge
            className={cn("w-fit rounded-none font-medium", STATUS_BADGE_CLASSES[trip.status])}
          >
            {statusLabel}
          </Badge>
          <p className="text-sm text-muted-foreground">{timelineSummary}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-1 border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 lg:max-w-[min(100%,24rem)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Next step
          </p>
          <p className="text-sm font-medium leading-snug text-foreground">{nextStep.title}</p>
          <Button asChild size="sm" variant="outline" className="mt-1 w-full sm:mt-2 sm:w-fit">
            <Link href={nextStep.href}>{nextStep.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export function OverviewPageContent() {
  const trip = useTripPage()
  if (!trip) {
    return <p className="text-sm text-muted-foreground">Loading trip…</p>
  }
  return <OverviewPageBody trip={trip} />
}

function OverviewPageBody({ trip }: { trip: Trip }) {
  const router = useRouter()
  const pathname = usePathname()
  const prevPathRef = React.useRef<string | null>(null)
  const updateTrip = useUpdateTrip()
  const nextStep = getNextStep(trip)
  const missing = getMissingChecklist(trip)
  const [mounted, setMounted] = React.useState(false)
  const [myRole, setMyRole] = React.useState<"owner" | "editor" | "viewer" | null>(null)
  const [shareBusy, setShareBusy] = React.useState(false)
  const [inviteBusy, setInviteBusy] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [destinationDraft, setDestinationDraft] = React.useState(trip.destination)
  const [startDateDraft, setStartDateDraft] = React.useState(trip.startDate)
  const [endDateDraft, setEndDateDraft] = React.useState(trip.endDate)
  const [travelersDraft, setTravelersDraft] = React.useState(String(trip.travelers))

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    const prev = prevPathRef.current
    prevPathRef.current = pathname
    const overviewPath = `/trips/${trip.id}`
    const onOverview = pathname === overviewPath
    const fromTripSubPage =
      prev != null && prev.startsWith(`${overviewPath}/`) && pathname === overviewPath
    if (onOverview && fromTripSubPage) {
      router.refresh()
    }
  }, [pathname, router, trip.id])

  React.useEffect(() => {
    let cancelled = false
    void getTripMemberRoleAction(trip.id).then((role) => {
      if (!cancelled) setMyRole(role)
    })
    return () => {
      cancelled = true
    }
  }, [trip.id])

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

  const handleShareLink = async () => {
    if (myRole !== "owner") {
      toast.message("Only the trip owner can create a view-only link.", {
        description: `Ask the owner to share, or open Group if you own this trip.`,
      })
      return
    }
    setShareBusy(true)
    try {
      const { sharePath } = await createTripViewShareLinkAction(trip.id, { expiresInDays: null })
      const url = toPublicAbsoluteUrl(sharePath)
      await navigator.clipboard.writeText(url)
      toast.success("View-only link copied", {
        description: "Anyone with the link can view this trip without signing in.",
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create share link.")
    } finally {
      setShareBusy(false)
    }
  }

  const handleInviteLink = async () => {
    if (myRole !== "owner") {
      toast.message("Only the trip owner can create a collaborator invite.", {
        description: `Ask the owner to invite you, or open Group if you own this trip.`,
      })
      return
    }
    setInviteBusy(true)
    try {
      const { invitePath } = await createTripCollaboratorInviteAction(trip.id, {
        role: "editor",
        expiresInDays: 14,
      })
      const url = toPublicAbsoluteUrl(invitePath)
      await navigator.clipboard.writeText(url)
      toast.success("Collaborator invite copied", {
        description: "Recipients sign in and accept to edit this trip with you.",
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create invite.")
    } finally {
      setInviteBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <TripOverviewStatusBar trip={trip} nextStep={nextStep} />
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
              {mounted ? (
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
              ) : (
                <Button variant="outline" size="sm">Edit Trip</Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={shareBusy || myRole === null}
                title={
                  myRole !== "owner"
                    ? "Only the trip owner can create a view-only link"
                    : "Create a read-only link (no sign-in required)"
                }
                onClick={() => void handleShareLink()}
                className="touch-manipulation gap-1.5"
              >
                <Share2Icon className="size-3.5" />
                {shareBusy ? "…" : "Share"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={inviteBusy || myRole === null}
                title={
                  myRole !== "owner"
                    ? "Only the trip owner can invite collaborators"
                    : "Create an invite link for editors (sign-in required)"
                }
                onClick={() => void handleInviteLink()}
                className="touch-manipulation gap-1.5"
              >
                <UserPlusIcon className="size-3.5" />
                {inviteBusy ? "…" : "Invite"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {progressSteps.map((step, idx) => {
              const done = Math.floor((trip.progress / 100) * progressSteps.length) > idx
              return (
                <Badge key={step} variant={done ? "secondary" : "outline"} className="rounded-none">
                  {step}
                </Badge>
              )
            })}
          </div>
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

      <div
        className={cn(
          "grid gap-4 lg:grid-cols-2",
          getTripTravelScope(trip) === "domestic" ? "xl:grid-cols-5" : "xl:grid-cols-4"
        )}
      >
        <Card>
          <CardHeader><CardTitle>Flights</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {trip.selectedFlights ? trip.flightSummary || "Logged" : "No flights logged"}
          </CardContent>
        </Card>
        {getTripTravelScope(trip) === "domestic" ? (
          <Card>
            <CardHeader><CardTitle>Buses & trains</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {trip.selectedGroundTransport
                ? trip.groundTransportSummary || "Logged"
                : "None logged"}
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader><CardTitle>Stay</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {trip.selectedHotel ? trip.hotelSummary || trip.hotelArea || "Logged" : "No stays logged"}
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
