import type { Trip } from "@/lib/trips"

export type TripRow = {
  id: string
  destination: string
  start_date: string
  end_date: string
  timezone: string | null
  travelers?: number | null
  is_group_trip?: boolean | null
  total_days?: number | null
  created_at?: string
  updated_at?: string
}

function totalDaysFromRange(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff + 1)
}

export function tripFromRow(row: TripRow): Trip {
  const start = row.start_date
  const end = row.end_date
  const totalDays = totalDaysFromRange(start, end)
  const lastUpdated = row.updated_at ? row.updated_at.slice(0, 10) : new Date().toISOString().slice(0, 10)

  return {
    id: row.id,
    destination: row.destination,
    timezone: row.timezone ?? undefined,
    startDate: start,
    endDate: end,
    travelers: row.travelers ?? 1,
    isGroupTrip: row.is_group_trip ?? false,
    status: "planning",
    lastUpdated,
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
}
