"use client"

import * as React from "react"
import type { Trip } from "@/lib/trips"
import { getTrips } from "@/lib/trips"

const STORAGE_KEY = "triploom_trips"

function normalizeTransit(trip: Trip): Trip {
  const hasRoutes = Array.isArray(trip.transitRoutes)
  return {
    ...trip,
    transitSaved: hasRoutes ? (trip.transitRoutes?.length ?? 0) > 0 : trip.transitSaved,
  }
}

function loadTrips(): Trip[] {
  if (typeof window === "undefined") return getTrips()
  const defaults = getTrips()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Trip[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        const torontoDefault = defaults.find((t) => t.id === "toronto-spring")
        return parsed.map((t) =>
          normalizeTransit(
            t.id === "toronto-spring" && torontoDefault ? torontoDefault : t
          )
        )
      }
    }
  } catch {
    // ignore
  }
  return defaults.map(normalizeTransit)
}

function saveTrips(trips: Trip[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
  } catch {
    // ignore
  }
}

type TripsContextValue = {
  trips: Trip[]
  getTripById: (id: string) => Trip | undefined
  updateTrip: (id: string, partial: Partial<Trip>) => void
}

const TripsContext = React.createContext<TripsContextValue | null>(null)

export function TripsProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = React.useState<Trip[]>(getTrips)

  React.useEffect(() => {
    setTrips(loadTrips())
  }, [])

  React.useEffect(() => {
    saveTrips(trips)
  }, [trips])

  const getTripById = React.useCallback(
    (id: string) => trips.find((t) => t.id === id),
    [trips]
  )

  const updateTrip = React.useCallback(
    (id: string, partial: Partial<Trip>) => {
      setTrips((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t
          const merged: Trip = {
            ...t,
            ...partial,
            lastUpdated: new Date().toISOString().slice(0, 10),
          }
          return normalizeTransit(merged)
        })
      )
    },
    []
  )

  const value = React.useMemo(
    () => ({ trips, getTripById, updateTrip }),
    [trips, getTripById, updateTrip]
  )

  return (
    <TripsContext.Provider value={value}>{children}</TripsContext.Provider>
  )
}

export function useTrips(): Trip[] {
  const ctx = React.useContext(TripsContext)
  if (!ctx) return getTrips()
  return ctx.trips
}

export function useTrip(
  tripId: string,
  initialTrip: Trip | undefined
): Trip | undefined {
  const ctx = React.useContext(TripsContext)
  const fromStore = ctx?.getTripById(tripId)
  return fromStore ?? initialTrip
}

export function useUpdateTrip(): (id: string, partial: Partial<Trip>) => void {
  const ctx = React.useContext(TripsContext)
  return ctx?.updateTrip ?? (() => {})
}
