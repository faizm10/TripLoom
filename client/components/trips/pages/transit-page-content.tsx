"use client"

import * as React from "react"
import {
  CircleAlertIcon,
  LinkIcon,
  EyeIcon,
  PencilIcon,
  RouteIcon,
  Trash2Icon,
  ArrowRightIcon,
  ExternalLinkIcon,
  MapPinIcon,
  ClockIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useUpdateTrip } from "@/components/providers/trips-provider"
import { useTripPage } from "@/components/trips/trip-shell"
import { TransitPlaceSearch } from "@/components/trips/transit-place-search"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  deleteTripTransitRouteFromSupabase,
  getTripTransitRoutesFromSupabase,
  saveTripTransitRouteToSupabase,
} from "@/lib/supabase-trip-transit"
import {
  getTripTravelScope,
  type TransitMode,
  type TransitRoute,
  type Trip,
} from "@/lib/trips"

/* ─────────────────────────────────────────────────────────────
   TripLoom transit — editorial, calm, map-forward
   - Instrument Serif display, Inter UI, JetBrains Mono meta
   - Hairline rules, 1px borders, no heavy cards
   - Map panel is sticky + prominent on wide layouts
   - All original logic, Supabase calls, draft types preserved
   ───────────────────────────────────────────────────────────── */

/* ───── types (unchanged) ───── */

type TransitSuggestion = {
  summaryLabel: string
  durationMinutes: number
  estimatedCost: number | null
  currency: string
  transfers: number
  walkingMinutes: number
  departureTimeLocal?: string
  arrivalTimeLocal?: string
  providerRouteRef?: string
  mode: TransitMode
}

type SuggestResponse = {
  ok: boolean
  data?: TransitSuggestion[]
  error?: string
}

type ManualDraft = {
  dayIndex: number
  fromLabel: string
  toLabel: string
  mode: TransitMode
  durationMinutes: string
  departureTimeLocal: string
  arrivalTimeLocal: string
  estimatedCost: string
  currency: string
  transfers: string
  walkingMinutes: string
  notes: string
  referenceUrl: string
  provider: "google_maps" | "manual"
  providerRouteRef: string
}

type MapPreview = {
  fromLabel: string
  toLabel: string
  mode: TransitMode
  label: string
  providerRouteRef?: string
  departureTimeLocal?: string
  arrivalTimeLocal?: string
}

type TimeFilterMode = "depart" | "arrive"

const modeOptions: TransitMode[] = [
  "subway", "bus", "tram", "rail", "ferry", "walk_mix", "other",
]

const modeLabels: Record<TransitMode, string> = {
  subway: "Subway", bus: "Bus", tram: "Tram", rail: "Rail",
  ferry: "Ferry", walk_mix: "Walk + Transit", other: "Other",
}

const modeSwatch: Record<TransitMode, string> = {
  subway: "var(--tag-a)", bus: "var(--tag-b)", tram: "var(--tag-c)",
  rail: "var(--tag-d)", ferry: "var(--tag-e)", walk_mix: "var(--panel-2)",
  other: "var(--panel-2)",
}

const weekdayNames = [
  "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
] as const

/* ───── helpers (unchanged logic) ───── */

function sortRoutes(routes: TransitRoute[]): TransitRoute[] {
  return [...routes].sort((a, b) => {
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex
    const aTime = a.departureTimeLocal ?? ""
    const bTime = b.departureTimeLocal ?? ""
    if (aTime !== bTime) return aTime.localeCompare(bTime)
    return a.createdAt.localeCompare(b.createdAt)
  })
}

function formatTime(value?: string): string {
  if (!value) return "Time TBD"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value.replace("T", " ")
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(parsed)
}

function formatMoney(cost: number, currency: string): string {
  return `${currency} ${cost.toFixed(2)}`
}

function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function buildDayWeekdayMap(startDate: string, totalDays: number): Record<number, string> {
  const start = parseLocalDate(startDate)
  const mapping: Record<number, string> = {}
  for (let i = 1; i <= totalDays; i += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + (i - 1))
    mapping[i] = weekdayNames[date.getDay()]
  }
  return mapping
}

function buildTripDayDateTime(startDate: string, dayIndex: number, hour: number, minute: number): string {
  const date = parseLocalDate(startDate)
  date.setDate(date.getDate() + (dayIndex - 1))
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(hour).padStart(2, "0")
  const min = String(minute).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function applyDayToDateTime(value: string, startDate: string, dayIndex: number): string {
  if (!value) return value
  const targetDate = parseLocalDate(startDate)
  targetDate.setDate(targetDate.getDate() + (dayIndex - 1))
  const parsed = new Date(value)
  const hours = Number.isNaN(parsed.getTime()) ? 9 : parsed.getHours()
  const minutes = Number.isNaN(parsed.getTime()) ? 0 : parsed.getMinutes()
  const yyyy = targetDate.getFullYear()
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0")
  const dd = String(targetDate.getDate()).padStart(2, "0")
  const hh = String(hours).padStart(2, "0")
  const min = String(minutes).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function buildEmptyDraft(): ManualDraft {
  return {
    dayIndex: 1, fromLabel: "", toLabel: "", mode: "rail",
    durationMinutes: "", departureTimeLocal: "", arrivalTimeLocal: "",
    estimatedCost: "", currency: "USD", transfers: "", walkingMinutes: "",
    notes: "", referenceUrl: "", provider: "manual", providerRouteRef: "",
  }
}

function buildDraftFromSuggestion(suggestion: TransitSuggestion, dayIndex: number, fromLabel: string, toLabel: string): ManualDraft {
  return {
    dayIndex, fromLabel, toLabel, mode: suggestion.mode,
    durationMinutes: String(suggestion.durationMinutes),
    departureTimeLocal: suggestion.departureTimeLocal ?? "",
    arrivalTimeLocal: suggestion.arrivalTimeLocal ?? "",
    estimatedCost: suggestion.estimatedCost === null ? "" : String(suggestion.estimatedCost),
    currency: suggestion.currency || "USD",
    transfers: String(suggestion.transfers ?? 0),
    walkingMinutes: String(suggestion.walkingMinutes ?? 0),
    notes: suggestion.summaryLabel, referenceUrl: "",
    provider: "google_maps", providerRouteRef: suggestion.providerRouteRef ?? "",
  }
}

function parseRoutePairsFromText(text: string): Array<{ fromLabel: string; toLabel: string; referenceUrl?: string }> {
  const pairs: Array<{ fromLabel: string; toLabel: string; referenceUrl?: string }> = []
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)
  let pendingLink: string | undefined
  for (const line of lines) {
    const maybeUrl = line.match(/https?:\/\/\S+/i)?.[0]
    if (maybeUrl) pendingLink = maybeUrl
    const routeMatch =
      line.match(/^([A-Za-z][A-Za-z0-9 .()'&/-]+?)\s*(?:-|–|—|→)\s*([A-Za-z][A-Za-z0-9 .()'&/-]+)$/) ||
      line.match(/^([A-Za-z][A-Za-z0-9 .()'&/-]+?)\s*(?:-|–|—|→)\s*([A-Za-z][A-Za-z0-9 .()'&/-]+)\s*:/)
    if (routeMatch) {
      const fromLabel = routeMatch[1].trim()
      const toLabel = routeMatch[2].trim()
      if (fromLabel && toLabel && fromLabel.toLowerCase() !== toLabel.toLowerCase()) {
        pairs.push({ fromLabel, toLabel, referenceUrl: pendingLink })
        pendingLink = undefined
      }
    }
  }
  return pairs
}

function buildDirectionsUrl(fromLabel: string, toLabel: string): string {
  const params = new URLSearchParams({
    api: "1", origin: fromLabel, destination: toLabel, travelmode: "transit",
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

function buildEmbedMapUrl(preview: MapPreview | null): string | null {
  if (!preview?.fromLabel || !preview?.toLabel) return null
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY
  if (!key) return null
  const params = new URLSearchParams({
    key, origin: preview.fromLabel, destination: preview.toLabel, mode: "transit",
  })
  return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`
}

function buildStaticMapUrl(preview: MapPreview | null): string | null {
  if (!preview?.providerRouteRef) return null
  const key =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) return null
  const params = new URLSearchParams({
    size: "900x520", key,
    path: `weight:5|color:0x1e88e5|enc:${preview.providerRouteRef}`,
  })
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
}

/* ───── editorial primitives ───── */

function Caps({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      fontFamily: "var(--f-mono)", fontSize: 11, letterSpacing: "0.12em",
      textTransform: "uppercase", color: "var(--ink-3)", ...style,
    }}>{children}</span>
  )
}

function SectionHead({ kicker, title, count }: { kicker: string; title: string; count?: string | number }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "140px 1fr auto",
      alignItems: "baseline", columnGap: 20, paddingBottom: 16,
      borderBottom: "1px solid var(--hair)", marginBottom: 20,
    }}>
      <Caps>{kicker}</Caps>
      <h2 style={{
        fontFamily: "var(--f-display)", fontSize: 30, letterSpacing: "-0.02em",
        lineHeight: 1.05, color: "var(--ink)", margin: 0,
      }}>{title}</h2>
      {count != null && (
        <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--ink-4)" }}>
          {typeof count === "number" ? String(count).padStart(2, "0") : count}
        </span>
      )}
    </div>
  )
}

function Btn({
  children, onClick, variant = "default", disabled, asChild,
  style, type,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "ghost" | "primary" | "danger"
  disabled?: boolean
  asChild?: boolean
  style?: React.CSSProperties
  type?: "button" | "submit"
}) {
  const palettes: Record<string, React.CSSProperties> = {
    default: { background: "var(--card)", color: "var(--ink)", boxShadow: "inset 0 0 0 1px var(--hair)" },
    primary: { background: "var(--ink)", color: "var(--bg)", boxShadow: "none" },
    ghost: { background: "transparent", color: "var(--ink-2)", boxShadow: "inset 0 0 0 1px var(--hair)" },
    danger: { background: "transparent", color: "#a0302a", boxShadow: "inset 0 0 0 1px var(--hair)" },
  }
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "8px 14px", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, transition: "background 120ms", whiteSpace: "nowrap",
    ...palettes[variant], ...style,
  }
  if (asChild) return <span style={base}>{children}</span>
  return <button type={type ?? "button"} onClick={onClick} disabled={disabled} style={base}>{children}</button>
}

function Alert({ tone = "error", title, children }: { tone?: "error" | "info"; title: string; children: React.ReactNode }) {
  const bg = tone === "error" ? "rgba(160,48,42,0.06)" : "var(--panel)"
  const fg = tone === "error" ? "#a0302a" : "var(--ink-2)"
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "18px 1fr", columnGap: 10,
      padding: "12px 14px", background: bg,
      borderLeft: `2px solid ${tone === "error" ? "#a0302a" : "var(--accent)"}`,
    }}>
      <CircleAlertIcon size={14} strokeWidth={1.6} style={{ color: fg, marginTop: 2 }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: fg, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div style={{ gridColumn: `span ${span}`, display: "flex", flexDirection: "column", gap: 6 }}>
      <Label style={{
        fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--ink-3)",
      }}>{label}</Label>
      {children}
    </div>
  )
}

function ModeBadge({ mode }: { mode: TransitMode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 999, fontSize: 11,
      color: "var(--ink-2)", background: "var(--card)",
      boxShadow: "inset 0 0 0 1px var(--hair)",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: modeSwatch[mode] }} />
      {modeLabels[mode]}
    </span>
  )
}

/* ───── entry point ───── */

export function TransitPageContent() {
  const trip = useTripPage()
  if (!trip) {
    return (
      <p style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>Loading trip…</p>
    )
  }
  if (getTripTravelScope(trip) === "domestic") return <DomesticTransitView trip={trip} />
  return <TransitPageBody trip={trip} />
}

/* ─────────────────────────────────────────────────────────────
 * Domestic — quick notes view
 * ───────────────────────────────────────────────────────────── */

type DomesticDraft = {
  dayIndex: number
  title: string
  mode: TransitMode
  fare: string
  currency: string
  notes: string
  referenceUrl: string
  fromLabel: string
  toLabel: string
}

function buildEmptyDomesticDraft(): DomesticDraft {
  return {
    dayIndex: 1, title: "", mode: "rail", fare: "", currency: "CAD",
    notes: "", referenceUrl: "", fromLabel: "", toLabel: "",
  }
}

function DomesticTransitView({ trip }: { trip: Trip }) {
  const updateTrip = useUpdateTrip()
  const [routes, setRoutes] = React.useState<TransitRoute[]>([])
  const [loading, setLoading] = React.useState(true)
  const [draft, setDraft] = React.useState<DomesticDraft>(buildEmptyDomesticDraft)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [showLeg, setShowLeg] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    getTripTransitRoutesFromSupabase(trip.id).then((rows) => {
      if (cancelled) return
      const sorted = sortRoutes(rows)
      setRoutes(sorted)
      updateTrip(trip.id, { transitRoutes: sorted, transitSaved: sorted.length > 0 })
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [trip.id, updateTrip])

  const dayOptions = React.useMemo(
    () => Array.from({ length: trip.totalDays }, (_, idx) => idx + 1), [trip.totalDays]
  )
  const dayWeekdayMap = React.useMemo(
    () => buildDayWeekdayMap(trip.startDate, trip.totalDays), [trip.startDate, trip.totalDays]
  )
  const groupedRoutes = React.useMemo(() => {
    const grouped = new Map<number, TransitRoute[]>()
    for (const route of routes) {
      const existing = grouped.get(route.dayIndex) ?? []
      existing.push(route); grouped.set(route.dayIndex, existing)
    }
    return grouped
  }, [routes])

  function syncStore(next: TransitRoute[]) {
    setRoutes(next)
    updateTrip(trip.id, { transitRoutes: next, transitSaved: next.length > 0 })
  }

  async function handleSave() {
    const title = draft.title.trim()
    if (!title) { setError("Give this entry a title (line, route, or short description)."); return }
    if (draft.dayIndex < 1 || draft.dayIndex > trip.totalDays) { setError(`Day must be 1–${trip.totalDays}.`); return }
    const from = draft.fromLabel.trim()
    const to = draft.toLabel.trim()
    if ((from && !to) || (!from && to)) { setError("Fill in both From and To, or leave both empty."); return }
    if (from && to && from.toLowerCase() === to.toLowerCase()) { setError("From and To cannot be the same."); return }
    setError(null)

    const now = new Date().toISOString()
    const existing = editingId ? routes.find((r) => r.id === editingId) : undefined
    const fare = Number(draft.fare)
    const route: TransitRoute = {
      id: editingId ?? crypto.randomUUID(),
      tripId: trip.id, dayIndex: draft.dayIndex,
      fromLabel: from || title, toLabel: to || title,
      mode: draft.mode, durationMinutes: 0,
      estimatedCost: Number.isFinite(fare) && fare >= 0 ? fare : 0,
      currency: draft.currency.trim() || "CAD",
      provider: "manual",
      notes: [title, draft.notes.trim()].filter(Boolean).join(" · ") || undefined,
      referenceUrl: draft.referenceUrl.trim() || undefined,
      createdAt: existing?.createdAt ?? now, updatedAt: now,
    }
    setSaving(true)
    try {
      await saveTripTransitRouteToSupabase(trip.id, route)
      const next = sortRoutes(editingId ? routes.map((r) => (r.id === editingId ? route : r)) : [...routes, route])
      syncStore(next)
      toast.success(editingId ? "Updated" : "Saved")
      setEditingId(null); setShowLeg(false); setDraft(buildEmptyDomesticDraft())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(route: TransitRoute) {
    setError(null); setEditingId(route.id)
    const titlePart = route.notes?.split(" · ")[0] ?? ""
    const notesPart = route.notes?.split(" · ").slice(1).join(" · ") ?? ""
    const hasLeg = route.fromLabel !== route.toLabel
    setShowLeg(hasLeg)
    setDraft({
      dayIndex: route.dayIndex, title: titlePart, mode: route.mode,
      fare: route.estimatedCost > 0 ? String(route.estimatedCost) : "",
      currency: route.currency || "CAD", notes: notesPart,
      referenceUrl: route.referenceUrl ?? "",
      fromLabel: hasLeg ? route.fromLabel : "",
      toLabel: hasLeg ? route.toLabel : "",
    })
  }

  async function handleDelete(id: string) {
    try {
      await deleteTripTransitRouteFromSupabase(trip.id, id)
      syncStore(routes.filter((r) => r.id !== id))
      toast.success("Removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  function handleCancel() {
    setEditingId(null); setError(null); setShowLeg(false)
    setDraft(buildEmptyDomesticDraft())
  }

  const field = (key: keyof DomesticDraft, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--f-ui)", padding: "8px 0 48px" }}>
      <header style={{ marginBottom: 36 }}>
        <Caps>Getting around</Caps>
        <h1 style={{
          fontFamily: "var(--f-display)", fontSize: 54, letterSpacing: "-0.025em",
          lineHeight: 1.02, margin: "10px 0 0", color: "var(--ink)",
        }}>Transit</h1>
        <p style={{ marginTop: 10, fontStyle: "italic", color: "var(--ink-3)", fontSize: 15, maxWidth: 520 }}>
          Lines, fares, and the tiny tips you&apos;ll want on the go.
        </p>
      </header>

      <section style={{ marginBottom: 56 }}>
        <SectionHead kicker={editingId ? "Editing" : "New entry"} title={editingId ? "Update note" : "Quick add"} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 820 }}>
          {error ? <Alert title="Heads up">{error}</Alert> : null}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Field label="Title">
              <Input value={draft.title} onChange={(e) => field("title", e.target.value)} placeholder="Line 1 Yonge-University, GO Train to Hamilton…" />
            </Field>
            <Field label="Day">
              <Select value={String(draft.dayIndex)} onValueChange={(v) => setDraft((p) => ({ ...p, dayIndex: Number(v) }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dayOptions.map((d) => (
                    <SelectItem key={d} value={String(d)}>Day {d} · {dayWeekdayMap[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Field label="Mode">
              <Select value={draft.mode} onValueChange={(v) => setDraft((p) => ({ ...p, mode: v as TransitMode }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {modeOptions.map((m) => <SelectItem key={m} value={m}>{modeLabels[m]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Fare">
              <Input type="number" min="0" step="0.01" value={draft.fare} onChange={(e) => field("fare", e.target.value)} placeholder="3.35" />
            </Field>
            <Field label="Currency">
              <Input value={draft.currency} onChange={(e) => field("currency", e.target.value.toUpperCase())} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea value={draft.notes} onChange={(e) => field("notes", e.target.value)} placeholder="Buy a day pass at the kiosk, tap PRESTO card, etc." rows={2} />
          </Field>
          <Field label="Link (optional)">
            <Input value={draft.referenceUrl} onChange={(e) => field("referenceUrl", e.target.value)} placeholder="https://..." />
          </Field>

          {showLeg ? (
            <div style={{ padding: "16px 18px", borderLeft: "2px solid var(--accent)", background: "var(--panel)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Caps>Leg detail · optional</Caps>
                <Btn variant="ghost" onClick={() => { setShowLeg(false); setDraft((p) => ({ ...p, fromLabel: "", toLabel: "" })) }}>Remove</Btn>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="From">
                  <Input value={draft.fromLabel} onChange={(e) => field("fromLabel", e.target.value)} placeholder="Union Station" />
                </Field>
                <Field label="To">
                  <Input value={draft.toLabel} onChange={(e) => field("toLabel", e.target.value)} placeholder="Downtown" />
                </Field>
              </div>
            </div>
          ) : (
            <div><Btn variant="ghost" onClick={() => setShowLeg(true)}>+ Add From → To leg</Btn></div>
          )}

          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <Btn variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update entry" : "Save entry"}
            </Btn>
            {editingId ? <Btn onClick={handleCancel}>Cancel</Btn> : null}
          </div>
        </div>
      </section>

      <section>
        <SectionHead kicker="Your notes" title="Saved" count={routes.length} />
        {loading ? (
          <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-3)" }}>Loading…</p>
        ) : routes.length === 0 ? (
          <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-3)" }}>
            Nothing yet — add your first note above.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {Array.from(groupedRoutes.entries()).sort((a, b) => a[0] - b[0]).map(([day, dayRoutes]) => (
              <div key={day} style={{ display: "grid", gridTemplateColumns: "140px 1fr", columnGap: 20 }}>
                <div style={{ position: "sticky", top: 24, alignSelf: "start" }}>
                  <Caps>Day {String(day).padStart(2, "0")}</Caps>
                  <div style={{
                    fontFamily: "var(--f-display)", fontSize: 22, letterSpacing: "-0.01em",
                    color: "var(--ink)", marginTop: 4,
                  }}>{dayWeekdayMap[day]}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--hair)", boxShadow: "inset 0 0 0 1px var(--hair)" }}>
                  {dayRoutes.map((route) => {
                    const titlePart = route.notes?.split(" · ")[0] ?? ""
                    const notesPart = route.notes?.split(" · ").slice(1).join(" · ") ?? ""
                    const hasLeg = route.fromLabel !== route.toLabel
                    return (
                      <div key={route.id} style={{ background: "var(--bg)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                          <h4 style={{ fontFamily: "var(--f-display)", fontSize: 20, letterSpacing: "-0.01em", margin: 0, color: "var(--ink)" }}>
                            {titlePart || route.fromLabel}
                          </h4>
                          <ModeBadge mode={route.mode} />
                        </div>
                        {hasLeg ? (
                          <p style={{ fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--ink-3)", margin: 0 }}>
                            {route.fromLabel} → {route.toLabel}
                          </p>
                        ) : null}
                        {notesPart ? (
                          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, fontStyle: "italic" }}>{notesPart}</p>
                        ) : null}
                        {route.estimatedCost > 0 ? (
                          <p style={{ fontFamily: "var(--f-mono)", fontSize: 13, color: "var(--ink)", margin: 0 }}>
                            {formatMoney(route.estimatedCost, route.currency)}
                          </p>
                        ) : null}
                        {route.referenceUrl ? (
                          <a href={route.referenceUrl} target="_blank" rel="noreferrer" style={{
                            display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12,
                            color: "var(--accent-ink)", textDecoration: "none",
                            borderBottom: "1px solid var(--accent)", paddingBottom: 1, alignSelf: "flex-start",
                          }}>
                            <LinkIcon size={11} /> Link
                          </a>
                        ) : null}
                        <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 6 }}>
                          <Btn variant="ghost" onClick={() => handleEdit(route)} style={{ flex: 1 }}>
                            <PencilIcon size={11} /> Edit
                          </Btn>
                          <Btn variant="danger" onClick={() => handleDelete(route.id)} style={{ flex: 1 }}>
                            <Trash2Icon size={11} /> Delete
                          </Btn>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{
          display: "flex", alignItems: "center", gap: 8, marginTop: 24,
          fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ink-4)",
          letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          <RouteIcon size={12} /> Transit status syncs automatically
        </p>
      </section>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
 * International — full planner with suggestions + map
 * ───────────────────────────────────────────────────────────── */

function TransitPageBody({ trip }: { trip: Trip }) {
  const updateTrip = useUpdateTrip()

  const [routes, setRoutes] = React.useState<TransitRoute[]>([])
  const [routesLoaded, setRoutesLoaded] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    getTripTransitRoutesFromSupabase(trip.id).then((rows) => {
      if (cancelled) return
      const sorted = sortRoutes(rows)
      setRoutes(sorted)
      updateTrip(trip.id, { transitRoutes: sorted, transitSaved: sorted.length > 0 })
      setRoutesLoaded(true)
    })
    return () => { cancelled = true }
  }, [trip.id, updateTrip])

  const [dayIndex, setDayIndex] = React.useState<number>(1)
  const [fromLabel, setFromLabel] = React.useState("")
  const [toLabel, setToLabel] = React.useState("")
  const [timeFilterMode, setTimeFilterMode] = React.useState<TimeFilterMode>("depart")
  const [departureTime, setDepartureTime] = React.useState("")
  const [arrivalByTime, setArrivalByTime] = React.useState("")

  const [providerLoading, setProviderLoading] = React.useState(false)
  const [providerError, setProviderError] = React.useState<string | null>(null)
  const [suggestions, setSuggestions] = React.useState<TransitSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = React.useState<number>(0)

  const [manualDraft, setManualDraft] = React.useState<ManualDraft>(buildEmptyDraft())
  const [manualError, setManualError] = React.useState<string | null>(null)
  const [editingRouteId, setEditingRouteId] = React.useState<string | null>(null)
  const [inputTab, setInputTab] = React.useState<"route" | "manual">("route")

  const [mapPreview, setMapPreview] = React.useState<MapPreview | null>(null)
  const [bulkText, setBulkText] = React.useState("")

  const dayOptions = React.useMemo(
    () => Array.from({ length: trip.totalDays }, (_, idx) => idx + 1), [trip.totalDays]
  )
  const dayWeekdayMap = React.useMemo(
    () => buildDayWeekdayMap(trip.startDate, trip.totalDays), [trip.startDate, trip.totalDays]
  )
  const mapEmbedUrl = React.useMemo(() => buildEmbedMapUrl(mapPreview), [mapPreview])
  const mapStaticUrl = React.useMemo(() => buildStaticMapUrl(mapPreview), [mapPreview])

  React.useEffect(() => {
    if (!departureTime && !arrivalByTime) {
      if (timeFilterMode === "depart") setDepartureTime(buildTripDayDateTime(trip.startDate, dayIndex, 9, 0))
      else setArrivalByTime(buildTripDayDateTime(trip.startDate, dayIndex, 9, 0))
      return
    }
    if (departureTime) setDepartureTime((prev) => applyDayToDateTime(prev, trip.startDate, dayIndex))
    if (arrivalByTime) setArrivalByTime((prev) => applyDayToDateTime(prev, trip.startDate, dayIndex))
  }, [arrivalByTime, dayIndex, departureTime, timeFilterMode, trip.startDate])

  React.useEffect(() => {
    setManualDraft((prev) => {
      const nextDeparture = applyDayToDateTime(prev.departureTimeLocal, trip.startDate, prev.dayIndex)
      const nextArrival = applyDayToDateTime(prev.arrivalTimeLocal, trip.startDate, prev.dayIndex)
      if (nextDeparture === prev.departureTimeLocal && nextArrival === prev.arrivalTimeLocal) return prev
      return { ...prev, departureTimeLocal: nextDeparture, arrivalTimeLocal: nextArrival }
    })
  }, [trip.startDate, manualDraft.dayIndex])

  function syncManualFromLookup() {
    setManualDraft((prev) => ({
      ...prev, dayIndex, fromLabel, toLabel,
      departureTimeLocal: departureTime, arrivalTimeLocal: arrivalByTime,
      provider: "manual", providerRouteRef: "",
    }))
    setMapPreview({
      fromLabel, toLabel, mode: "walk_mix",
      label: `${fromLabel} → ${toLabel}`, providerRouteRef: "",
      departureTimeLocal: timeFilterMode === "depart" ? departureTime || undefined : undefined,
      arrivalTimeLocal: timeFilterMode === "arrive" ? arrivalByTime || undefined : undefined,
    })
  }

  function syncStore(next: TransitRoute[]) {
    const sorted = sortRoutes(next)
    setRoutes(sorted)
    updateTrip(trip.id, { transitRoutes: sorted, transitSaved: sorted.length > 0 })
  }

  async function handleFindSuggestions() {
    const origin = fromLabel.trim()
    const destination = toLabel.trim()
    setManualError(null); setProviderError(null)
    if (!origin || !destination) { setProviderError("Enter both origin and destination."); return }
    if (origin.toLowerCase() === destination.toLowerCase()) { setProviderError("Origin and destination must be different."); return }

    let departureTimeParam = timeFilterMode === "depart" ? departureTime || undefined : undefined
    const arrivalTimeParam = timeFilterMode === "arrive" ? arrivalByTime || undefined : undefined
    if (!departureTimeParam && !arrivalTimeParam) {
      const fallback = buildTripDayDateTime(trip.startDate, dayIndex, 9, 0)
      departureTimeParam = fallback
      setDepartureTime(fallback); setArrivalByTime(""); setTimeFilterMode("depart")
    }
    syncManualFromLookup()
    setProviderLoading(true)
    try {
      const res = await fetch("/api/transit/suggest", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin, destination, day_index: dayIndex,
          departure_time: departureTimeParam, arrival_time: arrivalTimeParam,
        }),
      })
      const payload = (await res.json()) as SuggestResponse
      if (!res.ok || !payload.ok) {
        setSuggestions([])
        setProviderError(payload.error || "Transit provider is unavailable. Use manual save below.")
        return
      }
      const nextOptions = (payload.data ?? []).slice(0, 3)
      setSuggestions(nextOptions); setSelectedSuggestion(0)
      if (nextOptions.length === 0) {
        setProviderError("No alternatives found. You can still save this leg manually.")
      } else {
        const first = nextOptions[0]
        setProviderError(null)
        setMapPreview({
          fromLabel: origin, toLabel: destination, mode: first.mode,
          label: first.summaryLabel, providerRouteRef: first.providerRouteRef,
          departureTimeLocal: first.departureTimeLocal ?? departureTimeParam,
          arrivalTimeLocal: first.arrivalTimeLocal ?? arrivalTimeParam,
        })
      }
    } catch {
      setSuggestions([])
      setProviderError("Transit lookup failed. You can continue with manual save for this route.")
    } finally {
      setProviderLoading(false)
    }
  }

  function handleUseSuggestionForManual(index: number) {
    const option = suggestions[index]
    if (!option) return
    setSelectedSuggestion(index)
    setManualDraft(buildDraftFromSuggestion(option, dayIndex, fromLabel, toLabel))
    setMapPreview({
      fromLabel, toLabel, mode: option.mode, label: option.summaryLabel,
      providerRouteRef: option.providerRouteRef,
      departureTimeLocal: option.departureTimeLocal, arrivalTimeLocal: option.arrivalTimeLocal,
    })
  }

  function validateManualDraft(draft: ManualDraft): string | null {
    if (!draft.fromLabel.trim() || !draft.toLabel.trim()) return "From and To are required."
    if (draft.fromLabel.trim().toLowerCase() === draft.toLabel.trim().toLowerCase()) return "From and To cannot be the same location."
    if (draft.dayIndex < 1 || draft.dayIndex > trip.totalDays) return `Day must be between 1 and ${trip.totalDays}.`
    const duration = Number(draft.durationMinutes)
    if (!Number.isFinite(duration) || duration <= 0) return "Duration must be greater than 0."
    const cost = Number(draft.estimatedCost)
    if (!Number.isFinite(cost) || cost < 0) return "Estimated cost must be 0 or higher."
    if (draft.departureTimeLocal && draft.arrivalTimeLocal) {
      const departureDate = new Date(draft.departureTimeLocal)
      const arrivalDate = new Date(draft.arrivalTimeLocal)
      if (!Number.isNaN(departureDate.getTime()) && !Number.isNaN(arrivalDate.getTime()) &&
          arrivalDate.getTime() < departureDate.getTime()) {
        return "Arrival time cannot be earlier than departure time."
      }
    }
    return null
  }

  async function handleSaveManual() {
    const error = validateManualDraft(manualDraft)
    if (error) { setManualError(error); return }
    setManualError(null)
    const now = new Date().toISOString()
    const existingRoute = editingRouteId ? routes.find((route) => route.id === editingRouteId) : undefined
    const normalizedRoute: TransitRoute = {
      id: editingRouteId ?? crypto.randomUUID(),
      tripId: trip.id, dayIndex: manualDraft.dayIndex,
      fromLabel: manualDraft.fromLabel.trim(), toLabel: manualDraft.toLabel.trim(),
      mode: manualDraft.mode, durationMinutes: Number(manualDraft.durationMinutes),
      departureTimeLocal: manualDraft.departureTimeLocal || undefined,
      arrivalTimeLocal: manualDraft.arrivalTimeLocal || undefined,
      estimatedCost: Number(manualDraft.estimatedCost),
      currency: manualDraft.currency.trim() || "USD",
      provider: manualDraft.provider,
      providerRouteRef: manualDraft.providerRouteRef || undefined,
      referenceUrl: manualDraft.referenceUrl.trim() || undefined,
      transfers: manualDraft.transfers ? Number(manualDraft.transfers) : undefined,
      walkingMinutes: manualDraft.walkingMinutes ? Number(manualDraft.walkingMinutes) : undefined,
      notes: manualDraft.notes.trim() || undefined,
      createdAt: existingRoute?.createdAt || now, updatedAt: now,
    }
    try {
      await saveTripTransitRouteToSupabase(trip.id, normalizedRoute)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save route"); return
    }
    const nextRoutes = editingRouteId
      ? routes.map((route) => (route.id === editingRouteId ? normalizedRoute : route))
      : [...routes, normalizedRoute]
    syncStore(nextRoutes)
    toast.success(editingRouteId ? "Transit route updated" : "Transit route saved")
    setMapPreview({
      fromLabel: normalizedRoute.fromLabel, toLabel: normalizedRoute.toLabel,
      mode: normalizedRoute.mode,
      label: `${normalizedRoute.fromLabel} → ${normalizedRoute.toLabel}`,
      providerRouteRef: normalizedRoute.providerRouteRef,
      departureTimeLocal: normalizedRoute.departureTimeLocal,
      arrivalTimeLocal: normalizedRoute.arrivalTimeLocal,
    })
    setEditingRouteId(null); setManualDraft(buildEmptyDraft())
    setSuggestions([]); setProviderError(null)
    setFromLabel(""); setToLabel("")
    setDepartureTime(""); setArrivalByTime("")
  }

  async function handleSaveSelectedSuggestion() {
    const selected = suggestions[selectedSuggestion]
    if (!selected) return
    const draft = buildDraftFromSuggestion(selected, dayIndex, fromLabel, toLabel)
    const immediateRoute: TransitRoute = {
      id: crypto.randomUUID(), tripId: trip.id, dayIndex: draft.dayIndex,
      fromLabel: draft.fromLabel, toLabel: draft.toLabel, mode: draft.mode,
      durationMinutes: Number(draft.durationMinutes),
      departureTimeLocal: draft.departureTimeLocal || undefined,
      arrivalTimeLocal: draft.arrivalTimeLocal || undefined,
      estimatedCost: draft.estimatedCost === "" ? 0 : Number(draft.estimatedCost),
      currency: draft.currency, provider: "google_maps",
      providerRouteRef: draft.providerRouteRef || undefined,
      referenceUrl: draft.referenceUrl.trim() || undefined,
      transfers: draft.transfers ? Number(draft.transfers) : undefined,
      walkingMinutes: draft.walkingMinutes ? Number(draft.walkingMinutes) : undefined,
      notes: draft.notes || undefined,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    try {
      await saveTripTransitRouteToSupabase(trip.id, immediateRoute)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save route"); return
    }
    syncStore([...routes, immediateRoute])
    toast.success("Transit route saved")
    setMapPreview({
      fromLabel: immediateRoute.fromLabel, toLabel: immediateRoute.toLabel,
      mode: immediateRoute.mode, label: selected.summaryLabel,
      providerRouteRef: immediateRoute.providerRouteRef,
      departureTimeLocal: immediateRoute.departureTimeLocal,
      arrivalTimeLocal: immediateRoute.arrivalTimeLocal,
    })
  }

  function handleEditRoute(route: TransitRoute) {
    setInputTab("manual"); setEditingRouteId(route.id); setManualError(null)
    setManualDraft({
      dayIndex: route.dayIndex, fromLabel: route.fromLabel, toLabel: route.toLabel,
      mode: route.mode, durationMinutes: String(route.durationMinutes),
      departureTimeLocal: route.departureTimeLocal ?? "",
      arrivalTimeLocal: route.arrivalTimeLocal ?? "",
      estimatedCost: String(route.estimatedCost), currency: route.currency,
      transfers: typeof route.transfers === "number" ? String(route.transfers) : "",
      walkingMinutes: typeof route.walkingMinutes === "number" ? String(route.walkingMinutes) : "",
      notes: route.notes ?? "", referenceUrl: route.referenceUrl ?? "",
      provider: route.provider, providerRouteRef: route.providerRouteRef ?? "",
    })
    setMapPreview({
      fromLabel: route.fromLabel, toLabel: route.toLabel, mode: route.mode,
      label: `${route.fromLabel} → ${route.toLabel}`,
      providerRouteRef: route.providerRouteRef,
      departureTimeLocal: route.departureTimeLocal,
      arrivalTimeLocal: route.arrivalTimeLocal,
    })
  }

  async function handleDeleteRoute(routeId: string) {
    try {
      await deleteTripTransitRouteFromSupabase(trip.id, routeId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete route"); return
    }
    const nextRoutes = routes.filter((route) => route.id !== routeId)
    syncStore(nextRoutes)
    toast.success("Transit route deleted")
    setMapPreview((prev) => {
      if (!prev) return prev
      const deleted = routes.find((route) => route.id === routeId)
      if (!deleted) return prev
      if (prev.fromLabel === deleted.fromLabel && prev.toLabel === deleted.toLabel) return null
      return prev
    })
  }

  async function handleImportFromText() {
    const parsed = parseRoutePairsFromText(bulkText)
    if (parsed.length === 0) {
      toast.error("No route pairs found. Use lines like Berlin - Dresden."); return
    }
    const now = new Date().toISOString()
    const importedRoutes: TransitRoute[] = parsed.map((entry, idx) => ({
      id: crypto.randomUUID(), tripId: trip.id, dayIndex,
      fromLabel: entry.fromLabel, toLabel: entry.toLabel,
      mode: "other" as TransitMode, durationMinutes: 60,
      departureTimeLocal: undefined, arrivalTimeLocal: undefined,
      estimatedCost: 0, currency: "USD", provider: "manual" as const,
      providerRouteRef: undefined, referenceUrl: entry.referenceUrl,
      transfers: undefined, walkingMinutes: undefined,
      notes: `Imported from notes (${idx + 1})`,
      createdAt: now, updatedAt: now,
    }))
    try {
      await Promise.all(importedRoutes.map((r) => saveTripTransitRouteToSupabase(trip.id, r)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import routes"); return
    }
    syncStore([...routes, ...importedRoutes])
    toast.success(`Imported ${importedRoutes.length} transit route(s)`)
    setBulkText("")
  }

  const groupedRoutes = React.useMemo(() => {
    const grouped = new Map<number, TransitRoute[]>()
    for (const route of routes) {
      const existing = grouped.get(route.dayIndex) ?? []
      existing.push(route); grouped.set(route.dayIndex, existing)
    }
    return grouped
  }, [routes])

  const externalMapUrl = mapPreview
    ? (mapEmbedUrl || buildDirectionsUrl(mapPreview.fromLabel, mapPreview.toLabel))
    : null

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 0", marginRight: 24, fontSize: 13, fontWeight: 500,
    color: active ? "var(--ink)" : "var(--ink-3)", cursor: "pointer",
    borderBottom: active ? "2px solid var(--ink)" : "2px solid transparent",
    background: "transparent", border: "none", borderBottomWidth: 2,
    borderBottomStyle: "solid", fontFamily: "inherit",
  })

  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--f-ui)", padding: "8px 0 48px" }}>
      {/* Hero */}
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Caps>Transit planner</Caps>
          <span style={{ width: 28, height: 1, background: "var(--hair-2)" }} />
          <Caps>{trip.totalDays} days</Caps>
        </div>
        <h1 style={{
          fontFamily: "var(--f-display)", fontSize: 64, letterSpacing: "-0.025em",
          lineHeight: 1.02, margin: "16px 0 0", color: "var(--ink)",
          textWrap: "balance" as any, maxWidth: 900,
        }}>
          A→B, day by day.
          <span style={{ fontStyle: "italic", color: "var(--accent-ink)" }}> Mapped.</span>
        </h1>
        <p style={{ marginTop: 16, fontSize: 16, color: "var(--ink-2)", maxWidth: 620, lineHeight: 1.55 }}>
          Save day-linked legs, compare options from your provider, and keep a live route map visible while you confirm the details.
        </p>
      </header>

      {/* Two-column — planner left, map right (sticky) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 420px)", columnGap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 56, minWidth: 0 }}>
          {/* Input mode tabs */}
          <section>
            <SectionHead kicker="Step 01" title="Plan a leg" />
            <div style={{ display: "flex", borderBottom: "1px solid var(--hair)", marginBottom: 24 }}>
              <button onClick={() => setInputTab("route")} style={tabStyle(inputTab === "route")}>Find options</button>
              <button onClick={() => setInputTab("manual")} style={tabStyle(inputTab === "manual")}>Enter manually</button>
            </div>

            {inputTab === "route" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr", gap: 16 }}>
                  <Field label="Day">
                    <Select value={String(dayIndex)} onValueChange={(value) => setDayIndex(Number(value))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select day" /></SelectTrigger>
                      <SelectContent>
                        {dayOptions.map((day) => (
                          <SelectItem key={day} value={String(day)}>Day {day} · {dayWeekdayMap[day]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="From — point A">
                    <TransitPlaceSearch value={fromLabel} onChange={setFromLabel} placeholder="Origin" />
                  </Field>
                  <Field label="To — point B">
                    <TransitPlaceSearch value={toLabel} onChange={setToLabel} placeholder="Destination" />
                  </Field>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
                  <Field label="Time filter">
                    <Select value={timeFilterMode} onValueChange={(value) => setTimeFilterMode(value as TimeFilterMode)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="depart">Leave at</SelectItem>
                        <SelectItem value="arrive">Arrive by</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={timeFilterMode === "depart" ? "Departure time" : "Arrive by"}>
                    <Input
                      type="datetime-local"
                      value={timeFilterMode === "depart" ? departureTime : arrivalByTime}
                      onChange={(event) => {
                        if (timeFilterMode === "depart") {
                          setDepartureTime(event.target.value)
                          if (event.target.value) setArrivalByTime("")
                        } else {
                          setArrivalByTime(event.target.value)
                          if (event.target.value) setDepartureTime("")
                        }
                      }}
                    />
                  </Field>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { label: "Morning", h: 8 },
                      { label: "Midday", h: 13 },
                      { label: "Evening", h: 18 },
                    ].map((q) => (
                      <Btn key={q.label} variant="ghost" onClick={() => {
                        const value = buildTripDayDateTime(trip.startDate, dayIndex, q.h, 0)
                        if (timeFilterMode === "depart") setDepartureTime(value)
                        else setArrivalByTime(value)
                      }}>{q.label}</Btn>
                    ))}
                  </div>
                  <Btn variant="primary" onClick={handleFindSuggestions} disabled={providerLoading}>
                    {providerLoading ? "Finding options…" : "Find transit options"}
                    {!providerLoading && <ArrowRightIcon size={13} />}
                  </Btn>
                </div>
                <p style={{
                  fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ink-4)",
                  letterSpacing: "0.04em", margin: 0,
                }}>
                  No time set? We search at 9:00 AM on the selected trip day — never “leave now.”
                </p>
              </div>
            ) : null}
          </section>

          {/* Suggestions */}
          {inputTab === "route" ? (
            <section>
              <SectionHead kicker="Step 02" title="Pick a route" count={suggestions.length || "—"} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {providerError ? <Alert title="Provider lookup issue">{providerError}</Alert> : null}

                {suggestions.length > 0 ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {suggestions.map((option, idx) => {
                        const active = selectedSuggestion === idx
                        return (
                          <button
                            type="button" key={`${option.summaryLabel}-${idx}`}
                            onClick={() => handleUseSuggestionForManual(idx)}
                            style={{
                              all: "unset", cursor: "pointer", display: "grid",
                              gridTemplateColumns: "48px 1fr auto", columnGap: 18,
                              padding: "20px 0", borderBottom: "1px solid var(--hair)",
                              borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                              paddingLeft: active ? 18 : 20,
                              background: active ? "var(--accent-soft)" : "transparent",
                              transition: "background 120ms, border-color 120ms",
                            }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ink-4)" }}>
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                              <span style={{ width: 20, height: 4, background: modeSwatch[option.mode], borderRadius: 2 }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                                <h4 style={{
                                  fontFamily: "var(--f-display)", fontSize: 22, letterSpacing: "-0.01em",
                                  margin: 0, color: "var(--ink)",
                                }}>{option.summaryLabel}</h4>
                                <ModeBadge mode={option.mode} />
                              </div>
                              <div style={{
                                marginTop: 8, display: "flex", flexWrap: "wrap", gap: 16,
                                fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--ink-2)",
                              }}>
                                <span><ClockIcon size={11} style={{ verticalAlign: "-1px", marginRight: 4, color: "var(--ink-4)" }} />{option.durationMinutes}m</span>
                                <span>{option.transfers} transfer{option.transfers === 1 ? "" : "s"}</span>
                                <span>{option.walkingMinutes}m walk</span>
                                <span style={{ color: "var(--ink-3)" }}>
                                  {option.estimatedCost === null ? "Fare unavailable" : formatMoney(option.estimatedCost, option.currency)}
                                </span>
                              </div>
                              <p style={{
                                marginTop: 4, fontSize: 12, color: "var(--ink-3)", fontStyle: "italic",
                              }}>
                                {formatTime(option.departureTimeLocal)} → {formatTime(option.arrivalTimeLocal)}
                              </p>
                            </div>
                            <div style={{ alignSelf: "center" }}>
                              {active ? (
                                <span style={{
                                  fontFamily: "var(--f-mono)", fontSize: 10, letterSpacing: "0.1em",
                                  textTransform: "uppercase", color: "var(--accent-ink)",
                                }}>Selected</span>
                              ) : null}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                      <Btn variant="primary" onClick={handleSaveSelectedSuggestion}>Save selected route</Btn>
                      <Btn onClick={() => { setInputTab("manual"); syncManualFromLookup(); setManualError(null) }}>
                        Or refine manually
                      </Btn>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-3)", margin: 0 }}>
                    No suggestions yet — run a lookup above, or switch to manual entry.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {/* Manual */}
          {inputTab === "manual" ? (
            <section>
              <SectionHead kicker={editingRouteId ? "Editing" : "Step 03"} title={editingRouteId ? "Update a saved route" : "Save manually"} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {manualError ? <Alert title="Cannot save route">{manualError}</Alert> : null}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
                  <Field label="Day">
                    <Select value={String(manualDraft.dayIndex)} onValueChange={(value) => setManualDraft((prev) => ({ ...prev, dayIndex: Number(value) }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {dayOptions.map((day) => (
                          <SelectItem key={day} value={String(day)}>Day {day} · {dayWeekdayMap[day]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="From">
                    <TransitPlaceSearch value={manualDraft.fromLabel} onChange={(value) => setManualDraft((prev) => ({ ...prev, fromLabel: value }))} placeholder="Point A" />
                  </Field>
                  <Field label="To">
                    <TransitPlaceSearch value={manualDraft.toLabel} onChange={(value) => setManualDraft((prev) => ({ ...prev, toLabel: value }))} placeholder="Point B" />
                  </Field>
                  <Field label="Mode">
                    <Select value={manualDraft.mode} onValueChange={(value) => setManualDraft((prev) => ({ ...prev, mode: value as TransitMode }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {modeOptions.map((mode) => <SelectItem key={mode} value={mode}>{modeLabels[mode]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <Field label="Duration (minutes)">
                    <Input type="number" min="1" value={manualDraft.durationMinutes} onChange={(event) => setManualDraft((prev) => ({ ...prev, durationMinutes: event.target.value }))} />
                  </Field>
                  <Field label="Estimated cost">
                    <Input type="number" min="0" step="0.01" value={manualDraft.estimatedCost} onChange={(event) => setManualDraft((prev) => ({ ...prev, estimatedCost: event.target.value }))} />
                  </Field>
                  <Field label="Currency">
                    <Input value={manualDraft.currency} onChange={(event) => setManualDraft((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))} />
                  </Field>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Departure time">
                    <Input type="datetime-local" value={manualDraft.departureTimeLocal} onChange={(event) => setManualDraft((prev) => ({ ...prev, departureTimeLocal: event.target.value }))} />
                  </Field>
                  <Field label="Arrival time">
                    <Input type="datetime-local" value={manualDraft.arrivalTimeLocal} onChange={(event) => setManualDraft((prev) => ({ ...prev, arrivalTimeLocal: event.target.value }))} />
                  </Field>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="Transfers (optional)">
                    <Input type="number" min="0" value={manualDraft.transfers} onChange={(event) => setManualDraft((prev) => ({ ...prev, transfers: event.target.value }))} />
                  </Field>
                  <Field label="Walking minutes (optional)">
                    <Input type="number" min="0" value={manualDraft.walkingMinutes} onChange={(event) => setManualDraft((prev) => ({ ...prev, walkingMinutes: event.target.value }))} />
                  </Field>
                </div>

                <Field label="Reference link (optional)">
                  <Input value={manualDraft.referenceUrl} onChange={(event) => setManualDraft((prev) => ({ ...prev, referenceUrl: event.target.value }))} placeholder="https://..." />
                </Field>
                <Field label="Notes (optional)">
                  <Textarea value={manualDraft.notes} onChange={(event) => setManualDraft((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Stop details, station exits, payment notes" />
                </Field>

                <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                  <Btn variant="primary" onClick={handleSaveManual}>
                    {editingRouteId ? "Update route" : "Save route"}
                  </Btn>
                  {editingRouteId ? (
                    <Btn onClick={() => { setEditingRouteId(null); setManualError(null); setManualDraft(buildEmptyDraft()) }}>Cancel edit</Btn>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          {/* Saved routes */}
          <section>
            <SectionHead kicker="Your routes" title="Saved" count={routes.length} />

            <div style={{ marginBottom: 28, padding: "16px 18px", borderLeft: "2px solid var(--accent)", background: "var(--panel)" }}>
              <Caps style={{ display: "block", marginBottom: 8 }}>Import from notes · optional</Caps>
              <Textarea value={bulkText} onChange={(event) => setBulkText(event.target.value)} placeholder="Paste lines like: Berlin - Dresden" />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <Btn onClick={handleImportFromText}>Import pasted text</Btn>
              </div>
            </div>

            {!routesLoaded ? (
              <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-3)" }}>Loading…</p>
            ) : routes.length === 0 ? (
              <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-3)" }}>No saved transit routes yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {Array.from(groupedRoutes.entries()).sort((a, b) => a[0] - b[0]).map(([day, dayRoutes]) => (
                  <div key={day} style={{ display: "grid", gridTemplateColumns: "140px 1fr", columnGap: 20 }}>
                    <div>
                      <Caps>Day {String(day).padStart(2, "0")}</Caps>
                      <div style={{
                        fontFamily: "var(--f-display)", fontSize: 22, letterSpacing: "-0.01em",
                        color: "var(--ink)", marginTop: 4,
                      }}>{dayWeekdayMap[day]}</div>
                    </div>
                    <div>
                      {dayRoutes.map((route) => (
                        <div key={route.id} style={{
                          display: "grid", gridTemplateColumns: "1fr auto", gap: 16,
                          padding: "18px 0", borderBottom: "1px solid var(--hair)",
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                              <h4 style={{
                                fontFamily: "var(--f-display)", fontSize: 22, letterSpacing: "-0.01em",
                                margin: 0, color: "var(--ink)",
                              }}>
                                {route.fromLabel} <span style={{ color: "var(--ink-4)", fontStyle: "italic" }}>to</span> {route.toLabel}
                              </h4>
                              <ModeBadge mode={route.mode} />
                            </div>
                            <p style={{
                              fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--ink-3)",
                              margin: "4px 0 0",
                            }}>
                              {formatTime(route.departureTimeLocal)} → {formatTime(route.arrivalTimeLocal)}
                            </p>
                            <div style={{
                              marginTop: 8, display: "flex", flexWrap: "wrap", gap: 16,
                              fontFamily: "var(--f-mono)", fontSize: 12, color: "var(--ink-2)",
                            }}>
                              <span>{route.durationMinutes}m</span>
                              <span>{formatMoney(route.estimatedCost, route.currency)}</span>
                              <span>{route.transfers ?? 0} transfer{(route.transfers ?? 0) === 1 ? "" : "s"}</span>
                              <span style={{
                                color: "var(--ink-4)", textTransform: "uppercase",
                                letterSpacing: "0.06em", fontSize: 10,
                              }}>
                                {route.provider === "google_maps" ? "Google Maps" : "Manual"}
                              </span>
                            </div>
                            {route.referenceUrl ? (
                              <a href={route.referenceUrl} target="_blank" rel="noreferrer" style={{
                                display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12,
                                color: "var(--accent-ink)", textDecoration: "none",
                                borderBottom: "1px solid var(--accent)", paddingBottom: 1, marginTop: 8,
                              }}>
                                <LinkIcon size={11} /> Source
                              </a>
                            ) : null}
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                            <Btn variant="ghost" onClick={() => setMapPreview({
                              fromLabel: route.fromLabel, toLabel: route.toLabel, mode: route.mode,
                              label: `${route.fromLabel} → ${route.toLabel}`,
                              providerRouteRef: route.providerRouteRef,
                              departureTimeLocal: route.departureTimeLocal,
                              arrivalTimeLocal: route.arrivalTimeLocal,
                            })}>
                              <EyeIcon size={12} /> Preview
                            </Btn>
                            <Btn variant="ghost" onClick={() => handleEditRoute(route)}>
                              <PencilIcon size={12} /> Edit
                            </Btn>
                            <Btn variant="danger" onClick={() => handleDeleteRoute(route.id)}>
                              <Trash2Icon size={12} />
                            </Btn>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p style={{
              display: "flex", alignItems: "center", gap: 8, marginTop: 24,
              fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ink-4)",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              <RouteIcon size={12} /> Transit status syncs automatically
            </p>
          </section>
        </div>

        {/* ───── Sticky Map Panel ───── */}
        <aside style={{ position: "relative", minWidth: 0 }}>
          <div style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              paddingBottom: 12, borderBottom: "1px solid var(--hair)",
            }}>
              <Caps>Map preview</Caps>
              {mapPreview ? <ModeBadge mode={mapPreview.mode} /> : null}
            </div>

            {mapPreview ? (
              <>
                <div>
                  <h3 style={{
                    fontFamily: "var(--f-display)", fontSize: 22, letterSpacing: "-0.01em",
                    lineHeight: 1.15, margin: 0, color: "var(--ink)",
                  }}>
                    {mapPreview.fromLabel}
                    <span style={{ color: "var(--ink-4)", fontStyle: "italic" }}> to </span>
                    {mapPreview.toLabel}
                  </h3>
                  <p style={{
                    fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ink-3)",
                    letterSpacing: "0.04em", margin: "6px 0 0",
                  }}>
                    {mapPreview.label}
                  </p>
                </div>

                <div style={{
                  position: "relative", width: "100%", aspectRatio: "4 / 5",
                  background: "var(--panel)", boxShadow: "inset 0 0 0 1px var(--hair)",
                  overflow: "hidden",
                }}>
                  {mapStaticUrl ? (
                    <img src={mapStaticUrl} alt="Transit route preview"
                         style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : mapEmbedUrl ? (
                    <iframe title="Transit route map" src={mapEmbedUrl} loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            style={{ width: "100%", height: "100%", border: 0, display: "block" }} />
                  ) : (
                    <div style={{
                      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", padding: 24, gap: 10, textAlign: "center",
                    }}>
                      <MapPinIcon size={28} strokeWidth={1.2} style={{ color: "var(--ink-4)" }} />
                      <div style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic", maxWidth: 240 }}>
                        Set <code style={{ fontFamily: "var(--f-mono)", fontSize: 11 }}>
                          NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY
                        </code> to see the live route.
                      </div>
                    </div>
                  )}
                </div>

                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
                  paddingTop: 12, borderTop: "1px solid var(--hair)",
                }}>
                  <div>
                    <Caps style={{ fontSize: 10 }}>Depart</Caps>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 13, color: "var(--ink)", marginTop: 4 }}>
                      {formatTime(mapPreview.departureTimeLocal)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Caps style={{ fontSize: 10 }}>Arrive</Caps>
                    <div style={{ fontFamily: "var(--f-mono)", fontSize: 13, color: "var(--ink)", marginTop: 4 }}>
                      {formatTime(mapPreview.arrivalTimeLocal)}
                    </div>
                  </div>
                </div>

                {externalMapUrl ? (
                  <a href={externalMapUrl} target="_blank" rel="noreferrer" style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "12px 16px", background: "var(--ink)", color: "var(--bg)",
                    fontSize: 13, fontWeight: 500, textDecoration: "none", width: "100%",
                  }}>
                    Open in Google Maps
                    <ExternalLinkIcon size={13} />
                  </a>
                ) : null}
              </>
            ) : (
              <div style={{
                padding: "48px 24px", textAlign: "center", background: "var(--panel)",
                boxShadow: "inset 0 0 0 1px var(--hair)",
              }}>
                <MapPinIcon size={28} strokeWidth={1.2} style={{ color: "var(--ink-4)", marginBottom: 10 }} />
                <p style={{ fontSize: 13, fontStyle: "italic", color: "var(--ink-3)", margin: 0, maxWidth: 260, marginInline: "auto" }}>
                  Choose a suggestion or tap Preview on a saved route — the map lives here.
                </p>
              </div>
            )}

            <div style={{
              padding: "14px 0", borderTop: "1px solid var(--hair)",
              display: "grid", gap: 8,
              fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--ink-4)",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              <span>01 · Enter Day, A, B</span>
              <span>02 · Fetch options, pick a route</span>
              <span>03 · Save or refine manually</span>
              <span>04 · Preview visually, anytime</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
