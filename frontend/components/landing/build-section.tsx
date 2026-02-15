export function BuildSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
      <h2 className="text-2xl font-semibold sm:text-3xl">What We Build</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-sm border bg-card p-5">
          <h3 className="text-base font-medium">Flights + Hotels</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Duffel for one-way, round-trip, and multi-city booking. Booking.com
            Demand API for hotel availability and reservations.
          </p>
        </article>
        <article className="rounded-sm border bg-card p-5">
          <h3 className="text-base font-medium">Itinerary + Transit</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Day-by-day timeline planning with activity ordering and public transit
            routing via Google + Transitland fallback.
          </p>
        </article>
        <article className="rounded-sm border bg-card p-5">
          <h3 className="text-base font-medium">AI Assistant</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            GPT-4.1 planner for tradeoffs and itinerary generation, GPT-4.1 mini
            for fast interactions, optional GPT-4o for vision tasks.
          </p>
        </article>
        <article className="rounded-sm border bg-card p-5">
          <h3 className="text-base font-medium">Finance + Group Travel</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Multi-currency totals, split ledger, budget timeline, approvals, and
            role-based collaboration for group trips.
          </p>
        </article>
      </div>
    </section>
  )
}
