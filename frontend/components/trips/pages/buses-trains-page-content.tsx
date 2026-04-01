"use client"

import * as React from "react"
import Link from "next/link"
import { PencilIcon, PlusIcon, TrainFrontIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { useUpdateTrip } from "@/components/providers/trips-provider"
import { useTripPage } from "@/components/trips/trip-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getTripFlightsFromSupabase } from "@/lib/supabase-trip-flights"
import {
  deleteTripGroundFromSupabase,
  getTripGroundTripsFromSupabase,
  saveTripGroundToSupabase,
  type GroundLegType,
  type SavedGroundTripRow,
} from "@/lib/supabase-trip-ground"
import { itineraryWithTransportSummary } from "@/lib/trip-flight-itinerary-sync"
import { summarizeFlights, summarizeGroundTrips } from "@/lib/trip-manual-details"
import type { Trip } from "@/lib/trips"
import { getTripTravelScope } from "@/lib/trips"

const LEG_OPTIONS: Array<{ value: GroundLegType; label: string }> = [
  { value: "outbound", label: "Outbound" },
  { value: "inbound", label: "Inbound" },
  { value: "one_way", label: "One-way" },
  { value: "other", label: "Other" },
]

type GroundFormState = Omit<SavedGroundTripRow, "id">

function createEmptyGroundForm(trip: Trip): GroundFormState {
  return {
    source: "outbound",
    route: "",
    date: trip.startDate || "",
    departure: "",
    arrival: "",
    duration: "",
    operator: "",
    serviceNumber: "",
    cost: "",
    notes: "",
  }
}

function sortGround(rows: SavedGroundTripRow[]): SavedGroundTripRow[] {
  return [...rows].sort((a, b) => {
    const dateCmp = (b.date || "").localeCompare(a.date || "")
    if (dateCmp !== 0) return dateCmp
    return a.route.localeCompare(b.route)
  })
}

export function BusesTrainsPageContent() {
  const trip = useTripPage()
  if (!trip) {
    return <p className="text-sm text-muted-foreground">Loading trip…</p>
  }
  if (getTripTravelScope(trip) !== "domestic") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Buses & trains is only for trips marked as within your country. This trip is set to international
          travel.
        </p>
        <Button asChild variant="outline">
          <Link href={`/trips/${trip.id}/flights`}>Go to Flights</Link>
        </Button>
      </div>
    )
  }
  return <BusesTrainsPageBody trip={trip} />
}

function BusesTrainsPageBody({ trip }: { trip: Trip }) {
  const updateTrip = useUpdateTrip()
  const [entries, setEntries] = React.useState<SavedGroundTripRow[]>([])
  const [form, setForm] = React.useState<GroundFormState>(() => createEmptyGroundForm(trip))
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const syncTrip = React.useCallback(
    async (nextGround: SavedGroundTripRow[]) => {
      const flights = await getTripFlightsFromSupabase(trip.id)
      const { itineraryItems, itineraryDaysPlanned } = itineraryWithTransportSummary(
        trip,
        flights,
        nextGround
      )
      updateTrip(trip.id, {
        selectedFlights: flights.length > 0,
        selectedGroundTransport: nextGround.length > 0,
        flightSummary: summarizeFlights(flights),
        groundTransportSummary: summarizeGroundTrips(nextGround),
        itineraryItems,
        itineraryDaysPlanned,
      })
    },
    [trip, updateTrip]
  )

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    getTripGroundTripsFromSupabase(trip.id)
      .then((rows) => {
        if (cancelled) return
        const next = sortGround(rows)
        setEntries(next)
        void syncTrip(next)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [trip.id, syncTrip])

  React.useEffect(() => {
    if (!editingId) {
      setForm(createEmptyGroundForm(trip))
    }
  }, [editingId, trip])

  const updateForm = <K extends keyof GroundFormState>(key: K, value: GroundFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(createEmptyGroundForm(trip))
  }

  const handleSave = async () => {
    if (!form.route.trim()) {
      toast.error("Route is required.")
      return
    }
    if (!form.date.trim()) {
      toast.error("Travel date is required.")
      return
    }

    const nextEntry: SavedGroundTripRow = {
      id: editingId ?? `${trip.id}:ground:${Date.now()}`,
      source: form.source,
      route: form.route.trim(),
      date: form.date.trim(),
      departure: form.departure.trim(),
      arrival: form.arrival.trim(),
      duration: form.duration.trim(),
      operator: form.operator.trim(),
      serviceNumber: form.serviceNumber.trim().toUpperCase(),
      cost: form.cost.trim(),
      notes: form.notes.trim(),
    }

    setSaving(true)
    try {
      await saveTripGroundToSupabase(trip.id, nextEntry)
      const nextEntries = sortGround(
        editingId
          ? entries.map((e) => (e.id === editingId ? nextEntry : e))
          : [nextEntry, ...entries]
      )
      setEntries(nextEntries)
      void syncTrip(nextEntries)
      resetForm()
      toast.success(editingId ? "Trip updated." : "Trip added.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (entry: SavedGroundTripRow) => {
    setEditingId(entry.id)
    setForm({
      source: entry.source,
      route: entry.route,
      date: entry.date,
      departure: entry.departure,
      arrival: entry.arrival,
      duration: entry.duration,
      operator: entry.operator,
      serviceNumber: entry.serviceNumber,
      cost: entry.cost,
      notes: entry.notes,
    })
  }

  const handleDelete = async (id: string) => {
    const nextEntries = entries.filter((e) => e.id !== id)
    setEntries(nextEntries)
    void syncTrip(nextEntries)
    if (editingId === id) resetForm()
    try {
      await deleteTripGroundFromSupabase(trip.id, id)
      toast.success("Removed.")
    } catch (error) {
      setEntries(entries)
      void syncTrip(entries)
      toast.error(error instanceof Error ? error.message : "Could not remove.")
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Log bus and train legs for domestic travel. You can also use{" "}
        <Link href={`/trips/${trip.id}/flights`} className="text-primary font-medium underline-offset-4 hover:underline">
          Flights
        </Link>{" "}
        — at least one type is needed for your plan.
      </p>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrainFrontIcon className="size-4" />
              Bus & train log
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Routes, operators, and times in one place—similar to the flight log.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-none">
            {entries.length} saved
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ground-source">Leg type</Label>
            <select
              id="ground-source"
              value={form.source}
              onChange={(e) => updateForm("source", e.target.value as GroundLegType)}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              {LEG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground-route">Route</Label>
            <Input
              id="ground-route"
              value={form.route}
              onChange={(e) => updateForm("route", e.target.value)}
              placeholder="Toronto → Montreal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground-date">Date</Label>
            <Input
              id="ground-date"
              type="date"
              value={form.date}
              onChange={(e) => updateForm("date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground-operator">Operator</Label>
            <Input
              id="ground-operator"
              value={form.operator}
              onChange={(e) => updateForm("operator", e.target.value)}
              placeholder="VIA Rail, Greyhound…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground-service">Train/bus number</Label>
            <Input
              id="ground-service"
              value={form.serviceNumber}
              onChange={(e) => updateForm("serviceNumber", e.target.value.toUpperCase())}
              placeholder="62"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground-cost">Cost</Label>
            <Input
              id="ground-cost"
              value={form.cost}
              onChange={(e) => updateForm("cost", e.target.value)}
              placeholder="CAD 89"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground-dep">Departure time</Label>
            <Input
              id="ground-dep"
              value={form.departure}
              onChange={(e) => updateForm("departure", e.target.value)}
              placeholder="08:30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground-arr">Arrival time</Label>
            <Input
              id="ground-arr"
              value={form.arrival}
              onChange={(e) => updateForm("arrival", e.target.value)}
              placeholder="14:05"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground-duration">Duration</Label>
            <Input
              id="ground-duration"
              value={form.duration}
              onChange={(e) => updateForm("duration", e.target.value)}
              placeholder="5h 35m"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="ground-notes">Notes</Label>
            <Textarea
              id="ground-notes"
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              placeholder="Seat, platform, confirmation…"
              rows={3}
            />
          </div>
          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <Button onClick={() => void handleSave()} disabled={saving}>
              <PlusIcon className="size-4" />
              {saving ? "Saving…" : editingId ? "Update" : "Add leg"}
            </Button>
            {editingId ? (
              <Button variant="outline" onClick={resetForm} disabled={saving}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Saved legs</h2>
        {loading ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">Loading…</CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No bus or train trips logged yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-none capitalize">
                          {entry.source.replace("_", " ")}
                        </Badge>
                        <p className="text-base font-semibold">{entry.route}</p>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>{entry.date || "No date"}</span>
                        {entry.operator ? <span>{entry.operator}</span> : null}
                        {entry.serviceNumber ? <span>{entry.serviceNumber}</span> : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(entry)}>
                        <PencilIcon className="size-3.5" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void handleDelete(entry.id)}>
                        <Trash2Icon className="size-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide">Departure</p>
                      <p className="mt-1 text-foreground">{entry.departure || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Arrival</p>
                      <p className="mt-1 text-foreground">{entry.arrival || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Duration</p>
                      <p className="mt-1 text-foreground">{entry.duration || "—"}</p>
                    </div>
                  </div>
                  {entry.cost ? (
                    <div className="border-t pt-4 text-sm">
                      <span className="text-muted-foreground">Cost</span>
                      <p className="mt-1 font-medium">{entry.cost}</p>
                    </div>
                  ) : null}
                  {entry.notes ? (
                    <div className="border-t pt-4 text-sm text-muted-foreground">
                      <p className="text-xs uppercase tracking-wide">Notes</p>
                      <p className="mt-2 whitespace-pre-wrap text-foreground">{entry.notes}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
