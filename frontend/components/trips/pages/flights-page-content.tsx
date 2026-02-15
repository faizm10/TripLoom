import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trip } from "@/lib/trips"

const tabs = ["Search", "Compare", "Passengers", "Payment", "Confirmation"]

export function FlightsPageContent({ trip }: { trip: Trip }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Flight Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab, index) => (
              <Badge key={tab} variant={index === 0 ? "secondary" : "outline"} className="rounded-none">
                {tab}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Search</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Trip type: one-way / round-trip / multi-city</p>
            <p>Results show best pick badge and two-line rationale (price, stops, baggage).</p>
            <p>Selecting an offer opens a comparison drawer so users stay in context.</p>
            <Button className="mt-2">Run Search</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Best Pick</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Based on your current trip setup for {trip.destination}.</p>
            <p>Balanced fare, baggage included, manageable layover window.</p>
            <Button variant="outline">Compare Offers</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
