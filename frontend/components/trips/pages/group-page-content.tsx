import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trip } from "@/lib/trips"

export function GroupPageContent({ trip }: { trip: Trip }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Members + Roles</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Owner, editor, and viewer controls for shared trip decisions.
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Approvals Queue</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Pending votes: <Badge className="rounded-none" variant="secondary">{trip.approvalsPending}</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Split Rules</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Configure equal/custom splits for each booking.
        </CardContent>
      </Card>
    </div>
  )
}
