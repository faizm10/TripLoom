"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRightIcon,
  BedDoubleIcon,
  CalendarDaysIcon,
  CheckSquare2Icon,
  ClockIcon,
  ExternalLinkIcon,
  GlobeIcon,
  LockIcon,
  MapPinIcon,
  PackageIcon,
  PlaneIcon,
  SquareIcon,
  TrainFrontIcon,
  UsersIcon,
} from "lucide-react"
import { Brand } from "@/components/Shared"
import { formatMonthDayYear, formatMonthDayYearRange } from "@/lib/date-display"
import type {
  PublicFlightShare,
  PublicGroundShare,
  PublicHotelShare,
  PublicItineraryShare,
  PublicPackingShare,
  PublicTripSharePayload,
} from "@/lib/public-trip-share"

/* ─────────────────────────────────────────────────────────────
   TripLoom share view — editorial, calm, paper-over-cool-fog
   Design system:
     - Instrument Serif display, Inter UI, JetBrains Mono meta
     - Hairline rules (1px, var(--hair)) over bold borders
     - Two-column magazine layout on desktop, stacked on mobile
     - Accent used sparingly — only for the active state of one thing
     - All data and polling behavior preserved from the original
   ───────────────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

/* ───── helpers ───── */

function formatDateRange(start: string, end: string): string {
  return formatMonthDayYearRange(start, end)
}

function formatTime(t: string): string {
  if (!t) return ""
  try {
    const d = new Date(t)
    if (Number.isNaN(d.getTime())) return t
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  } catch {
    return t
  }
}

function categoryLabel(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/* Editorial palette for categories — quiet, non-competing */
const CATEGORY_SWATCH: Record<string, string> = {
  outbound_flight: "var(--tag-a)",
  inbound_flight: "var(--tag-a)",
  commute: "var(--tag-b)",
  activities: "var(--tag-c)",
  games: "var(--tag-d)",
  food: "var(--tag-e)",
  sightseeing: "var(--tag-c)",
  shopping: "var(--tag-d)",
  rest: "var(--panel-2)",
  other: "var(--panel-2)",
}

/* ───── shared primitives ───── */

function Caps({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: "var(--f-mono)",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ink-3)",
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function Rule({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: 1,
        background: "var(--hair)",
        width: "100%",
        ...style,
      }}
    />
  )
}

function Chip({
  icon: Icon,
  children,
  tone = "default",
}: {
  icon?: React.ElementType
  children: React.ReactNode
  tone?: "default" | "accent" | "muted"
}) {
  const palette =
    tone === "accent"
      ? { bg: "var(--accent-soft)", fg: "var(--accent-ink)" }
      : tone === "muted"
      ? { bg: "transparent", fg: "var(--ink-3)" }
      : { bg: "var(--card)", fg: "var(--ink-2)" }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        fontSize: 11,
        lineHeight: 1.4,
        color: palette.fg,
        background: palette.bg,
        borderRadius: 999,
        boxShadow: tone === "muted" ? "none" : "inset 0 0 0 1px var(--hair)",
        whiteSpace: "nowrap",
      }}
    >
      {Icon ? <Icon size={11} strokeWidth={1.6} /> : null}
      {children}
    </span>
  )
}

/* ───── section header ───── */

function SectionHeading({
  kicker,
  title,
  count,
  delay,
}: {
  kicker: string
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
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr auto",
        alignItems: "baseline",
        columnGap: 24,
        paddingBottom: 18,
        borderBottom: "1px solid var(--hair)",
      }}
    >
      <Caps>{kicker}</Caps>
      <h2
        style={{
          fontFamily: "var(--f-display)",
          fontSize: 34,
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          color: "var(--ink)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      <span
        style={{
          fontFamily: "var(--f-mono)",
          fontSize: 12,
          color: "var(--ink-4)",
        }}
      >
        {String(count).padStart(2, "0")}
      </span>
    </motion.div>
  )
}

/* ───── cards ───── */

function ListItem({
  index,
  children,
  idx = 0,
  swatch,
}: {
  index: string
  children: React.ReactNode
  idx?: number
  swatch?: string
}) {
  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      custom={idx * 0.05}
      style={{
        display: "grid",
        gridTemplateColumns: "56px 1fr",
        columnGap: 20,
        padding: "20px 0 22px",
        borderBottom: "1px solid var(--hair)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 10,
          paddingTop: 2,
        }}
      >
        <span
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            color: "var(--ink-4)",
            letterSpacing: "0.04em",
          }}
        >
          {index}
        </span>
        {swatch ? (
          <span
            style={{
              width: 18,
              height: 4,
              background: swatch,
              borderRadius: 2,
            }}
          />
        ) : null}
      </div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </motion.article>
  )
}

function FlightCard({ f, idx }: { f: PublicFlightShare; idx: number }) {
  return (
    <ListItem
      index={String(idx + 1).padStart(2, "0")}
      idx={idx}
      swatch="var(--tag-a)"
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--f-display)",
            fontSize: 22,
            letterSpacing: "-0.01em",
            margin: 0,
            color: "var(--ink)",
          }}
        >
          {f.route}
        </h3>
        <Caps>{formatMonthDayYear(f.date)}</Caps>
      </div>

      <p style={{ marginTop: 4, color: "var(--ink-3)", fontSize: 13 }}>
        {f.airline}
        {f.flightNumber ? ` · ${f.flightNumber}` : ""}
      </p>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          columnGap: 16,
        }}
      >
        <div>
          <Caps style={{ fontSize: 10 }}>Depart</Caps>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 16,
              color: "var(--ink)",
              marginTop: 3,
            }}
          >
            {f.departure}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-4)" }}>
          <div style={{ height: 1, background: "var(--hair-2)", width: 24 }} />
          <PlaneIcon size={12} strokeWidth={1.6} />
          <div style={{ height: 1, background: "var(--hair-2)", width: 24 }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <Caps style={{ fontSize: 10 }}>Arrive</Caps>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 16,
              color: "var(--ink)",
              marginTop: 3,
            }}
          >
            {f.arrival}
          </div>
        </div>
      </div>

      {(f.duration || (f.stops && f.stops !== "0")) && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {f.duration ? <Chip tone="muted">{f.duration}</Chip> : null}
          {f.stops && f.stops !== "0" ? (
            <Chip tone="muted">
              {f.stops} stop{f.stops !== "1" ? "s" : ""}
            </Chip>
          ) : null}
        </div>
      )}

      {f.notes ? (
        <p
          style={{
            marginTop: 10,
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--ink-3)",
            maxWidth: 560,
          }}
        >
          {f.notes}
        </p>
      ) : null}
    </ListItem>
  )
}

function GroundCard({ g, idx }: { g: PublicGroundShare; idx: number }) {
  return (
    <ListItem
      index={String(idx + 1).padStart(2, "0")}
      idx={idx}
      swatch="var(--tag-b)"
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--f-display)",
            fontSize: 22,
            letterSpacing: "-0.01em",
            margin: 0,
            color: "var(--ink)",
          }}
        >
          {g.route}
        </h3>
        <Caps>{formatMonthDayYear(g.travelDate)}</Caps>
      </div>
      <p style={{ marginTop: 4, color: "var(--ink-3)", fontSize: 13 }}>
        {g.operator}
        {g.serviceNumber ? ` · ${g.serviceNumber}` : ""}
      </p>
      <div
        style={{
          marginTop: 10,
          fontFamily: "var(--f-mono)",
          fontSize: 13,
          color: "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span>{g.departure}</span>
        <ArrowRightIcon size={12} strokeWidth={1.6} style={{ color: "var(--ink-4)" }} />
        <span>{g.arrival}</span>
        {g.duration ? (
          <>
            <span style={{ color: "var(--ink-4)" }}>·</span>
            <span style={{ color: "var(--ink-3)" }}>{g.duration}</span>
          </>
        ) : null}
      </div>
      {g.notes ? (
        <p
          style={{
            marginTop: 10,
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--ink-3)",
            maxWidth: 560,
          }}
        >
          {g.notes}
        </p>
      ) : null}
    </ListItem>
  )
}

function HotelCard({ h, idx }: { h: PublicHotelShare; idx: number }) {
  return (
    <ListItem
      index={String(idx + 1).padStart(2, "0")}
      idx={idx}
      swatch="var(--tag-c)"
    >
      <h3
        style={{
          fontFamily: "var(--f-display)",
          fontSize: 24,
          letterSpacing: "-0.01em",
          margin: 0,
          color: "var(--ink)",
        }}
      >
        {h.propertyName}
      </h3>
      <p style={{ marginTop: 4, color: "var(--ink-3)", fontSize: 13 }}>{h.area}</p>
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: 24,
          maxWidth: 360,
        }}
      >
        <div>
          <Caps style={{ fontSize: 10 }}>Check in</Caps>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 14,
              color: "var(--ink)",
              marginTop: 3,
            }}
          >
            {formatMonthDayYear(h.checkIn)}
          </div>
        </div>
        <div>
          <Caps style={{ fontSize: 10 }}>Check out</Caps>
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 14,
              color: "var(--ink)",
              marginTop: 3,
            }}
          >
            {formatMonthDayYear(h.checkOut)}
          </div>
        </div>
      </div>
      {h.notes ? (
        <p
          style={{
            marginTop: 12,
            fontStyle: "italic",
            fontSize: 13,
            color: "var(--ink-3)",
            maxWidth: 560,
          }}
        >
          {h.notes}
        </p>
      ) : null}
    </ListItem>
  )
}

/* ───── packing ───── */

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
  const pct = items.length ? Math.round((checkedCount / items.length) * 100) : 0

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      custom={0}
      style={{ paddingTop: 4 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 32,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            {checkedCount}
          </span>
          <span
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 22,
              letterSpacing: "-0.01em",
              color: "var(--ink-4)",
              margin: "0 6px",
            }}
          >
            /
          </span>
          <span
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 22,
              letterSpacing: "-0.01em",
              color: "var(--ink-3)",
            }}
          >
            {items.length}
          </span>
          <span
            style={{
              marginLeft: 10,
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              color: "var(--ink-4)",
              letterSpacing: "0.04em",
            }}
          >
            packed · saved on this device
          </span>
        </div>
        <Caps>{pct}%</Caps>
      </div>

      <div
        style={{
          height: 2,
          background: "var(--hair)",
          marginBottom: 18,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct}%`,
            background: "var(--accent)",
            transition: "width 320ms ease",
          }}
        />
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          columnGap: 16,
        }}
      >
        {items.map((p) => {
          const done = isPacked(p)
          return (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={done}
                aria-label={`${done ? "Packed" : "Not packed"}: ${p.label || "item"}`}
                onClick={() => toggle(p)}
                style={{
                  all: "unset",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--hair)",
                  cursor: "pointer",
                  fontSize: 14,
                  color: done ? "var(--ink-4)" : "var(--ink)",
                  textDecoration: done ? "line-through" : "none",
                  textDecorationColor: "var(--ink-4)",
                }}
              >
                {done ? (
                  <CheckSquare2Icon size={15} strokeWidth={1.6} style={{ color: "var(--accent)", flex: "none" }} />
                ) : (
                  <SquareIcon size={15} strokeWidth={1.4} style={{ color: "var(--ink-4)", flex: "none" }} />
                )}
                <span>{p.label || "Item"}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

/* ───── itinerary ───── */

function ItineraryDayGroup({
  dayIndex,
  items,
  startDate,
  delay,
}: {
  dayIndex: number
  items: PublicItineraryShare[]
  startDate: string
  delay: number
}) {
  let weekday = ""
  let datePart = ""
  try {
    const d = new Date(startDate + "T00:00:00")
    d.setDate(d.getDate() + dayIndex - 1)
    weekday = d.toLocaleDateString("en-US", { weekday: "long" })
    datePart = formatMonthDayYear(startDate)
    if (dayIndex > 1) {
      const shifted = new Date(startDate + "T00:00:00")
      shifted.setDate(shifted.getDate() + dayIndex - 1)
      datePart = `${shifted.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${shifted.getFullYear()}`
    }
  } catch {
    /* keep blank */
  }

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      custom={delay}
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        columnGap: 24,
        paddingTop: 36,
      }}
    >
      <div style={{ position: "sticky", top: 32, alignSelf: "start" }}>
        <Caps>Day {String(dayIndex).padStart(2, "0")}</Caps>
        {weekday ? (
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 26,
              letterSpacing: "-0.01em",
              lineHeight: 1.05,
              color: "var(--ink)",
              marginTop: 6,
            }}
          >
            {weekday}
          </div>
        ) : null}
        {datePart ? (
          <div
            style={{
              fontStyle: "italic",
              color: "var(--ink-3)",
              fontSize: 14,
              marginTop: 2,
            }}
          >
            {datePart}
          </div>
        ) : null}
      </div>
      <div>
        {items.map((item, idx) => (
          <ItineraryItemCard key={item.id} item={item} idx={idx} />
        ))}
      </div>
    </motion.section>
  )
}

function ItineraryItemCard({ item, idx }: { item: PublicItineraryShare; idx: number }) {
  const swatch = CATEGORY_SWATCH[item.category] ?? CATEGORY_SWATCH.other
  const timeRange =
    item.startTimeLocal && item.endTimeLocal
      ? `${formatTime(item.startTimeLocal)} – ${formatTime(item.endTimeLocal)}`
      : item.startTimeLocal
      ? formatTime(item.startTimeLocal)
      : null

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-20px" }}
      custom={idx * 0.04}
      style={{
        display: "grid",
        gridTemplateColumns: "90px 1fr",
        columnGap: 16,
        padding: "18px 0",
        borderBottom: "1px solid var(--hair)",
      }}
    >
      <div style={{ paddingTop: 2 }}>
        {timeRange ? (
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 12,
              color: "var(--ink-2)",
              lineHeight: 1.3,
            }}
          >
            {timeRange}
          </div>
        ) : (
          <div
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 12,
              color: "var(--ink-4)",
            }}
          >
            —
          </div>
        )}
        <div
          style={{
            marginTop: 8,
            width: 16,
            height: 3,
            background: swatch,
            borderRadius: 2,
          }}
        />
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 10,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 20,
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
              margin: 0,
              color: "var(--ink)",
            }}
          >
            {item.title}
          </h3>
          <Caps>{categoryLabel(item.category)}</Caps>
        </div>

        {item.locationLabel && (
          <p
            style={{
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--ink-3)",
            }}
          >
            <MapPinIcon size={11} strokeWidth={1.6} style={{ color: "var(--ink-4)" }} />
            {item.locationLabel}
          </p>
        )}

        {item.commuteDetails && (
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "var(--ink-2)",
              maxWidth: 620,
            }}
          >
            <span style={{ color: "var(--ink-4)" }}>Getting there —</span> {item.commuteDetails}
          </p>
        )}

        {item.notes && (
          <p
            style={{
              marginTop: 8,
              fontStyle: "italic",
              fontSize: 13.5,
              lineHeight: 1.55,
              color: "var(--ink-2)",
              maxWidth: 620,
            }}
          >
            {item.notes}
          </p>
        )}

        {(item.locationLink || item.googleMapsLink) && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            {item.locationLink && (
              <a
                href={item.locationLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--accent-ink)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--accent)",
                  paddingBottom: 1,
                }}
              >
                <ExternalLinkIcon size={11} strokeWidth={1.6} />
                Location
              </a>
            )}
            {item.googleMapsLink && (
              <a
                href={item.googleMapsLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--accent-ink)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--accent)",
                  paddingBottom: 1,
                }}
              >
                <MapPinIcon size={11} strokeWidth={1.6} />
                Google Maps
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  )
}

/* ───── polling + payload guard ───── */

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
    Array.isArray(o.groupPacking) &&
    Array.isArray(o.itinerary)
  )
}

/* ───── main view ───── */

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

  const { trip, flights, groundTrips, hotels, groupPacking, itinerary } = data

  const hasFlights = flights.length > 0
  const hasGround = groundTrips.length > 0
  const hasHotels = hotels.length > 0
  const hasPacking = trip.isGroupTrip && groupPacking.length > 0
  const hasItinerary = itinerary.length > 0

  const itineraryByDay = React.useMemo(() => {
    const map = new Map<number, PublicItineraryShare[]>()
    for (const item of itinerary) {
      const existing = map.get(item.dayIndex) ?? []
      existing.push(item)
      map.set(item.dayIndex, existing)
    }
    return [...map.entries()].sort(([a], [b]) => a - b)
  }, [itinerary])

  const stats: Array<{ label: string; value: number }> = [
    { label: "Days", value: trip.totalDays },
    { label: "Flights", value: flights.length },
    { label: "Ground", value: groundTrips.length },
    { label: "Stays", value: hotels.length },
    { label: "Plans", value: itinerary.length },
    ...(trip.isGroupTrip ? [{ label: "To pack", value: groupPacking.length }] : []),
  ]

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--f-ui)",
      }}
    >
      {/* Revoked-link notice */}
      {linkInactive ? (
        <div
          role="alert"
          style={{
            background: "var(--ink)",
            color: "var(--bg)",
            padding: "10px 20px",
            fontFamily: "var(--f-mono)",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          <LockIcon size={12} strokeWidth={1.6} />
          This share link is no longer active · Showing the last loaded snapshot
        </div>
      ) : null}

      {/* ───── Nav ───── */}
      <motion.nav
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "22px 48px",
          maxWidth: 1280,
          margin: "0 auto",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
          <Brand size={14} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Chip tone="muted">
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "inline-block",
              }}
            />
            View only
          </Chip>
          <Link
            href="/auth/login"
            style={{
              fontSize: 13,
              color: "var(--ink-2)",
              textDecoration: "none",
              borderBottom: "1px solid var(--hair-2)",
              paddingBottom: 1,
            }}
          >
            Sign in
          </Link>
        </div>
      </motion.nav>

      {/* ───── Hero ───── */}
      <header
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "48px 48px 24px",
          position: "relative",
        }}
      >
        <div
          className="dotfield"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.3,
            pointerEvents: "none",
            maskImage: "radial-gradient(ellipse at 60% 30%, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at 60% 30%, black 30%, transparent 75%)",
          }}
        />
        <div style={{ position: "relative" }}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.05}
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <Caps>Shared trip</Caps>
            <span style={{ width: 28, height: 1, background: "var(--hair-2)" }} />
            <Caps>{formatDateRange(trip.startDate, trip.endDate)}</Caps>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.12}
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 104,
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
              margin: "24px 0 0",
              color: "var(--ink)",
              textWrap: "balance" as any,
              maxWidth: 1100,
            }}
          >
            {trip.destination}
          </motion.h1>

          {trip.timezone ? (
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.18}
              style={{
                marginTop: 20,
                fontStyle: "italic",
                fontSize: 18,
                color: "var(--ink-3)",
                maxWidth: 620,
              }}
            >
              {trip.timezone}
            </motion.p>
          ) : null}

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.24}
            style={{
              marginTop: 28,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Chip icon={UsersIcon}>
              {trip.travelers} traveler{trip.travelers !== 1 ? "s" : ""}
            </Chip>
            <Chip icon={trip.isGroupTrip ? UsersIcon : MapPinIcon}>
              {trip.isGroupTrip ? "Group trip" : "Solo trip"}
            </Chip>
            <Chip icon={GlobeIcon}>
              {trip.travelScope === "domestic" ? "Domestic" : "International"}
            </Chip>
            <Chip>
              {trip.totalDays} day{trip.totalDays !== 1 ? "s" : ""}
            </Chip>
          </motion.div>
        </div>

        {/* Stat strip */}
        {stats.length > 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.32}
            style={{
              marginTop: 64,
              display: "grid",
              gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
              gap: 0,
              paddingTop: 28,
              borderTop: "1px solid var(--hair)",
              position: "relative",
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: "4px 20px 4px 0",
                  borderLeft: i === 0 ? "none" : "1px solid var(--hair)",
                  paddingLeft: i === 0 ? 0 : 20,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--f-display)",
                    fontSize: 42,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    color: "var(--ink)",
                  }}
                >
                  {s.value}
                </div>
                <Caps style={{ fontSize: 10, marginTop: 8, display: "block" }}>{s.label}</Caps>
              </div>
            ))}
          </motion.div>
        ) : null}
      </header>

      {/* ───── Content ───── */}
      <main
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "48px 48px 96px",
          display: "flex",
          flexDirection: "column",
          gap: 72,
        }}
      >
        {hasFlights ? (
          <section>
            <SectionHeading
              kicker="By air"
              title="Flights"
              count={flights.length}
              delay={0}
            />
            <div style={{ marginTop: 8 }}>
              {flights.map((f, i) => (
                <FlightCard key={f.id} f={f} idx={i} />
              ))}
            </div>
          </section>
        ) : null}

        {hasGround ? (
          <section>
            <SectionHeading
              kicker="By rail & road"
              title="Ground transport"
              count={groundTrips.length}
              delay={0}
            />
            <div style={{ marginTop: 8 }}>
              {groundTrips.map((g, i) => (
                <GroundCard key={g.id} g={g} idx={i} />
              ))}
            </div>
          </section>
        ) : null}

        {hasHotels ? (
          <section>
            <SectionHeading
              kicker="Where you sleep"
              title="Stays"
              count={hotels.length}
              delay={0}
            />
            <div style={{ marginTop: 8 }}>
              {hotels.map((h, i) => (
                <HotelCard key={h.id} h={h} idx={i} />
              ))}
            </div>
          </section>
        ) : null}

        {hasItinerary ? (
          <section>
            <SectionHeading
              kicker="Hour by hour"
              title="The itinerary"
              count={itinerary.length}
              delay={0}
            />
            {itineraryByDay.map(([dayIndex, items], i) => (
              <ItineraryDayGroup
                key={dayIndex}
                dayIndex={dayIndex}
                items={items}
                startDate={trip.startDate}
                delay={i * 0.04}
              />
            ))}
          </section>
        ) : null}

        {hasPacking ? (
          <section>
            <SectionHeading
              kicker="Shared list"
              title="Group packing"
              count={groupPacking.length}
              delay={0}
            />
            <div style={{ marginTop: 20 }}>
              <PackingCard tripId={trip.id} items={groupPacking} />
            </div>
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
        style={{
          borderTop: "1px solid var(--hair)",
          background: "var(--panel)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "56px 48px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            columnGap: 40,
            rowGap: 24,
            alignItems: "end",
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <Caps>An invitation</Caps>
            <h3
              style={{
                fontFamily: "var(--f-display)",
                fontSize: 40,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                margin: "12px 0 10px",
                color: "var(--ink)",
                textWrap: "balance" as any,
              }}
            >
              Want to plan together, not over email?
            </h3>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.55,
                color: "var(--ink-2)",
                margin: 0,
              }}
            >
              Sign in and ask the trip owner for a collaborator seat — edit the itinerary,
              add flights, drop pins on the map, all in one calm place.
            </p>
          </div>
          <Link
            href="/auth/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 22px",
              background: "var(--ink)",
              color: "var(--bg)",
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Sign in to TripLoom
            <ArrowRightIcon size={14} strokeWidth={1.8} />
          </Link>
        </div>
        <Rule />
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "20px 48px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "var(--ink-4)",
            fontSize: 12,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Brand size={12} />
          <span style={{ fontFamily: "var(--f-mono)" }}>
            Updates every {Math.round(POLL_MS / 1000)}s while this tab is open
          </span>
        </div>
      </motion.footer>
    </div>
  )
}
