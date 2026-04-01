"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CalendarCheck, CalendarRange, CalendarSearch, User, Users } from "lucide-react"

import { useCreateTrip } from "@/components/providers/trips-provider"
import { cn } from "@/lib/utils"
import {
  clearNewTripDraft,
  loadNewTripDraft,
  saveNewTripDraft,
  type NewTripDraft,
} from "@/lib/new-trip-draft"
import { Button } from "@/components/ui/button"
import {
  DestinationSearch,
  type DestinationSuggestion,
} from "@/components/dashboard-home/destination-search"
import { Label } from "@/components/ui/label"
import { ISO_COUNTRIES } from "@/lib/iso-countries"
import { getUserProfileFromSupabase, upsertUserCountryInSupabase } from "@/lib/supabase-profile"
import {
  computeTravelScope,
  resolveDestinationCountryCode,
} from "@/lib/infer-travel-scope"

const DATE_MODES = [
  { value: "exact", icon: CalendarCheck, label: "Exact" },
  { value: "weekend", icon: CalendarRange, label: "Weekend" },
  { value: "flexible", icon: CalendarSearch, label: "Flexible" },
] as const

const TRAVELER_MODES = [
  { value: "solo", icon: User, label: "Solo" },
  { value: "group", icon: Users, label: "Group" },
] as const

export function NewTripCard() {
  const router = useRouter()
  const createTrip = useCreateTrip()
  const [draft, setDraft] = useState<NewTripDraft>({
    destination: "",
    dateMode: "exact",
    travelers: "solo",
  })
  const [hydrated, setHydrated] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [residenceCode, setResidenceCode] = useState("")
  const [setupCountry, setSetupCountry] = useState("")
  const [savingResidence, setSavingResidence] = useState(false)

  const pickedDestinationRef = useRef<Pick<
    DestinationSuggestion,
    "displayName" | "countryCode"
  > | null>(null)

  useEffect(() => {
    const fromStorage = loadNewTripDraft()
    setDraft(fromStorage)
    setHydrated(true)
    void getUserProfileFromSupabase().then((profile) => {
      const code = profile?.country_code?.trim().toUpperCase() ?? ""
      setResidenceCode(code)
      setProfileLoaded(true)
    })
  }, [])

  const update = (partial: Partial<NewTripDraft>) => {
    const next = { ...draft, ...partial }
    setDraft(next)
    saveNewTripDraft(next)
  }

  const handleContinueResidence = async () => {
    const code = setupCountry.trim().toUpperCase()
    if (!code) {
      toast.error("Select your country of residence.")
      return
    }
    setSavingResidence(true)
    try {
      await upsertUserCountryInSupabase(code)
      setResidenceCode(code)
    } catch (e) {
      toast.error("Could not save country to your profile.", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSavingResidence(false)
    }
  }

  const handleCreateTrip = () => {
    const country = residenceCode.trim().toUpperCase()
    if (!country) {
      toast.error("Set your country of residence first.")
      return
    }

    const destination = draft.destination.trim()
    if (!destination) {
      toast.error("Enter a destination first.")
      return
    }

    const destCountry = resolveDestinationCountryCode(
      destination,
      pickedDestinationRef.current
    )
    const travelScope = computeTravelScope(country, destCountry)

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
      travelScope,
    })

    clearNewTripDraft()
    const nextDraft: NewTripDraft = {
      destination: "",
      dateMode: "exact",
      travelers: "solo",
    }
    saveNewTripDraft(nextDraft)
    setDraft(nextDraft)
    pickedDestinationRef.current = null
    toast.success("Trip created.")
    router.push(`/trips/${trip.id}`)
  }

  if (!profileLoaded) {
    return (
      <section className="rounded-sm border bg-card p-5 sm:p-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-10 w-full max-w-md animate-pulse rounded bg-muted" />
      </section>
    )
  }

  if (!residenceCode) {
    return (
      <section className="rounded-sm border bg-card p-5 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your country of residence so we can tailor domestic trips (ground transport) and
          keep your profile consistent.
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="country-setup">Country of residence</Label>
          <select
            id="country-setup"
            value={setupCountry}
            onChange={(e) => setSetupCountry(e.target.value)}
            className="border-input bg-background h-10 w-full max-w-md rounded-md border px-3 text-sm"
          >
            <option value="">Select country…</option>
            {ISO_COUNTRIES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          <Button disabled={savingResidence} onClick={() => void handleContinueResidence()}>
            {savingResidence ? "Saving…" : "Continue"}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-sm border bg-card p-5 sm:p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Where to?</h1>

      <div className="mt-4">
        <DestinationSearch
          placeholder="Search a destination…"
          value={hydrated ? draft.destination : undefined}
          onChange={(value) => {
            const p = pickedDestinationRef.current
            if (p && value.trim() !== p.displayName.trim()) {
              pickedDestinationRef.current = null
            }
            update({ destination: value })
          }}
          onSelect={(s) => {
            pickedDestinationRef.current = {
              displayName: s.displayName,
              countryCode: s.countryCode,
            }
            update({ destination: s.displayName })
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {DATE_MODES.map(({ value, icon: Icon, label }) => (
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

        <div className="mx-1 h-4 w-px bg-border" />

        {TRAVELER_MODES.map(({ value, icon: Icon, label }) => (
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

        <Button className="ml-auto" onClick={handleCreateTrip}>
          Plan Trip
        </Button>
      </div>
    </section>
  )
}
