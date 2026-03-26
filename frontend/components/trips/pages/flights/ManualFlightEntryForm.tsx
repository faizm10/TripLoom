"use client"

import { useState } from "react"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  PlaneIcon,
  LinkIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { saveTripFlightToSupabase } from "@/lib/supabase-trip-flights"
import type { SavedFlightChoice } from "./types"
import { cn } from "@/lib/utils"

const SOURCE_OPTIONS = [
  { value: "outbound", label: "Outbound" },
  { value: "inbound", label: "Return" },
  { value: "one_way", label: "One-way" },
] as const

type FlightSource = (typeof SOURCE_OPTIONS)[number]["value"]

type ManualDraft = {
  source: FlightSource
  route: string
  date: string
  departure: string
  arrival: string
  duration: string
  stops: string
  airline: string
  cost: string
  bookUrl: string
}

const EMPTY_DRAFT: ManualDraft = {
  source: "outbound",
  route: "",
  date: "",
  departure: "",
  arrival: "",
  duration: "",
  stops: "",
  airline: "",
  cost: "",
  bookUrl: "",
}

type Props = {
  tripId: string
  onFlightSaved: (flight: SavedFlightChoice) => void
}

export function ManualFlightEntryForm({ tripId, onFlightSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ManualDraft>(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)

  const update = (field: keyof ManualDraft, value: string) =>
    setDraft((prev) => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    const id = crypto.randomUUID()
    const payload = {
      id,
      source: draft.source,
      route: draft.route.trim(),
      date: draft.date,
      departure: draft.departure.trim(),
      arrival: draft.arrival.trim(),
      duration: draft.duration.trim(),
      stops: draft.stops.trim(),
      airline: draft.airline.trim(),
      cost: draft.cost.trim(),
      bookUrl: draft.bookUrl.trim() || undefined,
    }

    try {
      await saveTripFlightToSupabase(tripId, payload)
      onFlightSaved({ ...payload, bookUrl: payload.bookUrl ?? null })
      toast.success("Flight saved.")
      setDraft(EMPTY_DRAFT)
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save flight.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 rounded-sm"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <>
            <ChevronUpIcon className="size-3.5" />
            Hide manual entry
          </>
        ) : (
          <>
            <PlusIcon className="size-3.5" />
            Enter flight manually
          </>
        )}
      </Button>

      {open && (
        <Card className="mt-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PlaneIcon className="size-4" />
              Manual flight entry
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              All fields are optional — fill in only what you know.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Flight type */}
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <div className="flex flex-wrap gap-2">
                {SOURCE_OPTIONS.map(({ value, label }) => (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "rounded-sm",
                      draft.source === value && "border-primary bg-primary/10"
                    )}
                    onClick={() => update("source", value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Main fields grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Route"
                value={draft.route}
                onChange={(v) => update("route", v)}
                placeholder="e.g. JFK → LAX"
              />
              <Field
                label="Date"
                type="date"
                value={draft.date}
                onChange={(v) => update("date", v)}
              />
              <Field
                label="Airline"
                value={draft.airline}
                onChange={(v) => update("airline", v)}
                placeholder="e.g. Delta"
              />
              <Field
                label="Departs"
                value={draft.departure}
                onChange={(v) => update("departure", v)}
                placeholder="e.g. 09:30"
              />
              <Field
                label="Arrives"
                value={draft.arrival}
                onChange={(v) => update("arrival", v)}
                placeholder="e.g. 12:45"
              />
              <Field
                label="Duration"
                value={draft.duration}
                onChange={(v) => update("duration", v)}
                placeholder="e.g. 3h 15m"
              />
              <Field
                label="Stops"
                value={draft.stops}
                onChange={(v) => update("stops", v)}
                placeholder="e.g. Non-stop"
              />
              <Field
                label="Cost"
                value={draft.cost}
                onChange={(v) => update("cost", v)}
                placeholder="e.g. $450"
              />
            </div>

            {/* Book URL — full width */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <LinkIcon className="size-3" />
                Booking URL
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <input
                type="url"
                value={draft.bookUrl}
                onChange={(e) => update("bookUrl", e.target.value)}
                placeholder="https://…"
                className="border-input bg-background h-9 w-full rounded-sm border px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="rounded-sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save flight"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-sm"
                onClick={() => {
                  setDraft(EMPTY_DRAFT)
                  setOpen(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-input bg-background h-9 w-full rounded-sm border px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  )
}
