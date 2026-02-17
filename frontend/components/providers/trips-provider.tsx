"use client"

import * as React from "react"
import type {
  CreateTripInput,
  Trip,
  TripItineraryItem,
  TripExpense,
  TripFinance,
  TripFinanceAutomation,
} from "@/lib/trips"
import {
  coerceTripItineraryForTotalDays as coerceItinerary,
  computeItineraryDaysPlanned as computeDaysPlanned,
  getDestinationTimezone,
  getFinanceSummary,
  getTripFinance,
  getTripItineraryItems,
  getTrips,
  isFinanceComplete,
  runFinanceGuardrails,
} from "@/lib/trips"

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
        const germanyDefault = defaults.find((t) => t.id === "germany-spring")
        const tokyoDefault = defaults.find((t) => t.id === "tokyo-fall")
        return parsed.map((t) =>
          normalizeTransit(
            (t.id === "toronto-spring" || t.id === "germany-spring") && germanyDefault
              ? germanyDefault
              : t.id === "tokyo-fall" &&
                  tokyoDefault &&
                  (!Array.isArray(t.itineraryItems) || t.itineraryItems.length === 0)
                ? {
                    ...t,
                    itineraryItems: tokyoDefault.itineraryItems,
                    itineraryDaysPlanned: tokyoDefault.itineraryDaysPlanned,
                  }
                : t
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
  createTrip: (input: CreateTripInput) => Trip
  deleteTrip: (id: string) => void
  updateTrip: (id: string, partial: Partial<Trip>) => void
  setTripItineraryItems: (id: string, items: TripItineraryItem[]) => void
  addTripItineraryItem: (id: string, item: TripItineraryItem) => void
  updateTripItineraryItem: (
    id: string,
    itemId: string,
    patch: Partial<TripItineraryItem>
  ) => void
  deleteTripItineraryItem: (id: string, itemId: string) => void
  setTripBudget: (id: string, budgetTotal: number, currency: string) => void
  addTripExpense: (id: string, expense: TripExpense) => void
  updateTripExpense: (id: string, expenseId: string, patch: Partial<TripExpense>) => void
  deleteTripExpense: (id: string, expenseId: string) => void
  updateFinanceAutomation: (
    id: string,
    patch: Partial<TripFinanceAutomation>
  ) => void
  updateFinanceSettings: (
    id: string,
    patch: Partial<
      Pick<TripFinance, "currency" | "groupModeEnabled" | "groupSize" | "exchangeRates">
    >
  ) => void
  runFinanceAutomationCheck: (id: string) => void
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

  const createTrip = React.useCallback((input: CreateTripInput): Trip => {
    const today = new Date()
    const start = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    )

    if (input.dateMode === "weekend") {
      const day = start.getUTCDay()
      const offset = ((6 - day) + 7) % 7 || 7
      start.setUTCDate(start.getUTCDate() + offset)
    } else if (input.dateMode === "exact") {
      start.setUTCDate(start.getUTCDate() + 30)
    } else {
      start.setUTCDate(start.getUTCDate() + 45)
    }

    const totalDays = input.dateMode === "weekend" ? 3 : input.dateMode === "flexible" ? 10 : 7
    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + Math.max(1, totalDays - 1))

    const next: Trip = {
      id: input.id,
      destination: input.destination,
      timezone: getDestinationTimezone(input.destination),
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      travelers: input.travelers === "group" ? 2 : 1,
      isGroupTrip: input.travelers === "group",
      status: "planning",
      lastUpdated: new Date().toISOString().slice(0, 10),
      progress: 0,
      selectedFlights: false,
      selectedHotel: false,
      itineraryDaysPlanned: 0,
      itineraryItems: [],
      totalDays,
      transitSaved: false,
      transitRoutes: [],
      financeSet: false,
      approvalsPending: 0,
      budgetTotal: 0,
      perPerson: 0,
      activities: ["Trip created"],
    }

    setTrips((prev) => [next, ...prev.filter((trip) => trip.id !== next.id)])
    return next
  }, [])

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
          if (typeof partial.totalDays === "number" && Array.isArray(t.itineraryItems)) {
            merged.itineraryItems = coerceItinerary({
              ...merged,
              itineraryItems: t.itineraryItems,
            })
            merged.itineraryDaysPlanned = computeDaysPlanned(merged.itineraryItems)
          }
          return normalizeTransit(merged)
        })
      )
    },
    []
  )

  const setTripItineraryItems = React.useCallback((id: string, items: TripItineraryItem[]) => {
    setTrips((prev) =>
      prev.map((trip) => {
        if (trip.id !== id) return trip
        const normalized = coerceItinerary({ ...trip, itineraryItems: items })
        return {
          ...trip,
          itineraryItems: normalized,
          itineraryDaysPlanned: computeDaysPlanned(normalized),
          lastUpdated: new Date().toISOString().slice(0, 10),
        }
      })
    )
  }, [])

  const addTripItineraryItem = React.useCallback((id: string, item: TripItineraryItem) => {
    setTrips((prev) =>
      prev.map((trip) => {
        if (trip.id !== id) return trip
        const next = getTripItineraryItems({
          ...trip,
          itineraryItems: [...(trip.itineraryItems ?? []), item],
        })
        return {
          ...trip,
          itineraryItems: next,
          itineraryDaysPlanned: computeDaysPlanned(next),
          lastUpdated: new Date().toISOString().slice(0, 10),
        }
      })
    )
  }, [])

  const updateTripItineraryItem = React.useCallback(
    (id: string, itemId: string, patch: Partial<TripItineraryItem>) => {
      setTrips((prev) =>
        prev.map((trip) => {
          if (trip.id !== id) return trip
          const next = getTripItineraryItems({
            ...trip,
            itineraryItems: (trip.itineraryItems ?? []).map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    ...patch,
                    id: item.id,
                    tripId: item.tripId,
                    updatedAt: new Date().toISOString(),
                  }
                : item
            ),
          })
          return {
            ...trip,
            itineraryItems: next,
            itineraryDaysPlanned: computeDaysPlanned(next),
            lastUpdated: new Date().toISOString().slice(0, 10),
          }
        })
      )
    },
    []
  )

  const deleteTripItineraryItem = React.useCallback((id: string, itemId: string) => {
    setTrips((prev) =>
      prev.map((trip) => {
        if (trip.id !== id) return trip
        const next = getTripItineraryItems({
          ...trip,
          itineraryItems: (trip.itineraryItems ?? []).filter((item) => item.id !== itemId),
        })
        return {
          ...trip,
          itineraryItems: next,
          itineraryDaysPlanned: computeDaysPlanned(next),
          lastUpdated: new Date().toISOString().slice(0, 10),
        }
      })
    )
  }, [])

  const deleteTrip = React.useCallback((id: string) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== id))
  }, [])

  const withFinanceMirrors = React.useCallback((trip: Trip, finance: TripFinance): Trip => {
    const summary = getFinanceSummary({ ...trip, finance })
    return {
      ...trip,
      finance,
      budgetTotal: finance.budgetTotal,
      perPerson: summary.perPersonEstimate,
      financeSet: isFinanceComplete({ ...trip, finance }),
    }
  }, [])

  const maybeRunFinanceAutomation = React.useCallback((trip: Trip, finance: TripFinance): TripFinance => {
    if (!finance.automation.enabled) return finance
    const guardrail = runFinanceGuardrails({ ...trip, finance })
    return {
      ...finance,
      automation: {
        ...finance.automation,
        lastRunAt: new Date().toISOString(),
        lastStatus: guardrail.status,
      },
    }
  }, [])

  const updateTripFinance = React.useCallback(
    (
      id: string,
      updater: (trip: Trip, current: TripFinance) => TripFinance,
      options?: { runAutomation?: boolean }
    ) => {
      const shouldRunAutomation = options?.runAutomation ?? true
      setTrips((prev) =>
        prev.map((trip) => {
          if (trip.id !== id) return trip
          const current = getTripFinance(trip)
          let nextFinance = updater(trip, current)
          if (shouldRunAutomation) {
            nextFinance = maybeRunFinanceAutomation(trip, nextFinance)
          }
          const mirrored = withFinanceMirrors(trip, nextFinance)
          return {
            ...mirrored,
            lastUpdated: new Date().toISOString().slice(0, 10),
          }
        })
      )
    },
    [maybeRunFinanceAutomation, withFinanceMirrors]
  )

  const setTripBudget = React.useCallback(
    (id: string, budgetTotal: number, currency: string) => {
      const baseCurrency = (currency || "CAD").toUpperCase()
      updateTripFinance(id, (_trip, finance) => ({
        ...finance,
        budgetTotal: Math.max(0, budgetTotal),
        currency: baseCurrency,
        exchangeRates: {
          ...finance.exchangeRates,
          [baseCurrency]: 1,
        },
      }))
    },
    [updateTripFinance]
  )

  const addTripExpense = React.useCallback(
    (id: string, expense: TripExpense) => {
      updateTripFinance(id, (_trip, finance) => ({
        ...finance,
        expenses: [...finance.expenses, expense],
      }))
    },
    [updateTripFinance]
  )

  const updateTripExpense = React.useCallback(
    (id: string, expenseId: string, patch: Partial<TripExpense>) => {
      updateTripFinance(id, (_trip, finance) => ({
        ...finance,
        expenses: finance.expenses.map((expense) =>
          expense.id === expenseId
            ? {
                ...expense,
                ...patch,
                id: expense.id,
                tripId: expense.tripId,
                updatedAt: new Date().toISOString(),
              }
            : expense
        ),
      }))
    },
    [updateTripFinance]
  )

  const deleteTripExpense = React.useCallback(
    (id: string, expenseId: string) => {
      updateTripFinance(id, (_trip, finance) => ({
        ...finance,
        expenses: finance.expenses.filter((expense) => expense.id !== expenseId),
      }))
    },
    [updateTripFinance]
  )

  const updateFinanceAutomation = React.useCallback(
    (id: string, patch: Partial<TripFinanceAutomation>) => {
      updateTripFinance(
        id,
        (_trip, finance) => ({
          ...finance,
          automation: {
            ...finance.automation,
            ...patch,
          },
        }),
        { runAutomation: false }
      )
    },
    [updateTripFinance]
  )

  const updateFinanceSettings = React.useCallback(
    (
      id: string,
      patch: Partial<
        Pick<TripFinance, "currency" | "groupModeEnabled" | "groupSize" | "exchangeRates">
      >
    ) => {
      updateTripFinance(
        id,
        (_trip, finance) => ({
          ...finance,
          ...patch,
          currency: (patch.currency || finance.currency || "CAD").toUpperCase(),
          groupSize:
            patch.groupSize !== undefined
              ? Math.max(1, Math.floor(patch.groupSize))
              : finance.groupSize,
          exchangeRates: {
            ...finance.exchangeRates,
            ...(patch.exchangeRates || {}),
            [(patch.currency || finance.currency || "CAD").toUpperCase()]: 1,
          },
        }),
        { runAutomation: false }
      )
    },
    [updateTripFinance]
  )

  const runFinanceAutomationCheck = React.useCallback(
    (id: string) => {
      updateTripFinance(
        id,
        (_trip, finance) => ({
          ...finance,
        }),
        { runAutomation: true }
      )
    },
    [updateTripFinance]
  )

  const value = React.useMemo(
    () => ({
      trips,
      getTripById,
      createTrip,
      deleteTrip,
      updateTrip,
      setTripItineraryItems,
      addTripItineraryItem,
      updateTripItineraryItem,
      deleteTripItineraryItem,
      setTripBudget,
      addTripExpense,
      updateTripExpense,
      deleteTripExpense,
      updateFinanceAutomation,
      updateFinanceSettings,
      runFinanceAutomationCheck,
    }),
    [
      trips,
      getTripById,
      createTrip,
      deleteTrip,
      updateTrip,
      setTripItineraryItems,
      addTripItineraryItem,
      updateTripItineraryItem,
      deleteTripItineraryItem,
      setTripBudget,
      addTripExpense,
      updateTripExpense,
      deleteTripExpense,
      updateFinanceAutomation,
      updateFinanceSettings,
      runFinanceAutomationCheck,
    ]
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

export function useCreateTrip(): (input: CreateTripInput) => Trip {
  const ctx = React.useContext(TripsContext)
  return ctx?.createTrip ?? ((input: CreateTripInput) => ({
    id: input.id,
    destination: input.destination,
    timezone: "UTC",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    travelers: input.travelers === "group" ? 2 : 1,
    isGroupTrip: input.travelers === "group",
    status: "planning",
    lastUpdated: new Date().toISOString().slice(0, 10),
    progress: 0,
    selectedFlights: false,
    selectedHotel: false,
    itineraryDaysPlanned: 0,
    itineraryItems: [],
    totalDays: 1,
    transitSaved: false,
    transitRoutes: [],
    financeSet: false,
    approvalsPending: 0,
    budgetTotal: 0,
    perPerson: 0,
    activities: [],
  }))
}

export function useDeleteTrip(): (id: string) => void {
  const ctx = React.useContext(TripsContext)
  return ctx?.deleteTrip ?? (() => {})
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

export function useTripItineraryActions(): {
  setTripItineraryItems: (id: string, items: TripItineraryItem[]) => void
  addTripItineraryItem: (id: string, item: TripItineraryItem) => void
  updateTripItineraryItem: (
    id: string,
    itemId: string,
    patch: Partial<TripItineraryItem>
  ) => void
  deleteTripItineraryItem: (id: string, itemId: string) => void
} {
  const ctx = React.useContext(TripsContext)
  return {
    setTripItineraryItems: ctx?.setTripItineraryItems ?? (() => {}),
    addTripItineraryItem: ctx?.addTripItineraryItem ?? (() => {}),
    updateTripItineraryItem: ctx?.updateTripItineraryItem ?? (() => {}),
    deleteTripItineraryItem: ctx?.deleteTripItineraryItem ?? (() => {}),
  }
}

export function useTripFinanceActions(): {
  setTripBudget: (id: string, budgetTotal: number, currency: string) => void
  addTripExpense: (id: string, expense: TripExpense) => void
  updateTripExpense: (id: string, expenseId: string, patch: Partial<TripExpense>) => void
  deleteTripExpense: (id: string, expenseId: string) => void
  updateFinanceAutomation: (id: string, patch: Partial<TripFinanceAutomation>) => void
  updateFinanceSettings: (
    id: string,
    patch: Partial<
      Pick<TripFinance, "currency" | "groupModeEnabled" | "groupSize" | "exchangeRates">
    >
  ) => void
  runFinanceAutomationCheck: (id: string) => void
} {
  const ctx = React.useContext(TripsContext)
  return {
    setTripBudget: ctx?.setTripBudget ?? (() => {}),
    addTripExpense: ctx?.addTripExpense ?? (() => {}),
    updateTripExpense: ctx?.updateTripExpense ?? (() => {}),
    deleteTripExpense: ctx?.deleteTripExpense ?? (() => {}),
    updateFinanceAutomation: ctx?.updateFinanceAutomation ?? (() => {}),
    updateFinanceSettings: ctx?.updateFinanceSettings ?? (() => {}),
    runFinanceAutomationCheck: ctx?.runFinanceAutomationCheck ?? (() => {}),
  }
}
