export function WhySection() {
  return (
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
  )
}
