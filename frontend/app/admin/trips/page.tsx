"use client"

import { MapIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminStats } from "@/components/admin/use-admin-stats"

export default function AdminTripsPage() {
  const { data, loading, error } = useAdminStats()

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (error || !data) {
    return <p className="text-sm text-destructive">Failed to load: {error}</p>
  }

  const { recentTrips } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.counts.trips} total trip{data.counts.trips !== 1 ? "s" : ""} (read-only view).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapIcon className="size-4" />
            All Trips (most recent first)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrips.length === 0 ? (
            <p className="text-xs text-muted-foreground">No trips yet.</p>
          ) : (
            <div className="space-y-2">
              {recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{trip.destination}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {trip.start_date} → {trip.end_date} · {trip.total_days} day
                      {trip.total_days !== 1 ? "s" : ""} · {trip.travelers} traveler
                      {trip.travelers !== 1 ? "s" : ""}
                    </p>
                    <p className="mt-0.5 text-[10px] font-mono text-muted-foreground/60">
                      {trip.id}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {trip.travel_scope}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(trip.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
