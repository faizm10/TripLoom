"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useCreateTrip } from "@/components/providers/trips-provider"
import { cn } from "@/lib/utils"
import {
  clearNewTripDraft,
  loadNewTripDraft,
  saveNewTripDraft,
  type NewTripDraft,
} from "@/lib/new-trip-draft"
import { Button } from "@/components/ui/button"
import { DestinationSearch } from "@/components/dashboard-home/destination-search"

export function NewTripCard() {
  const router = useRouter()
  const createTrip = useCreateTrip()
  const [draft, setDraft] = useState<NewTripDraft>({
    destination: "",
    dateMode: "exact",
    travelers: "solo",
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setDraft(loadNewTripDraft())
    setHydrated(true)
  }, [])

  const update = (partial: Partial<NewTripDraft>) => {
    const next = { ...draft, ...partial }
    setDraft(next)
    saveNewTripDraft(next)
  }

  const handleCreateTrip = () => {
    const destination = draft.destination.trim()
    if (!destination) {
      toast.error("Enter a destination first.")
      return
    }

    const slug = destination
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    const id = `${slug || "trip"}-${Date.now().toString(36)}`

    const trip = createTrip({
      id,
      destination,
      dateMode: draft.dateMode,
      travelers: draft.travelers,
    })

    clearNewTripDraft()
    setDraft({
      destination: "",
      dateMode: "exact",
      travelers: "solo",
    })
    toast.success("Trip created.")
    router.push(`/trips/${trip.id}`)
  }

  return (
    <section className="rounded-sm border bg-card p-5 sm:p-6">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Plan a New Trip
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        Start in 20 seconds
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick destination, dates, and travelers. TripLoom builds your guided flow
        instantly.
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium">Destination</label>
          <DestinationSearch
            placeholder="Where do you want to go?"
            value={hydrated ? draft.destination : undefined}
            onChange={(value) => update({ destination: value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Date mode</label>
          <div className="grid grid-cols-3 gap-2">
            {(["exact", "weekend", "flexible"] as const).map((mode) => (
              <Button
                key={mode}
                variant="outline"
                size="sm"
                className={cn(
                  draft.dateMode === mode && "border-primary bg-primary/10"
                )}
                onClick={() => update({ dateMode: mode })}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Travelers</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                draft.travelers === "solo" && "border-primary bg-primary/10"
              )}
              onClick={() => update({ travelers: "solo" })}
            >
              Solo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                draft.travelers === "group" && "border-primary bg-primary/10"
              )}
              onClick={() => update({ travelers: "group" })}
            >
              Group
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Button onClick={handleCreateTrip}>Create Trip</Button>
      </div>
    </section>
  )
}
