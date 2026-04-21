"use client"

import * as React from "react"
import { BedDoubleIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
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
  deleteTripHotelStayFromSupabase,
  getTripHotelStaysFromSupabase,
  saveTripHotelStayToSupabase,
  sumHotelStayNights,
  type TripHotelStay,
} from "@/lib/supabase-trip-hotels"
import { formatMonthDayYear } from "@/lib/date-display"
import { summarizeHotels } from "@/lib/trip-manual-details"
import type { Trip } from "@/lib/trips"

type HotelFormState = Omit<TripHotelStay, "id">

function createEmptyHotelForm(trip: Trip): HotelFormState {
  return {
    propertyName: "",
    area: "",
    checkIn: trip.startDate || "",
    checkOut: trip.endDate || "",
    addressNote: "",
    totalCost: "",
    currency: "CAD",
    notes: "",
  }
}

function sortStays(stays: TripHotelStay[]): TripHotelStay[] {
  return [...stays].sort((a, b) => (a.checkIn || "").localeCompare(b.checkIn || ""))
}

export function HotelsPageContent() {
  const trip = useTripPage()
  if (!trip) {
    return <p className="text-sm text-muted-foreground">Loading trip…</p>
  }
  return <HotelsPageBody trip={trip} />
}

function HotelsPageBody({ trip }: { trip: Trip }) {
  const updateTrip = useUpdateTrip()
  const [stays, setStays] = React.useState<TripHotelStay[]>([])
  const [form, setForm] = React.useState<HotelFormState>(() => createEmptyHotelForm(trip))
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const syncTrip = React.useCallback(
    (nextStays: TripHotelStay[]) => {
      updateTrip(trip.id, {
        selectedHotel: nextStays.length > 0,
        hotelSummary: summarizeHotels(nextStays),
        hotelArea: nextStays[0]?.area || undefined,
        hotelNightsBooked: sumHotelStayNights(nextStays),
      })
    },
    [trip.id, updateTrip]
  )

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    getTripHotelStaysFromSupabase(trip.id)
      .then((rows) => {
        if (cancelled) return
        const nextStays = sortStays(rows)
        setStays(nextStays)
        syncTrip(nextStays)
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
      setForm(createEmptyHotelForm(trip))
    }
  }, [editingId, trip])

  const updateForm = <K extends keyof HotelFormState>(key: K, value: HotelFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(createEmptyHotelForm(trip))
  }

  const handleSave = async () => {
    if (!form.propertyName.trim()) {
      toast.error("Property name is required.")
      return
    }
    if (!form.checkIn.trim() || !form.checkOut.trim()) {
      toast.error("Check-in and check-out are required.")
      return
    }

    const nextStay: TripHotelStay = {
      id: editingId ?? `${trip.id}:hotel:${Date.now()}`,
      propertyName: form.propertyName.trim(),
      area: form.area.trim(),
      checkIn: form.checkIn.trim(),
      checkOut: form.checkOut.trim(),
      addressNote: form.addressNote.trim(),
      totalCost: form.totalCost.trim(),
      currency: form.currency.trim().toUpperCase() || "CAD",
      notes: form.notes.trim(),
    }

    setSaving(true)
    try {
      await saveTripHotelStayToSupabase(trip.id, nextStay)
      const nextStays = sortStays(
        editingId
          ? stays.map((stay) => (stay.id === editingId ? nextStay : stay))
          : [...stays, nextStay]
      )
      setStays(nextStays)
      syncTrip(nextStays)
      resetForm()
      toast.success(editingId ? "Stay updated." : "Stay added.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save stay.")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (stay: TripHotelStay) => {
    setEditingId(stay.id)
    setForm({
      propertyName: stay.propertyName,
      area: stay.area,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      addressNote: stay.addressNote,
      totalCost: stay.totalCost,
      currency: stay.currency,
      notes: stay.notes,
    })
  }

  const handleDelete = async (id: string) => {
    const nextStays = stays.filter((stay) => stay.id !== id)
    setStays(nextStays)
    syncTrip(nextStays)
    if (editingId === id) resetForm()

    try {
      await deleteTripHotelStayFromSupabase(trip.id, id)
      toast.success("Stay removed.")
    } catch (error) {
      setStays(stays)
      syncTrip(stays)
      toast.error(error instanceof Error ? error.message : "Could not remove stay.")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BedDoubleIcon className="size-4" />
              Manual stay log
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Add one or more stays with just the details you actually need later.
            </p>
          </div>
          <Badge variant="secondary" className="rounded-none">
            {stays.length} saved
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hotel-name">Property name</Label>
            <Input
              id="hotel-name"
              value={form.propertyName}
              onChange={(event) => updateForm("propertyName", event.target.value)}
              placeholder="The Hoxton Shoreditch"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hotel-area">Area / neighborhood</Label>
            <Input
              id="hotel-area"
              value={form.area}
              onChange={(event) => updateForm("area", event.target.value)}
              placeholder="Shoreditch"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hotel-checkin">Check-in</Label>
            <Input
              id="hotel-checkin"
              type="date"
              value={form.checkIn}
              onChange={(event) => updateForm("checkIn", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hotel-checkout">Check-out</Label>
            <Input
              id="hotel-checkout"
              type="date"
              value={form.checkOut}
              onChange={(event) => updateForm("checkOut", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hotel-cost">Total cost</Label>
            <Input
              id="hotel-cost"
              value={form.totalCost}
              onChange={(event) => updateForm("totalCost", event.target.value)}
              placeholder="920"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hotel-currency">Currency</Label>
            <Input
              id="hotel-currency"
              value={form.currency}
              onChange={(event) => updateForm("currency", event.target.value.toUpperCase())}
              placeholder="CAD"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="hotel-address">Address / location note</Label>
            <Input
              id="hotel-address"
              value={form.addressNote}
              onChange={(event) => updateForm("addressNote", event.target.value)}
              placeholder="81 Great Eastern St, close to Old Street station"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="hotel-notes">Notes</Label>
            <Textarea
              id="hotel-notes"
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              placeholder="Late check-in, confirmation number, room preference"
              rows={3}
            />
          </div>
          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <Button onClick={handleSave} disabled={saving}>
              <PlusIcon className="size-4" />
              {saving ? "Saving..." : editingId ? "Update stay" : "Add stay"}
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
          <h2 className="text-sm font-semibold">Saved stays</h2>
          <p className="text-sm text-muted-foreground">Multiple stays are supported for multi-city trips.</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">Loading saved stays…</CardContent>
          </Card>
        ) : stays.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No stays logged yet. Add your first stay above.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {stays.map((stay) => (
              <Card key={stay.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-none">
                          Stay
                        </Badge>
                        <p className="text-base font-semibold">{stay.propertyName}</p>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        {stay.area ? <span>{stay.area}</span> : null}
                        <span>
                          {formatMonthDayYear(stay.checkIn)} {"->"} {formatMonthDayYear(stay.checkOut)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(stay)}>
                        <PencilIcon className="size-3.5" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void handleDelete(stay.id)}>
                        <Trash2Icon className="size-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide">Check-in</p>
                      <p className="mt-1 text-foreground">{stay.checkIn ? formatMonthDayYear(stay.checkIn) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Check-out</p>
                      <p className="mt-1 text-foreground">{stay.checkOut ? formatMonthDayYear(stay.checkOut) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Cost</p>
                      <p className="mt-1 text-foreground">
                        {stay.totalCost ? `${stay.currency} ${stay.totalCost}` : "—"}
                      </p>
                    </div>
                  </div>

                  {stay.addressNote ? (
                    <div className="border-t pt-4 text-sm">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Location note</p>
                      <p className="mt-2 text-foreground">{stay.addressNote}</p>
                    </div>
                  ) : null}

                  {stay.notes ? (
                    <div className="border-t pt-4 text-sm text-muted-foreground">
                      <p className="text-xs uppercase tracking-wide">Notes</p>
                      <p className="mt-2 whitespace-pre-wrap text-foreground">{stay.notes}</p>
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
