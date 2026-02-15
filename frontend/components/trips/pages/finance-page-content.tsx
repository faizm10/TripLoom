import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trip } from "@/lib/trips"

export function FinancePageContent({ trip }: { trip: Trip }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Total + Split</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          ${trip.budgetTotal} total • ${trip.perPerson} per person
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Daily Budget Timeline</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          View spend progression by day and detect overages early.
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>FX Card</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You&apos;ll likely spend in destination currency. Rate movement alerts are enabled.
        </CardContent>
      </Card>
    </div>
  )
}
