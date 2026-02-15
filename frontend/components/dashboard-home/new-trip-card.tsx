import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewTripCard() {
  return (
    <section className="rounded-sm border bg-card p-5 sm:p-6">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Plan a New Trip
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        Start in 20 seconds
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick destination, dates, and travelers. TripLoom builds your guided flow instantly.
      </p>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium">Destination</label>
          <Input placeholder="Where do you want to go?" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Date mode</label>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm">Exact</Button>
            <Button variant="outline" size="sm">Weekend</Button>
            <Button variant="outline" size="sm">Flexible</Button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Travelers</label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">Solo</Button>
            <Button variant="outline" size="sm">Group</Button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Button>Create Trip</Button>
      </div>
    </section>
  )
}
