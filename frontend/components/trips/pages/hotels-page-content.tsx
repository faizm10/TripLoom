import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trip } from "@/lib/trips"

export function HotelsPageContent({ trip }: { trip: Trip }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader><CardTitle>Hotel Flow</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Search → filters → pick room → book.</p>
          <p>Show best area hints for first-time travelers.</p>
          <p>Current suggested area: {trip.hotelArea || "City center near transit"}.</p>
          <Button className="mt-2">Find Hotels</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Map Panel</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Right map is toggleable to compare distance to saved places.</p>
          <Button variant="outline">Toggle Map</Button>
        </CardContent>
      </Card>
    </div>
  )
}
