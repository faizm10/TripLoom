import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trip } from "@/lib/trips"

export function ItineraryPageContent({ trip }: { trip: Trip }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Itinerary Modes</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-none">Timeline (Default)</Badge>
          <Badge variant="outline" className="rounded-none">Map Mode</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Day Planner</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{trip.itineraryDaysPlanned}/{trip.totalDays} days currently planned.</p>
          <div className="flex flex-wrap gap-2">
            <Button>Auto-fill Day</Button>
            <Button variant="outline">Optimize Route</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
