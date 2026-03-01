"use client"

import { CheckIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  deleteTripFlightFromSupabase,
  updateTripFlightInSupabase,
} from "@/lib/supabase-trip-flights"
import type { SavedFlightChoice } from "./types"

type Props = {
  tripId: string
  flights: SavedFlightChoice[]
  editingFlightId: string | null
  editingDate: string
  onFlightsChange: (flights: SavedFlightChoice[]) => void
  onEditingFlightIdChange: (id: string | null) => void
  onEditingDateChange: (date: string) => void
}

export function SavedFlightsCard({
  tripId,
  flights,
  editingFlightId,
  editingDate,
  onFlightsChange,
  onEditingFlightIdChange,
  onEditingDateChange,
}: Props) {
  if (flights.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckIcon className="size-4 text-green-600" />
          Your chosen flights
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Your saved flight(s) for this trip. Edit the date or remove if your
          plans change.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {flights.map((f) => (
          <div
            key={f.id}
            className="border-border flex flex-col gap-3 rounded-lg border bg-muted/30 p-4"
          >
            {editingFlightId === f.id ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium capitalize">{f.source}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{f.route}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{f.airline}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-medium">{f.cost}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-xs">Flight date</Label>
                  <input
                    type="date"
                    value={editingDate}
                    onChange={(e) => onEditingDateChange(e.target.value)}
                    className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                  />
                  <Button
                    size="sm"
                    className="rounded-md"
                    onClick={() => {
                      if (!editingDate.trim()) return
                      const newDate = editingDate.trim()
                      onFlightsChange(
                        flights.map((x) =>
                          x.id === f.id ? { ...x, date: newDate } : x
                        )
                      )
                      onEditingFlightIdChange(null)
                      onEditingDateChange("")
                      updateTripFlightInSupabase(tripId, f.id, { date: newDate })
                        .then(() => toast.success("Flight date updated."))
                        .catch((e) =>
                          toast.error(
                            e instanceof Error
                              ? e.message
                              : "Could not update flight in cloud."
                          )
                        )
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-md"
                    onClick={() => {
                      onEditingFlightIdChange(null)
                      onEditingDateChange("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium capitalize">
                        {f.source}
                      </span>
                      <span className="font-medium">{f.route}</span>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0 text-sm">
                      <span>{f.date}</span>
                      <span>
                        {f.departure} → {f.arrival}
                      </span>
                      <span>{f.duration}</span>
                      {f.stops && <span>{f.stops}</span>}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {f.airline} · {f.cost}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md gap-1"
                      onClick={() => {
                        onEditingFlightIdChange(f.id)
                        onEditingDateChange(f.date)
                      }}
                    >
                      <PencilIcon className="size-3.5" />
                      Edit date
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-md gap-1 text-destructive hover:text-destructive"
                      onClick={() => {
                        onFlightsChange(flights.filter((x) => x.id !== f.id))
                        deleteTripFlightFromSupabase(tripId, f.id).catch((e) =>
                          toast.error(
                            e instanceof Error
                              ? e.message
                              : "Could not remove flight from cloud."
                          )
                        )
                      }}
                    >
                      <Trash2Icon className="size-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
