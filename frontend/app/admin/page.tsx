"use client"

import {
  BarChart3Icon,
  BedDoubleIcon,
  CalendarDaysIcon,
  MapIcon,
  PackageIcon,
  PlaneIcon,
  UsersIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminStats } from "@/components/admin/use-admin-stats"

export default function AdminOverviewPage() {
  const { data, loading, error } = useAdminStats()

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading admin data…</p>
  }
  if (error || !data) {
    return <p className="text-sm text-destructive">Failed to load: {error}</p>
  }

  const { counts, recentTrips, recentUsers } = data

  const metrics = [
    { label: "Total Trips", value: counts.trips, icon: MapIcon },
    { label: "Users", value: counts.users, icon: UsersIcon },
    { label: "Flights Logged", value: counts.flights, icon: PlaneIcon },
    { label: "Hotel Stays", value: counts.hotels, icon: BedDoubleIcon },
    { label: "Itinerary Items", value: counts.itineraryItems, icon: CalendarDaysIcon },
    { label: "Packing Items", value: counts.packingItems, icon: PackageIcon },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform health at a glance.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <m.icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapIcon className="size-4" />
              Recent Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTrips.length === 0 ? (
              <p className="text-xs text-muted-foreground">No trips yet.</p>
            ) : (
              <div className="space-y-2">
                {recentTrips.slice(0, 10).map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {trip.destination}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {trip.start_date} → {trip.end_date} · {trip.total_days}d ·{" "}
                        {trip.travelers} pax
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {trip.travel_scope}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <UsersIcon className="size-4" />
              Recent Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No users yet.</p>
            ) : (
              <div className="space-y-2">
                {recentUsers.slice(0, 10).map((u) => (
                  <div
                    key={u.user_id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {u.name || u.email || u.user_id}
                      </p>
                      {u.email && u.name && (
                        <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {u.provider}
                      </Badge>
                      {u.country_code && (
                        <Badge variant="outline" className="text-[10px]">
                          {u.country_code}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
