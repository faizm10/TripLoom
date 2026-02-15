export default function Page() {
  const milestones = [
    "Foundation: auth, profiles, group model, and base navigation.",
    "Flights: Duffel offer requests, listing, selection, and booking.",
    "Hotels: search, availability, booking, and itinerary merge.",
    "Planning: timeline builder and automatic place suggestions.",
    "Transit: Google Directions with Transitland fallback.",
    "AI: GPT-4.1 planner, GPT-4.1 mini quick chat, optional GPT-4o vision.",
    "Finance + Group: split ledger, budget timeline, FX alerts, approvals.",
    "Polish: Framer Motion interactions, accessibility, and performance pass.",
  ];

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-5xl px-6 py-14 sm:px-10 sm:py-20">
        <div className="inline-flex items-center gap-3 rounded-sm border bg-card px-3 py-2">
          <span className="inline-flex h-6 w-6 items-center justify-center bg-primary text-sm font-bold text-primary-foreground">
            Y
          </span>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Startup Style Landing
          </p>
        </div>

        <p className="mt-8 text-xs font-medium tracking-widest text-muted-foreground uppercase">
          All-in-one travel platform
        </p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Travel planning is fragmented. We make it one guided workflow.
        </h1>
        <p className="mt-6 max-w-3xl text-base text-muted-foreground sm:text-lg">
          We help first-time travelers search flights and hotels, build itineraries,
          route public transit, and manage group budgets in a single product with
          clear, low-jargon decision support.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <article className="rounded-sm border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">Audience</p>
            <p className="mt-2 text-sm font-medium">First-time travelers</p>
          </article>
          <article className="rounded-sm border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">Approach</p>
            <p className="mt-2 text-sm font-medium">Step-by-step trip flow</p>
          </article>
          <article className="rounded-sm border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase">Focus</p>
            <p className="mt-2 text-sm font-medium">Clarity over complexity</p>
          </article>
        </div>
      </section>

      <div className="mx-auto h-px w-1/2 border-t border-dotted border-border" />

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

      <div className="mx-auto h-px w-1/2 border-t border-dotted border-border" />

      <section className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
        <h2 className="text-2xl font-semibold sm:text-3xl">Why This Works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-sm border bg-card p-5">
            <h3 className="text-sm font-semibold uppercase">Simple flow</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Search to select to confirm, designed for beginners.
            </p>
          </article>
          <article className="rounded-sm border bg-card p-5">
            <h3 className="text-sm font-semibold uppercase">Clear tradeoffs</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Explain price, time, baggage, and stops in plain language.
            </p>
          </article>
          <article className="rounded-sm border bg-card p-5">
            <h3 className="text-sm font-semibold uppercase">Single workspace</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Booking, planning, routing, and budgeting in one place.
            </p>
          </article>
        </div>
      </section>

      <div className="mx-auto h-px w-1/2 border-t border-dotted border-border" />

      <section className="mx-auto max-w-5xl px-6 py-14 sm:px-10 sm:pb-20">
        <h2 className="text-2xl font-semibold sm:text-3xl">Build Roadmap</h2>
        <ol className="mt-6 space-y-3">
          {milestones.map((item, index) => (
            <li key={item} className="rounded-sm border bg-card p-4 text-sm">
              <span className="mr-2 font-medium text-foreground">{index + 1}.</span>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-sm border bg-primary px-5 py-5 text-primary-foreground">
          <p className="text-sm font-medium">
            Goal: become the default trip operating system for first-time
            travelers.
          </p>
        </div>
      </section>
    </main>
  );
}
