"use client"

import * as React from "react"
import type {
  Trip,
  TripExpense,
  TripFinance,
  TripFinanceAutomation,
} from "@/lib/trips"
import {
  getFinanceSummary,
  getTripFinance,
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
      updateTrip,
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
      updateTrip,
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
