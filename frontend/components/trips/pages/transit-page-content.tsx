import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trip } from "@/lib/trips"

export function TransitPageContent({ trip }: { trip: Trip }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Transit Routing</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Choose a day and route between itinerary points.</p>
          <p>Saved routes: {trip.transitSaved ? "Available" : "Not saved yet"}.</p>
          <p className="text-xs">Small note shown if alternate routing fallback is used.</p>
          <Button>Save This Route</Button>
        </CardContent>
      </Card>
    </div>
  )
}
