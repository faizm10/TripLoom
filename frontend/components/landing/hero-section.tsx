import Link from "next/link"

import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-14 sm:px-10 sm:py-20">
      <div className="inline-flex items-center gap-3 rounded-sm border bg-card px-3 py-2">
        <span className="bg-primary text-primary-foreground inline-flex h-6 w-6 items-center justify-center text-sm font-bold">
          TL
        </span>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          TripLoom
        </p>
      </div>

      <p className="mt-8 text-xs font-medium tracking-widest text-muted-foreground uppercase">
        All-in-one travel platform
      </p>
      <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
        TripLoom makes travel planning one guided workflow.
      </h1>
      <p className="mt-6 max-w-3xl text-base text-muted-foreground sm:text-lg">
        We help first-time travelers search flights and hotels, build
        itineraries, route public transit, and manage group budgets in a single
        platform with clear, low-jargon decision support.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/dashboard">Open Dashboard</Link>
        </Button>
      </div>

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
  )
}
