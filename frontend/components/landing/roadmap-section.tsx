const milestones = [
  "Foundation: auth, profiles, group model, and base navigation.",
  "Flights: Duffel offer requests, listing, selection, and booking.",
  "Hotels: search, availability, booking, and itinerary merge.",
  "Planning: timeline builder and automatic place suggestions.",
  "Transit: Google Directions with Transitland fallback.",
  "AI: GPT-4.1 planner, GPT-4.1 mini quick chat, optional GPT-4o vision.",
  "Finance + Group: split ledger, budget timeline, FX alerts, approvals.",
  "Polish: Framer Motion interactions, accessibility, and performance pass.",
]

export function RoadmapSection() {
  return (
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
  )
}
