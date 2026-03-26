"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  CalendarCheckIcon,
  CalendarRangeIcon,
  CalendarSearchIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"

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

const DATE_MODES = [
  { value: "exact" as const, label: "Exact", icon: CalendarCheckIcon },
  { value: "weekend" as const, label: "Weekend", icon: CalendarRangeIcon },
  { value: "flexible" as const, label: "Flexible", icon: CalendarSearchIcon },
]

const TRAVELER_MODES = [
  { value: "solo" as const, label: "Solo", icon: UserIcon },
  { value: "group" as const, label: "Group", icon: UsersIcon },
]

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
    setDraft({ destination: "", dateMode: "exact", travelers: "solo" })
    toast.success("Trip created.")
    router.push(`/trips/${trip.id}`)
  }

  return (
    <section className="rounded-sm border bg-card p-5 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Where to?</h1>

      <div className="mt-4 space-y-3">
        <DestinationSearch
          placeholder="Search destination…"
          value={hydrated ? draft.destination : undefined}
          onChange={(value) => update({ destination: value })}
        />

        <div className="flex flex-wrap gap-2">
          {DATE_MODES.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="outline"
              size="sm"
              className={cn(
                "gap-1.5",
                draft.dateMode === value && "border-primary bg-primary/10"
              )}
              onClick={() => update({ dateMode: value })}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          ))}

          <div className="mx-1 border-l" />

          {TRAVELER_MODES.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="outline"
              size="sm"
              className={cn(
                "gap-1.5",
                draft.travelers === value && "border-primary bg-primary/10"
              )}
              onClick={() => update({ travelers: value })}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          ))}
        </div>

        <Button className="w-full sm:w-auto" onClick={handleCreateTrip}>
          Create Trip
        </Button>
      </div>
    </section>
  )
}
