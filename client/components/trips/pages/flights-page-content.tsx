"use client"

import * as React from "react"
import Link from "next/link"
import { PencilIcon, PlaneIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { useUpdateTrip } from "@/components/providers/trips-provider"
import { useTripPage } from "@/components/trips/trip-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteTripFlightFromSupabase,
  getTripFlightsFromSupabase,
  saveTripFlightToSupabase,
  type FlightLegType,
  type FlightStopDetail,
  type SavedFlightRow,
} from "@/lib/supabase-trip-flights"
import { getTripGroundTripsFromSupabase } from "@/lib/supabase-trip-ground"
import { itineraryWithTransportSummary } from "@/lib/trip-flight-itinerary-sync"
import { summarizeFlights, summarizeGroundTrips } from "@/lib/trip-manual-details"
import type { Trip } from "@/lib/trips"
import { getTripTravelScope } from "@/lib/trips"
import {
  coerceToCanonicalTime12h,
  formatTime12hForDisplay,
  isCanonicalTime12h,
} from "@/lib/time-12h"
import { Time12hFields } from "@/components/trips/time-12h-fields"

const LEG_OPTIONS: Array<{ value: FlightLegType; label: string }> = [
  { value: "outbound", label: "Outbound" },
  { value: "inbound", label: "Inbound" },
  { value: "one_way", label: "One-way" },
  { value: "internal", label: "Internal" },
  { value: "other", label: "Other" },
]

type FlightFormState = Omit<SavedFlightRow, "id">

function createEmptyFlightForm(trip: Trip): FlightFormState {
  return {
    source: "outbound",
    route: "",
    date: trip.startDate || "",
    departure: "",
    arrival: "",
    duration: "",
    stops: "",
    airline: "",
    flightNumber: "",
    cost: "",
    notes: "",
    stopDetails: [],
  }
}

function sortFlights(flights: SavedFlightRow[]): SavedFlightRow[] {
  return [...flights].sort((a, b) => {
    const dateCmp = (b.date || "").localeCompare(a.date || "")
    if (dateCmp !== 0) return dateCmp
    return a.route.localeCompare(b.route)
  })
}

function summarizeStops(stopDetails: FlightStopDetail[]): string {
  if (stopDetails.length === 0) return "Non-stop"
  if (stopDetails.length === 1) return "1 stop"
  return `${stopDetails.length} stops`
}

function describeVia(stopDetails: FlightStopDetail[]): string | null {
  const airports = stopDetails.map((stop) => stop.airport.trim()).filter(Boolean)
  if (airports.length === 0) return null
  return `via ${airports.join(", ")}`
}

export function FlightsPageContent() {
  const trip = useTripPage()
  if (!trip) {
    return <p className="text-sm text-muted-foreground">Loading trip…</p>
  }
  return <FlightsPageBody trip={trip} />
}

function FlightsPageBody({ trip }: { trip: Trip }) {
  const updateTrip = useUpdateTrip()
  const [entries, setEntries] = React.useState<SavedFlightRow[]>([])
  const [form, setForm] = React.useState<FlightFormState>(() => createEmptyFlightForm(trip))
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const tripRef = React.useRef(trip)
  React.useEffect(() => {
    tripRef.current = trip
  }, [trip])

  const syncTrip = React.useCallback(async (nextEntries: SavedFlightRow[]) => {
    const t = tripRef.current
    const ground =
      getTripTravelScope(t) === "domestic"
        ? await getTripGroundTripsFromSupabase(t.id)
        : []
    const { itineraryItems, itineraryDaysPlanned } = itineraryWithTransportSummary(
      t,
      nextEntries,
      ground
    )
    updateTrip(t.id, {
      selectedFlights: nextEntries.length > 0,
      selectedGroundTransport: ground.length > 0,
      flightSummary: summarizeFlights(nextEntries),
      groundTransportSummary: summarizeGroundTrips(ground),
      itineraryItems,
      itineraryDaysPlanned,
    })
  }, [updateTrip])

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    getTripFlightsFromSupabase(trip.id)
      .then((rows) => {
        if (cancelled) return
        const nextEntries = sortFlights(rows)
        setEntries(nextEntries)
        void syncTrip(nextEntries)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [trip.id, syncTrip])

  const prevEditingIdRef = React.useRef<string | null>(editingId)
  React.useEffect(() => {
    const wasEditing = prevEditingIdRef.current != null
    const nowEditing = editingId != null
    if (wasEditing && !nowEditing) {
      setForm(createEmptyFlightForm(tripRef.current))
    }
    prevEditingIdRef.current = editingId
  }, [editingId])

  const updateForm = <K extends keyof FlightFormState>(key: K, value: FlightFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addStopDetail = () => {
    setForm((prev) => ({
      ...prev,
      stopDetails: [...prev.stopDetails, { airport: "", layover: "" }],
    }))
  }

  const updateStopDetail = (index: number, key: keyof FlightStopDetail, value: string) => {
    setForm((prev) => ({
      ...prev,
      stopDetails: prev.stopDetails.map((stop, currentIndex) =>
        currentIndex === index ? { ...stop, [key]: value } : stop
      ),
    }))
  }

  const removeStopDetail = (index: number) => {
    setForm((prev) => ({
      ...prev,
      stopDetails: prev.stopDetails.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(createEmptyFlightForm(tripRef.current))
  }

  const handleSave = async () => {
    if (!form.route.trim()) {
      toast.error("Route is required.")
      return
    }
    if (!form.date.trim()) {
      toast.error("Flight date is required.")
      return
    }

    const departure = form.departure.trim()
    const arrival = form.arrival.trim()
    if (departure && !isCanonicalTime12h(departure)) {
      toast.error("Departure time is incomplete. Choose hour, minute, and AM or PM.")
      return
    }
    if (arrival && !isCanonicalTime12h(arrival)) {
      toast.error("Arrival time is incomplete. Choose hour, minute, and AM or PM.")
      return
    }

    const normalizedStopDetails = form.stopDetails
      .map((stop) => ({
        airport: stop.airport.trim().toUpperCase(),
        layover: stop.layover.trim(),
      }))
      .filter((stop) => stop.airport || stop.layover)

    const nextEntry: SavedFlightRow = {
      id: editingId ?? `${trip.id}:flight:${Date.now()}`,
      source: form.source,
      route: form.route.trim(),
      date: form.date.trim(),
      departure,
      arrival,
      duration: form.duration.trim(),
      stops: normalizedStopDetails.length > 0 ? summarizeStops(normalizedStopDetails) : form.stops.trim() || "Non-stop",
      airline: form.airline.trim(),
      flightNumber: form.flightNumber.trim().toUpperCase(),
      cost: form.cost.trim(),
      notes: form.notes.trim(),
      stopDetails: normalizedStopDetails,
    }

    setSaving(true)
    try {
      await saveTripFlightToSupabase(trip.id, nextEntry)
      const nextEntries = sortFlights(
        editingId
          ? entries.map((entry) => (entry.id === editingId ? nextEntry : entry))
          : [nextEntry, ...entries]
      )
      setEntries(nextEntries)
      void syncTrip(nextEntries)
      resetForm()
      toast.success(editingId ? "Flight updated." : "Flight added.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save flight.")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (entry: SavedFlightRow) => {
    setEditingId(entry.id)
    setForm({
      source: entry.source,
      route: entry.route,
      date: entry.date,
      departure: coerceToCanonicalTime12h(entry.departure),
      arrival: coerceToCanonicalTime12h(entry.arrival),
      duration: entry.duration,
      stops: entry.stops,
      airline: entry.airline,
      flightNumber: entry.flightNumber,
      cost: entry.cost,
      notes: entry.notes,
      stopDetails: entry.stopDetails,
    })
  }

  const handleDelete = async (id: string) => {
    const nextEntries = entries.filter((entry) => entry.id !== id)
    setEntries(nextEntries)
    void syncTrip(nextEntries)
    if (editingId === id) resetForm()

    try {
      await deleteTripFlightFromSupabase(trip.id, id)
      toast.success("Flight removed.")
    } catch (error) {
      setEntries(entries)
      void syncTrip(entries)
      toast.error(error instanceof Error ? error.message : "Could not remove flight.")
    }
  }

  return (
    <div className="space-y-6">
      {getTripTravelScope(trip) === "domestic" ? (
        <p className="text-sm text-muted-foreground">
          Domestic trip — you can log flights here, or use{" "}
          <Link href={`/trips/${trip.id}/buses-trains`} className="text-primary font-medium underline-offset-4 hover:underline">
            Buses & trains
          </Link>{" "}
          for rail and bus; either counts toward your travel plan.
        </p>
      ) : null}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PlaneIcon className="size-4" />
              Manual flight log
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep routes, stops, layovers, and flight references together without a search flow.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-none">
            {entries.length} saved
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="flight-source">Leg type</Label>
            <select
              id="flight-source"
              value={form.source}
              onChange={(event) => updateForm("source", event.target.value as FlightLegType)}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              {LEG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="flight-route">Route</Label>
            <Input
              id="flight-route"
              value={form.route}
              onChange={(event) => updateForm("route", event.target.value)}
              placeholder="YYZ -> BER"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flight-date">Date</Label>
            <Input
              id="flight-date"
              type="date"
              value={form.date}
              onChange={(event) => updateForm("date", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flight-number">Flight number</Label>
            <Input
              id="flight-number"
              value={form.flightNumber}
              onChange={(event) => updateForm("flightNumber", event.target.value.toUpperCase())}
              placeholder="AC856"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flight-airline">Airline</Label>
            <Input
              id="flight-airline"
              value={form.airline}
              onChange={(event) => updateForm("airline", event.target.value)}
              placeholder="Air Canada"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flight-cost">Cost</Label>
            <Input
              id="flight-cost"
              value={form.cost}
              onChange={(event) => updateForm("cost", event.target.value)}
              placeholder="CAD 842"
            />
          </div>
          <Time12hFields
            id="flight-departure"
            label="Departure time"
            value={form.departure}
            onChange={(v) => updateForm("departure", v)}
            disabled={saving}
          />
          <Time12hFields
            id="flight-arrival"
            label="Arrival time"
            value={form.arrival}
            onChange={(v) => updateForm("arrival", v)}
            disabled={saving}
          />
          <div className="space-y-2">
            <Label htmlFor="flight-duration">Duration</Label>
            <Input
              id="flight-duration"
              value={form.duration}
              onChange={(event) => updateForm("duration", event.target.value)}
              placeholder="7h 40m"
            />
          </div>
          <div className="space-y-2">
            <Label>Stop summary</Label>
            <div className="border-input bg-muted/40 flex h-10 items-center rounded-md border px-3 text-sm text-muted-foreground">
              {summarizeStops(form.stopDetails)}
              {describeVia(form.stopDetails) ? (
                <span className="ml-2 truncate text-foreground">{describeVia(form.stopDetails)}</span>
              ) : null}
            </div>
          </div>
          <div className="space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Stops and layovers</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add each connection airport and layover, for example MUC with a 1h 40m layover.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addStopDetail}>
                <PlusIcon className="size-4" />
                Add stop
              </Button>
            </div>

            {form.stopDetails.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No stops added. Leave this empty for non-stop flights.
              </div>
            ) : (
              <div className="space-y-3">
                {form.stopDetails.map((stop, index) => (
                  <div
                    key={`${editingId ?? "new"}-stop-${index}`}
                    className="grid gap-3 rounded-md border p-4 lg:grid-cols-[1fr_1fr_auto]"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`flight-stop-airport-${index}`}>Connection airport</Label>
                      <Input
                        id={`flight-stop-airport-${index}`}
                        value={stop.airport}
                        onChange={(event) => updateStopDetail(index, "airport", event.target.value)}
                        placeholder="MUC"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`flight-stop-layover-${index}`}>Layover</Label>
                      <Input
                        id={`flight-stop-layover-${index}`}
                        value={stop.layover}
                        onChange={(event) => updateStopDetail(index, "layover", event.target.value)}
                        placeholder="1h 40m"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="button" variant="ghost" onClick={() => removeStopDetail(index)}>
                        <Trash2Icon className="size-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="flight-notes">Notes</Label>
            <Textarea
              id="flight-notes"
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              placeholder="Seat, baggage, terminal, or reminder"
              rows={3}
            />
          </div>
          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <Button onClick={handleSave} disabled={saving}>
              <PlusIcon className="size-4" />
              {saving ? "Saving..." : editingId ? "Update flight" : "Add flight"}
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Saved flights</h2>
          <p className="text-sm text-muted-foreground">Compact cards, quick edits, no booking clutter.</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">Loading saved flights…</CardContent>
          </Card>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No flights logged yet. Add your first leg above.
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
                        {describeVia(entry.stopDetails) ? (
                          <span className="text-sm text-muted-foreground">{describeVia(entry.stopDetails)}</span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>{entry.date || "No date"}</span>
                        {entry.airline ? <span>{entry.airline}</span> : null}
                        {entry.flightNumber ? <span>{entry.flightNumber}</span> : null}
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

                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide">Departure</p>
                      <p className="mt-1 font-mono text-foreground">
                        {formatTime12hForDisplay(entry.departure)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Arrival</p>
                      <p className="mt-1 font-mono text-foreground">
                        {formatTime12hForDisplay(entry.arrival)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Duration</p>
                      <p className="mt-1 text-foreground">{entry.duration || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Stops</p>
                      <p className="mt-1 text-foreground">{entry.stops || "—"}</p>
                    </div>
                  </div>

                  {entry.stopDetails.length > 0 ? (
                    <div className="border-t pt-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Connections</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {entry.stopDetails.map((stop, index) => (
                          <div key={`${entry.id}-stop-${index}`} className="rounded-md border bg-muted/20 p-3 text-sm">
                            <p className="font-medium text-foreground">{stop.airport || `Stop ${index + 1}`}</p>
                            <p className="mt-1 text-muted-foreground">
                              {stop.layover ? `${stop.layover} layover` : "Layover time not added"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

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
