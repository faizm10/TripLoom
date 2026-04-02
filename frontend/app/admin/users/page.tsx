"use client"

import { UsersIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminStats } from "@/components/admin/use-admin-stats"

export default function AdminUsersPage() {
  const { data, loading, error } = useAdminStats()

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (error || !data) {
    return <p className="text-sm text-destructive">Failed to load: {error}</p>
  }

  const { recentUsers } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.counts.users} total user{data.counts.users !== 1 ? "s" : ""} (read-only view).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <UsersIcon className="size-4" />
            Recent Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {recentUsers.map((u) => (
                <div
                  key={u.user_id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {u.name || u.email || u.user_id}
                    </p>
                    {u.email && (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{u.email}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"} · Last active {new Date(u.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {u.provider}
                    </Badge>
                    {u.country_code ? (
                      <Badge variant="outline" className="text-[10px]">
                        {u.country_code}
                      </Badge>
                    ) : null}
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
