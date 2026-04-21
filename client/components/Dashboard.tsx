"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NewTripCard } from "@/components/dashboard-home/new-trip-card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useDeleteTrip, useTrips } from "@/components/providers/trips-provider"
import { getDateRangeLabel, getTripStatusLabel, getTripsByTimeline, type Trip } from "@/lib/trips"
import { AvatarStack, Brand, TripCover } from "./Shared"
import { Icon } from "./Icon"

type TripFilter = "all" | "current" | "upcoming" | "past"

type TripRow = {
  trip: Trip
  when: string
  year: string
  status: string
  days: number
  people: number
  plannedItems: number
  tag: string
  seed: number
  subtitle: string
}

const d: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "248px 1fr",
    background: "var(--bg)",
  },
  side: {
    background: "var(--panel)",
    borderRight: "1px solid var(--hair)",
    padding: "18px 14px",
    display: "flex",
    flexDirection: "column",
  },
  sideTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 6px 16px",
  },
  main: {
    overflow: "auto",
    padding: "40px 56px 80px",
  },
  header: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 48,
    paddingBottom: 24,
    borderBottom: "1px solid var(--hair)",
  },
  h1: {
    fontFamily: "var(--f-display)",
    fontSize: 48,
    letterSpacing: "-0.02em",
    margin: 0,
  },
  sub: {
    color: "var(--ink-3)",
    marginTop: 6,
    fontSize: 14,
  },
  search: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    background: "var(--card)",
    boxShadow: "inset 0 0 0 1px var(--hair)",
    borderRadius: 6,
    color: "var(--ink-3)",
    marginBottom: 14,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "44px 2.4fr 1.1fr 1fr 1fr 140px",
    alignItems: "center",
    gap: 16,
    padding: "18px 4px",
    borderBottom: "1px solid var(--hair)",
    transition: "background 120ms ease",
  },
  colHead: {
    color: "var(--ink-3)",
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    paddingBottom: 10,
    borderBottom: "1px solid var(--hair)",
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: "hidden",
    flex: "none",
  },
  title: {
    fontSize: 16,
    color: "var(--ink)",
    letterSpacing: "-0.005em",
  },
  titleSub: {
    color: "var(--ink-3)",
    fontSize: 12,
    marginTop: 3,
  },
  stat: {
    fontFamily: "var(--f-mono)",
    fontSize: 12,
    color: "var(--ink-2)",
  },
}

function sideLink(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 10px",
    borderRadius: 6,
    fontSize: 13,
    color: active ? "var(--ink)" : "var(--ink-2)",
    background: active ? "var(--card)" : "transparent",
    boxShadow: active ? "inset 0 0 0 1px var(--hair)" : "none",
    cursor: "pointer",
  }
}

function statusChip(status: string): React.CSSProperties {
  const tones: Record<string, { bg: string; fg: string }> = {
    Planning: { bg: "var(--accent-soft)", fg: "var(--accent-ink)" },
    Booked: { bg: "#E7EFE6", fg: "#2D5135" },
    "In Progress": { bg: "#EDE9E2", fg: "var(--ink)" },
    Active: { bg: "#EDE9E2", fg: "var(--ink)" },
    Archived: { bg: "var(--panel-2)", fg: "var(--ink-3)" },
  }
  const tone = tones[status] || { bg: "var(--panel-2)", fg: "var(--ink-2)" }
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "3px 8px",
    borderRadius: 999,
    background: tone.bg,
    color: tone.fg,
    fontSize: 11,
    fontWeight: 500,
  }
}

function tagForTrip(id: string): string {
  const palette = ["tag-a", "tag-b", "tag-c", "tag-d", "tag-e"]
  const hash = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return palette[hash % palette.length] ?? "tag-c"
}

function seedForTrip(id: string): number {
  return ([...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7) + 1
}

function peopleForTrip(trip: Trip) {
  return Array.from({ length: Math.max(1, Math.min(trip.travelers, 4)) }).map((_, index) => ({
    id: `${trip.id}-${index}`,
    initials: index === 0 ? "YO" : `T${index + 1}`,
    color: ["#E7D6C7", "#CFE0D6", "#D8D9EC", "#EAE3D0"][index] ?? "#ECEAE3",
  }))
}

function rowDataForTrip(trip: Trip): TripRow {
  const timeline = getTripsByTimeline([trip])
  const isActive = timeline.current.length > 0
  const plannedItems = trip.itineraryItems?.length ?? 0

  return {
    trip,
    when: getDateRangeLabel(trip),
    year: trip.startDate.slice(0, 4),
    status: isActive ? "Active" : getTripStatusLabel(trip.status),
    days: trip.totalDays,
    people: trip.travelers,
    plannedItems,
    tag: tagForTrip(trip.id),
    seed: seedForTrip(trip.id),
    subtitle: `${trip.totalDays} days · ${plannedItems} planned items · ${trip.travelers} traveler${trip.travelers === 1 ? "" : "s"}`,
  }
}

function Row({
  row,
  onDelete,
}: {
  row: TripRow
  onDelete: (trip: Trip) => void
}) {
  const [hover, setHover] = React.useState(false)

  return (
    <div
      style={{ ...d.row, background: hover ? "var(--panel)" : "transparent" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link href={`/trips/${row.trip.id}`} style={d.cover}>
        <TripCover tag={row.tag} seed={row.seed} compact />
      </Link>
      <Link href={`/trips/${row.trip.id}`} style={{ minWidth: 0 }}>
        <div style={d.title}>{row.trip.destination}</div>
        <div style={d.titleSub}>{row.subtitle}</div>
      </Link>
      <div style={d.stat}>{row.when}</div>
      <div>
        <AvatarStack people={peopleForTrip(row.trip)} size="sm" />
      </div>
      <div style={d.stat}>{row.plannedItems} items</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={statusChip(row.status)}>{row.status}</span>
        <button
          className="btn ghost"
          style={{ width: 28, height: 28, padding: 0, justifyContent: "center" }}
          onClick={() => onDelete(row.trip)}
          title={`Delete ${row.trip.destination}`}
        >
          <Icon name="close" size={12} />
        </button>
      </div>
    </div>
  )
}

export function Dashboard() {
  const pathname = usePathname()
  const trips = useTrips()
  const deleteTrip = useDeleteTrip()
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<TripFilter>("all")

  const { future, current, past } = React.useMemo(() => getTripsByTimeline(trips), [trips])

  const filteredTrips = React.useMemo(() => {
    const base =
      filter === "current" ? current :
      filter === "upcoming" ? future :
      filter === "past" ? past :
      trips

    const query = search.trim().toLowerCase()
    const result = query
      ? base.filter((trip) => trip.destination.toLowerCase().includes(query))
      : base

    const rows = result.map(rowDataForTrip)
    const byYear = rows.reduce<Record<string, TripRow[]>>((acc, row) => {
      ;(acc[row.year] ||= []).push(row)
      return acc
    }, {})

    return Object.keys(byYear)
      .sort()
      .reverse()
      .map((year) => ({
        year,
        rows: byYear[year].sort((left, right) => right.trip.startDate.localeCompare(left.trip.startDate)),
      }))
  }, [current, filter, future, past, search, trips])

  const heroTitle = pathname === "/dashboard" ? "Workspace" : "Your trips"
  const heroSubtitle =
    pathname === "/dashboard"
      ? "Resume planning, start a new trip, or jump into a live itinerary."
      : "Every trip, one surface. The same quiet system from the client prototype, now backed by real data."

  const handleDelete = async (trip: Trip) => {
    const ok = window.confirm(`Delete trip "${trip.destination}"?`)
    if (!ok) return
    await deleteTrip(trip.id)
  }

  return (
    <div style={d.page} data-screen-label="02 Dashboard">
      <aside style={d.side}>
        <div style={d.sideTop}>
          <Link href="/">
            <Brand />
          </Link>
          <Link href="/agent" className="btn ghost" style={{ width: 24, height: 24, padding: 0, justifyContent: "center" }}>
            <Icon name="sparkle" size={14} />
          </Link>
        </div>

        <div style={d.search}>
          <Icon name="search" size={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search trips, places, notes"
            style={{ flex: 1, background: "transparent", border: 0, outline: "none", fontSize: 13 }}
          />
          <span className="kbd">⌘K</span>
        </div>

        <div className="caps" style={{ padding: "8px 10px 6px" }}>Workspace</div>
        <Link href="/dashboard" style={sideLink(pathname === "/dashboard")}>
          <Icon name="grid" size={15} /> Dashboard
        </Link>
        <Link href="/trips" style={sideLink(pathname === "/trips" && filter === "all")}>
          <Icon name="calendar" size={15} /> All trips
          <span className="mono" style={{ marginLeft: "auto", color: "var(--ink-4)", fontSize: 11 }}>{trips.length}</span>
        </Link>
        <div style={sideLink(filter === "current")} onClick={() => setFilter("current")}>
          <Icon name="list" size={15} /> Active
          <span className="mono" style={{ marginLeft: "auto", color: "var(--ink-4)", fontSize: 11 }}>{current.length}</span>
        </div>
        <div style={sideLink(filter === "upcoming")} onClick={() => setFilter("upcoming")}>
          <Icon name="bulb" size={15} /> Upcoming
          <span className="mono" style={{ marginLeft: "auto", color: "var(--ink-4)", fontSize: 11 }}>{future.length}</span>
        </div>
        <div style={sideLink(filter === "past")} onClick={() => setFilter("past")}>
          <Icon name="lock" size={15} /> Archive
          <span className="mono" style={{ marginLeft: "auto", color: "var(--ink-4)", fontSize: 11 }}>{past.length}</span>
        </div>

        <div className="caps" style={{ padding: "20px 10px 6px" }}>Tools</div>
        <Link href="/agent" style={sideLink(pathname === "/agent")}>
          <Icon name="sparkle" size={15} /> Planner agent
        </Link>
        <Link href="/auth/login" style={sideLink(pathname.startsWith("/auth"))}>
          <Icon name="globe" size={15} /> Account
        </Link>

        <div style={{ marginTop: "auto", padding: "12px 6px 2px", borderTop: "1px solid var(--hair)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px" }}>
            <div className="avatar" style={{ background: "var(--tag-a)" }}>YO</div>
            <div style={{ fontSize: 13 }}>
              <div>You</div>
              <div style={{ color: "var(--ink-4)", fontSize: 11 }}>
                {trips.length} trip{trips.length === 1 ? "" : "s"} loaded
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main style={d.main}>
        <header style={d.header}>
          <div>
            <h1 style={d.h1}>{heroTitle}</h1>
            <p style={d.sub}>{heroSubtitle}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/agent" className="btn">
              <Icon name="sparkle" size={14} /> Agent
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <button className="btn primary">
                  <Icon name="plus" size={14} /> New trip
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full overflow-auto sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>New trip</SheetTitle>
                  <SheetDescription>
                    Create a trip in the real client app. This uses the migrated Supabase-backed flow.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4 pb-6">
                  <NewTripCard />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "44px 2.4fr 1.1fr 1fr 1fr 140px", gap: 16, padding: "0 4px" }}>
          <span />
          <span style={d.colHead}>Trip</span>
          <span style={d.colHead}>Dates</span>
          <span style={d.colHead}>People</span>
          <span style={d.colHead}>Plan</span>
          <span style={d.colHead}>Status</span>
        </div>

        {filteredTrips.length === 0 ? (
          <section style={{ marginTop: 28, padding: "36px 4px", borderBottom: "1px solid var(--hair)", color: "var(--ink-3)" }}>
            No trips match this view yet.
          </section>
        ) : (
          filteredTrips.map((group) => (
            <section key={group.year} style={{ marginTop: 28 }}>
              <div
                style={{
                  fontFamily: "var(--f-display)",
                  fontSize: 28,
                  letterSpacing: "-0.01em",
                  padding: "0 4px 8px",
                  color: "var(--ink-3)",
                }}
              >
                {group.year}
              </div>
              {group.rows.map((row) => (
                <Row key={row.trip.id} row={row} onDelete={handleDelete} />
              ))}
            </section>
          ))
        )}
      </main>
    </div>
  )
}
