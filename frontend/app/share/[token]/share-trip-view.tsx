"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRightIcon,
  BedDoubleIcon,
  CheckSquare2Icon,
  GlobeIcon,
  MapPinIcon,
  PackageIcon,
  PlaneIcon,
  SquareIcon,
  TrainFrontIcon,
  UsersIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type {
  PublicFlightShare,
  PublicGroundShare,
  PublicHotelShare,
  PublicPackingShare,
  PublicTripSharePayload,
} from "@/lib/public-trip-share"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

function formatDateRange(start: string, end: string): string {
  try {
    const s = new Date(start + "T00:00:00")
    const e = new Date(end + "T00:00:00")
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
      return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.getDate()}, ${e.getFullYear()}`
    }
    return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`
  } catch {
    return `${start} → ${end}`
  }
}

function StatCard({
  icon: Icon,
  count,
  label,
  delay,
}: {
  icon: React.ElementType
  count: number
  label: string
  delay: number
}) {
  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={delay}
      className="flex items-center gap-3 border border-border bg-card/60 px-4 py-3 backdrop-blur-sm"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xl font-semibold tabular-nums text-foreground">{count}</p>
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
    </motion.article>
  )
}

function SectionHeading({
  icon: Icon,
  title,
  count,
  delay,
}: {
  icon: React.ElementType
  title: string
  count: number
  delay: number
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      custom={delay}
      className="flex items-center gap-2"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary/10 text-primary">
        <Icon className="size-3.5" />
      </div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <Badge variant="secondary" className="ml-1 text-[10px]">
        {count}
      </Badge>
    </motion.div>
  )
}

function FlightCard({ f, idx }: { f: PublicFlightShare; idx: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      custom={idx * 0.06}
      className="border border-border bg-card p-4 transition-colors hover:border-primary/20"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{f.route}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {f.airline}
            {f.flightNumber ? ` ${f.flightNumber}` : ""}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {f.date}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{f.departure}</span> → <span className="font-medium text-foreground">{f.arrival}</span>
        </span>
        {f.duration ? <span>{f.duration}</span> : null}
        {f.stops && f.stops !== "0" ? <span>{f.stops} stop{f.stops !== "1" ? "s" : ""}</span> : null}
      </div>
      {f.notes ? <p className="mt-2 text-xs italic text-muted-foreground">{f.notes}</p> : null}
    </motion.div>
  )
}

function GroundCard({ g, idx }: { g: PublicGroundShare; idx: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      custom={idx * 0.06}
      className="border border-border bg-card p-4 transition-colors hover:border-primary/20"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{g.route}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {g.operator}
            {g.serviceNumber ? ` ${g.serviceNumber}` : ""}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {g.travelDate}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{g.departure}</span> → <span className="font-medium text-foreground">{g.arrival}</span>
        </span>
        {g.duration ? <span>{g.duration}</span> : null}
      </div>
      {g.notes ? <p className="mt-2 text-xs italic text-muted-foreground">{g.notes}</p> : null}
    </motion.div>
  )
}

function HotelCard({ h, idx }: { h: PublicHotelShare; idx: number }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      custom={idx * 0.06}
      className="border border-border bg-card p-4 transition-colors hover:border-primary/20"
    >
      <p className="text-sm font-semibold text-foreground">{h.propertyName}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{h.area}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{h.checkIn}</span> → <span className="font-medium text-foreground">{h.checkOut}</span>
        </span>
      </div>
      {h.notes ? <p className="mt-2 text-xs italic text-muted-foreground">{h.notes}</p> : null}
    </motion.div>
  )
}

function sharePackingStorageKey(tripId: string): string {
  return `triploom:share-packing:${tripId}`
}

function PackingCard({ tripId, items }: { tripId: string; items: PublicPackingShare[] }) {
  const storageKey = sharePackingStorageKey(tripId)
  const [overrides, setOverrides] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setOverrides(parsed as Record<string, boolean>)
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, [storageKey])

  const isPacked = React.useCallback(
    (p: PublicPackingShare) => (p.id in overrides ? overrides[p.id] : p.isChecked),
    [overrides]
  )

  const toggle = React.useCallback(
    (p: PublicPackingShare) => {
      setOverrides((prev) => {
        const current = p.id in prev ? prev[p.id] : p.isChecked
        const next = { ...prev, [p.id]: !current }
        try {
          localStorage.setItem(storageKey, JSON.stringify(next))
        } catch {
          /* quota / private mode */
        }
        return next
      })
    },
    [storageKey]
  )

  const checkedCount = items.filter(isPacked).length

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      custom={0}
      className="border border-border bg-card p-4"
    >
      <p className="mb-1 text-xs text-muted-foreground">
        {checkedCount}/{items.length} packed
        <span className="text-muted-foreground/70"> · saved on this device</span>
      </p>
      <ul className="space-y-1">
        {items.map((p) => {
          const done = isPacked(p)
          return (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={done}
                aria-label={`${done ? "Packed" : "Not packed"}: ${p.label || "item"}`}
                onClick={() => toggle(p)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {done ? (
                  <CheckSquare2Icon className="size-4 shrink-0 text-primary" aria-hidden />
                ) : (
                  <SquareIcon className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
                )}
                <span className={done ? "text-muted-foreground line-through" : "text-foreground"}>
                  {p.label || "Item"}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

const POLL_MS = 12_000

function isPayload(v: unknown): v is PublicTripSharePayload {
  if (!v || typeof v !== "object") return false
  const o = v as Record<string, unknown>
  const trip = o.trip
  if (!trip || typeof trip !== "object") return false
  const id = (trip as { id?: unknown }).id
  return (
    typeof id === "string" &&
    Array.isArray(o.flights) &&
    Array.isArray(o.groundTrips) &&
    Array.isArray(o.hotels) &&
    Array.isArray(o.groupPacking)
  )
}

export function ShareTripView({
  initialData,
  shareToken,
}: {
  initialData: PublicTripSharePayload
  shareToken: string
}) {
  const [data, setData] = React.useState(initialData)
  const [linkInactive, setLinkInactive] = React.useState(false)
  const linkDeadRef = React.useRef(false)

  const refresh = React.useCallback(async () => {
    if (linkDeadRef.current) return
    try {
      const res = await fetch(`/api/share/${encodeURIComponent(shareToken)}`, {
        cache: "no-store",
      })
      if (res.status === 404) {
        linkDeadRef.current = true
        setLinkInactive(true)
        return
      }
      if (!res.ok) return
      const json: unknown = await res.json()
      if (isPayload(json)) {
        setData(json)
        setLinkInactive(false)
      }
    } catch {
      /* offline / transient */
    }
  }, [shareToken])

  React.useEffect(() => {
    setData(initialData)
    linkDeadRef.current = false
    setLinkInactive(false)
  }, [initialData])

  React.useEffect(() => {
    linkDeadRef.current = false
    setLinkInactive(false)
    const tick = window.setInterval(() => void refresh(), POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    document.addEventListener("visibilitychange", onVisible)
    void refresh()
    return () => {
      window.clearInterval(tick)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [refresh])

  const { trip, flights, groundTrips, hotels, groupPacking } = data

  const hasFlights = flights.length > 0
  const hasGround = groundTrips.length > 0
  const hasHotels = hotels.length > 0
  const hasPacking = trip.isGroupTrip && groupPacking.length > 0

  const statItems = [
    { icon: PlaneIcon, count: flights.length, label: "Flights" },
    { icon: TrainFrontIcon, count: groundTrips.length, label: "Ground trips" },
    { icon: BedDoubleIcon, count: hotels.length, label: "Stays" },
    { icon: PackageIcon, count: groupPacking.length, label: "Packing items" },
  ].filter((s) => s.count > 0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {linkInactive ? (
        <div
          role="alert"
          className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-xs text-destructive"
        >
          This share link is no longer available (revoked or expired). Showing the last loaded snapshot.
        </div>
      ) : null}
      {/* ───── Hero ───── */}
      <header className="relative overflow-hidden px-6 pb-12 pt-6 sm:px-10 sm:pb-16">
        {/* gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-1/4 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.71 0.13 215), oklch(0.61 0.11 222) 50%, transparent 80%)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 h-[300px] w-[350px] rounded-full opacity-10 blur-3xl"
            style={{
              background: "radial-gradient(circle, oklch(0.80 0.13 212), transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        {/* Top bar */}
        <motion.nav
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3"
        >
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
              TL
            </span>
            <span className="text-sm font-semibold tracking-tight">TripLoom</span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-primary/30 text-[10px] text-primary">
              View only
            </Badge>
            <Link
              href="/auth/login"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </motion.nav>

        {/* Headline */}
        <div className="mx-auto mt-10 max-w-5xl sm:mt-14">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.05}
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary"
          >
            Shared trip
          </motion.p>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.12}
            className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            {trip.destination}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.18}
            className="mt-3 text-base text-muted-foreground sm:text-lg"
          >
            {formatDateRange(trip.startDate, trip.endDate)}
            {trip.timezone ? ` · ${trip.timezone}` : ""}
          </motion.p>

          {/* Pill row */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.24}
            className="mt-5 flex flex-wrap gap-2"
          >
            <Badge variant="secondary" className="gap-1.5">
              <UsersIcon className="size-3" />
              {trip.travelers} traveler{trip.travelers !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              {trip.isGroupTrip ? <UsersIcon className="size-3" /> : <MapPinIcon className="size-3" />}
              {trip.isGroupTrip ? "Group trip" : "Solo trip"}
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <GlobeIcon className="size-3" />
              {trip.travelScope === "domestic" ? "Domestic" : "International"}
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              {trip.totalDays} day{trip.totalDays !== 1 ? "s" : ""}
            </Badge>
          </motion.div>
        </div>

        {/* Stat strip */}
        {statItems.length > 0 ? (
          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
            {statItems.map((s, i) => (
              <StatCard key={s.label} icon={s.icon} count={s.count} label={s.label} delay={0.32 + i * 0.06} />
            ))}
          </div>
        ) : null}
      </header>

      {/* ───── Content ───── */}
      <main className="mx-auto max-w-5xl space-y-10 px-6 pb-16 sm:px-10">
        {/* Flights */}
        {hasFlights ? (
          <section className="space-y-4">
            <SectionHeading icon={PlaneIcon} title="Flights" count={flights.length} delay={0} />
            <div className="grid gap-3 sm:grid-cols-2">
              {flights.map((f, i) => (
                <FlightCard key={f.id} f={f} idx={i} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Ground transport */}
        {hasGround ? (
          <section className="space-y-4">
            <SectionHeading icon={TrainFrontIcon} title="Ground transport" count={groundTrips.length} delay={0} />
            <div className="grid gap-3 sm:grid-cols-2">
              {groundTrips.map((g, i) => (
                <GroundCard key={g.id} g={g} idx={i} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Stays */}
        {hasHotels ? (
          <section className="space-y-4">
            <SectionHeading icon={BedDoubleIcon} title="Stays" count={hotels.length} delay={0} />
            <div className="grid gap-3 sm:grid-cols-2">
              {hotels.map((h, i) => (
                <HotelCard key={h.id} h={h} idx={i} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Group packing */}
        {hasPacking ? (
          <section className="space-y-4">
            <SectionHeading icon={PackageIcon} title="Group packing" count={groupPacking.length} delay={0} />
            <PackingCard tripId={trip.id} items={groupPacking} />
          </section>
        ) : null}
      </main>

      {/* ───── Footer CTA ───── */}
      <motion.footer
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        custom={0.1}
        className="border-t border-primary bg-primary px-6 py-8 text-primary-foreground sm:px-10"
      >
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Want to collaborate on this trip?</p>
            <p className="mt-1 text-xs opacity-80">
              Sign in and ask the owner for a collaborator invite to edit the itinerary, add flights, and more.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm" className="shrink-0 group">
            <Link href="/auth/login">
              Sign in to TripLoom
              <ArrowRightIcon className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </motion.footer>
    </div>
  )
}
