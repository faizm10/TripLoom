"use client"

import * as React from "react"

export type AdminCounts = {
  trips: number
  users: number
  flights: number
  hotels: number
  itineraryItems: number
  packingItems: number
}

export type AdminTrip = {
  id: string
  destination: string
  start_date: string
  end_date: string
  total_days: number
  travelers: number
  travel_scope: string
  created_at: string
}

export type AdminUser = {
  user_id: string
  country_code: string
  updated_at: string
  email: string
  name: string
  provider: string
  created_at: string
}

export type AdminAuditEntry = {
  id: string
  user_id: string
  trip_id: string
  action: string
  created_at: string
}

export type AdminStats = {
  counts: AdminCounts
  recentTrips: AdminTrip[]
  recentUsers: AdminUser[]
  auditLogs: AdminAuditEntry[]
}

export function useAdminStats() {
  const [data, setData] = React.useState<AdminStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<AdminStats>
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
