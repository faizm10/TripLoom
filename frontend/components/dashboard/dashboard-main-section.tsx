"use client"

import { CompassIcon, HotelIcon, PlaneIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardMainSection({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <section className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{subtitle}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="border p-3">
                <p className="text-foreground text-xs font-medium uppercase">
                  Next action
                </p>
                <p className="mt-1">Continue setup and review recommendations.</p>
              </div>
              <div className="border p-3">
                <p className="text-foreground text-xs font-medium uppercase">
                  System note
                </p>
                <p className="mt-1">No authentication enabled for this dashboard build.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between border p-2">
              <span className="text-muted-foreground">Tasks</span>
              <span className="font-medium">6</span>
            </div>
            <div className="flex items-center justify-between border p-2">
              <span className="text-muted-foreground">Bookings</span>
              <span className="font-medium">2 pending</span>
            </div>
            <div className="flex items-center justify-between border p-2">
              <span className="text-muted-foreground">Budget status</span>
              <span className="font-medium">On track</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Button variant="outline" className="justify-start rounded-none">
              <SparklesIcon /> Plan My Day
            </Button>
            <Button variant="outline" className="justify-start rounded-none">
              <PlaneIcon /> Search Flights
            </Button>
            <Button variant="outline" className="justify-start rounded-none">
              <HotelIcon /> Find Hotels
            </Button>
            <Button variant="outline" className="justify-start rounded-none">
              <CompassIcon /> Explore Nearby
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
