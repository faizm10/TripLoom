"use client"

import { ScrollTextIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminStats } from "@/components/admin/use-admin-stats"

export default function AdminAuditPage() {
  const { data, loading, error } = useAdminStats()

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }
  if (error || !data) {
    return <p className="text-sm text-destructive">Failed to load: {error}</p>
  }

  const { auditLogs } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI actions and system events (most recent first).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ScrollTextIcon className="size-4" />
            Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="space-y-2 py-8 text-center">
              <ScrollTextIcon className="mx-auto size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No audit entries yet.</p>
              <p className="text-xs text-muted-foreground/60">
                Entries will appear here as users interact with AI features.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2.5"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {entry.action}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground/60">
                      user: {entry.user_id}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground/60">
                      trip: {entry.trip_id}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
