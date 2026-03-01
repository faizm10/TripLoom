"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BotIcon, Loader2Icon, SendIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"

import {
  useCreateTrip,
  useTripItineraryActions,
  useUpdateTrip,
} from "@/components/providers/trips-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  postPlannerChat,
  type AiMessage,
  type AiSource,
  type PlannerDraft,
} from "@/lib/ai-backend"
import type { TripItineraryItem } from "@/lib/trips"

const STORAGE_KEY = "triploom_agent_session_v1"

type PlannerIntake = {
  country: string
  tripScope: "single_city" | "multi_city"
  cities: string
  tripBrief: string
}

type PlannerSession = {
  intake: PlannerIntake
  messages: AiMessage[]
  livingBrief: string
  draftTrip: PlannerDraft
  sources: AiSource[]
  degraded: boolean
  updatedAt: string
}

const defaultIntake: PlannerIntake = {
  country: "",
  tripScope: "single_city",
  cities: "",
  tripBrief: "",
}

const defaultSession: PlannerSession = {
  intake: defaultIntake,
  messages: [],
  livingBrief: "",
  draftTrip: {},
  sources: [],
  degraded: false,
  updatedAt: new Date().toISOString(),
}

const allowedTimeBlocks = new Set(["morning", "afternoon", "evening"])
const allowedCategories = new Set([
  "outbound_flight",
  "inbound_flight",
  "commute",
  "activities",
  "games",
  "food",
  "sightseeing",
  "shopping",
  "rest",
  "other",
])

function splitCities(raw?: string): string[] {
  if (!raw) return []
  const seen = new Set<string>()
  return raw
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter((part) => {
      if (!part) return false
      const key = part.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function buildSeedMessage(intake: PlannerIntake): string {
  return [
    "I want to plan a trip and set realistic expectations.",
    `Country: ${intake.country || "not provided"}`,
    `Trip scope: ${intake.tripScope}`,
    `Cities: ${intake.cities || "not provided"}`,
    "Trip brief:",
    intake.tripBrief,
    "Ask me targeted follow-up questions if anything important is missing.",
  ].join("\n")
}

function mergeDraft(existing: PlannerDraft, incoming?: PlannerDraft): PlannerDraft {
  if (!incoming) return existing
  return {
    destination: incoming.destination || existing.destination,
    country: incoming.country || existing.country,
    cities: incoming.cities && incoming.cities.length > 0 ? incoming.cities : existing.cities,
    startDate: incoming.startDate || existing.startDate,
    endDate: incoming.endDate || existing.endDate,
    travelers:
      typeof incoming.travelers === "number" && incoming.travelers > 0
        ? incoming.travelers
        : existing.travelers,
    budgetTotal:
      typeof incoming.budgetTotal === "number" && incoming.budgetTotal > 0
        ? incoming.budgetTotal
        : existing.budgetTotal,
    activities:
      incoming.activities && incoming.activities.length > 0
        ? incoming.activities
        : existing.activities,
    itinerary:
      incoming.itinerary && incoming.itinerary.length > 0
        ? incoming.itinerary
        : existing.itinerary,
  }
}

function resolveDestination(draft: PlannerDraft, intake: PlannerIntake): string {
  const fromDraft = draft.destination?.trim()
  if (fromDraft) return fromDraft

  const draftCities = (draft.cities ?? []).map((city) => city.trim()).filter(Boolean)
  const intakeCities = splitCities(intake.cities)
  const cities = draftCities.length > 0 ? draftCities : intakeCities
  if (cities.length > 1) return `${cities[0]} +${cities.length - 1} cities`
  if (cities.length === 1) return cities[0]

  return (draft.country || intake.country || "").trim()
}

function sanitizeDate(value?: string): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (/^20\d{2}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  return undefined
}

function inferDefaultDates(startDate?: string, endDate?: string): { startDate: string; endDate: string } {
  const parsedStart = sanitizeDate(startDate)
  const parsedEnd = sanitizeDate(endDate)
  if (parsedStart && parsedEnd) {
    return { startDate: parsedStart, endDate: parsedEnd }
  }
  const start = new Date()
  start.setDate(start.getDate() + 30)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return {
    startDate: parsedStart || start.toISOString().slice(0, 10),
    endDate: parsedEnd || end.toISOString().slice(0, 10),
  }
}

function normalizeTripId(destination: string): string {
  const slug = destination
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return `${slug || "trip"}-${Date.now().toString(36)}`
}

function calcTotalDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1)
}

function sanitizeTimeBlock(value?: string): "morning" | "afternoon" | "evening" {
  if (value && allowedTimeBlocks.has(value)) {
    return value as "morning" | "afternoon" | "evening"
  }
  return "afternoon"
}

function sanitizeCategory(value?: string): TripItineraryItem["category"] {
  if (value && allowedCategories.has(value)) {
    return value as TripItineraryItem["category"]
  }
  return "activities"
}

function toTripItineraryItems(tripId: string, draft: PlannerDraft): TripItineraryItem[] {
  const now = new Date().toISOString()
  const fromDraft = (draft.itinerary ?? []).map((item, index) => {
    const dayIndex = typeof item.dayIndex === "number" && item.dayIndex > 0 ? item.dayIndex : index + 1
    const title = item.title?.trim() || `Activity ${index + 1}`
    return {
      id: `${tripId}-agent-${index + 1}`,
      tripId,
      dayIndex,
      timeBlock: sanitizeTimeBlock(item.timeBlock),
      status: "planned" as const,
      category: sanitizeCategory(item.category),
      title,
      locationLabel: draft.destination || "Planned location",
      notes: item.notes?.trim() || "Drafted from Agent planner conversation.",
      sortOrder: (index + 1) * 10,
      createdAt: now,
      updatedAt: now,
    }
  })

  if (fromDraft.length > 0) return fromDraft

  return (draft.activities ?? []).slice(0, 7).map((activity, index) => ({
    id: `${tripId}-agent-${index + 1}`,
    tripId,
    dayIndex: index + 1,
    timeBlock: "afternoon",
    status: "planned",
    category: "activities",
    title: activity,
    locationLabel: draft.destination || "Planned location",
    notes: "Drafted from Agent planner conversation.",
    sortOrder: (index + 1) * 10,
    createdAt: now,
    updatedAt: now,
  }))
}

export function AgentPageContent() {
  const router = useRouter()
  const createTrip = useCreateTrip()
  const updateTrip = useUpdateTrip()
  const { setTripItineraryItems } = useTripItineraryActions()

  const [session, setSession] = React.useState<PlannerSession>(defaultSession)
  const [followUpInput, setFollowUpInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [isFinalizing, setIsFinalizing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [storageWarning, setStorageWarning] = React.useState<string | null>(null)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as PlannerSession
      if (!parsed || typeof parsed !== "object") return
      const intake = parsed.intake || ({} as Partial<PlannerIntake>)
      setSession({
        intake: {
          country: typeof intake.country === "string" ? intake.country : defaultIntake.country,
          tripScope: intake.tripScope === "multi_city" ? "multi_city" : "single_city",
          cities: typeof intake.cities === "string" ? intake.cities : defaultIntake.cities,
          tripBrief: typeof intake.tripBrief === "string" ? intake.tripBrief : defaultIntake.tripBrief,
        },
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        livingBrief: typeof parsed.livingBrief === "string" ? parsed.livingBrief : "",
        draftTrip: parsed.draftTrip && typeof parsed.draftTrip === "object" ? parsed.draftTrip : {},
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        degraded: Boolean(parsed.degraded),
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      })
    } catch {
      setStorageWarning("Previous agent session could not be restored. Starting fresh.")
    }
  }, [])

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      setStorageWarning("Could not save local agent session in this browser.")
    }
  }, [session])

  const plannerContext = React.useMemo(
    () => ({
      country: session.intake.country,
      tripScope: session.intake.tripScope,
      cities: splitCities(session.intake.cities),
      tripBrief: session.intake.tripBrief,
      destination: session.draftTrip.destination,
      startDate: session.draftTrip.startDate,
      endDate: session.draftTrip.endDate,
      travelers: session.draftTrip.travelers,
      budgetTotal: session.draftTrip.budgetTotal,
    }),
    [session.intake, session.draftTrip]
  )

  async function sendMessages(nextMessages: AiMessage[], options?: { finalize?: boolean }) {
    setLoading(true)
    setError(null)
    setIsFinalizing(Boolean(options?.finalize))
    try {
      const response = await postPlannerChat({
        messages: nextMessages,
        plannerContext,
        refresh: true,
      })
      setSession((prev) => ({
        ...prev,
        messages: [...nextMessages, { role: "assistant", content: response.answer }],
        livingBrief: options?.finalize ? response.answer : prev.livingBrief || response.answer,
        draftTrip: mergeDraft(prev.draftTrip, response.plannerDraft),
        sources: response.sources,
        degraded: response.degraded,
        updatedAt: new Date().toISOString(),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Planner request failed")
    } finally {
      setLoading(false)
      setIsFinalizing(false)
    }
  }

  async function startConversation() {
    if (!session.intake.tripBrief.trim()) {
      setError("Add your trip brief first so the planner has enough context.")
      return
    }
    const seed = buildSeedMessage(session.intake)
    const nextMessages: AiMessage[] = [{ role: "user", content: seed }]
    setSession((prev) => ({ ...prev, messages: nextMessages }))
    await sendMessages(nextMessages)
  }

  async function sendFollowUp() {
    const content = followUpInput.trim()
    if (!content || loading) return
    setFollowUpInput("")
    const nextMessages: AiMessage[] = [...session.messages, { role: "user", content }]
    setSession((prev) => ({ ...prev, messages: nextMessages }))
    await sendMessages(nextMessages)
  }

  async function generateFinalOutput() {
    if (loading || session.messages.length === 0) return
    const prompt = "Based on everything we discussed, generate the final trip expectations output and a clear day-by-day skeleton I can apply to a trip."
    const nextMessages: AiMessage[] = [...session.messages, { role: "user", content: prompt }]
    setSession((prev) => ({ ...prev, messages: nextMessages }))
    await sendMessages(nextMessages, { finalize: true })
  }

  function resetSession() {
    setSession(defaultSession)
    setFollowUpInput("")
    setError(null)
    localStorage.removeItem(STORAGE_KEY)
    toast.success("Agent session reset.")
  }

  function applyToTrip() {
    const destination = resolveDestination(session.draftTrip, session.intake)
    if (!destination) {
      setError("Please provide country or city details before applying to a trip.")
      return
    }

    const travelers = Math.max(1, Number(session.draftTrip.travelers || 1))
    const dates = inferDefaultDates(session.draftTrip.startDate, session.draftTrip.endDate)
    const totalDays = calcTotalDays(dates.startDate, dates.endDate)

    const trip = createTrip({
      id: normalizeTripId(destination),
      destination,
      dateMode: "exact",
      travelers: travelers > 1 ? "group" : "solo",
    })

    const budgetTotal = typeof session.draftTrip.budgetTotal === "number" ? Math.max(0, session.draftTrip.budgetTotal) : 0
    const intakeCities = splitCities(session.intake.cities)
    const draftCities = session.draftTrip.cities ?? []
    const resolvedCities = draftCities.length > 0 ? draftCities : intakeCities
    const country = (session.draftTrip.country || session.intake.country || "").trim()
    const locationNote = [
      country ? `Country: ${country}` : "",
      resolvedCities.length > 0 ? `Cities: ${resolvedCities.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" • ")

    updateTrip(trip.id, {
      destination: country ? `${destination}, ${country}` : destination,
      startDate: dates.startDate,
      endDate: dates.endDate,
      travelers,
      isGroupTrip: travelers > 1,
      totalDays,
      budgetTotal,
      perPerson: travelers > 0 ? Math.round((budgetTotal / travelers) * 100) / 100 : 0,
      activities: session.draftTrip.activities?.length
        ? [...session.draftTrip.activities, ...(locationNote ? [locationNote] : [])]
        : ["Planned with Agent", ...(locationNote ? [locationNote] : [])],
      progress: Math.max(20, trip.progress),
    })

    const itineraryItems = toTripItineraryItems(trip.id, session.draftTrip)
    if (itineraryItems.length > 0) {
      setTripItineraryItems(trip.id, itineraryItems)
    }

    toast.success("Trip created from Agent output.")
    router.push(`/trips/${trip.id}`)
  }

  const started = session.messages.length > 0
  const userTurns = session.messages.filter((m) => m.role === "user").length
  const canGenerateFinal = started && userTurns >= 2
  const canApply = Boolean(resolveDestination(session.draftTrip, session.intake).trim()) && session.livingBrief.trim().length > 0

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10">
      <section className="mb-6 rounded-sm border bg-card p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Agent Workspace</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Trip Planner Conversation</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Share your full trip brief, let the planner ask follow-up questions, then generate a final output when you are ready.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/trips">Back to Trips</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={resetSession}>Reset</Button>
          </div>
        </div>
      </section>

      {storageWarning ? (
        <div className="mb-4 rounded-sm border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-800">{storageWarning}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tell the Planner About Your Trip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Country</p>
                <Input
                  placeholder="e.g. Germany"
                  value={session.intake.country}
                  onChange={(event) =>
                    setSession((prev) => ({
                      ...prev,
                      intake: { ...prev.intake, country: event.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Trip Scope</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "single_city", label: "Single city" },
                    { value: "multi_city", label: "Multi city" },
                  ] as const).map((option) => (
                    <Button
                      key={option.value}
                      size="sm"
                      variant={session.intake.tripScope === option.value ? "default" : "outline"}
                      onClick={() =>
                        setSession((prev) => ({
                          ...prev,
                          intake: { ...prev.intake, tripScope: option.value },
                        }))
                      }
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {session.intake.tripScope === "multi_city" ? "Cities (comma-separated)" : "City"}
              </p>
              <Input
                placeholder={session.intake.tripScope === "multi_city" ? "Berlin, Munich, Hamburg" : "Berlin"}
                value={session.intake.cities}
                onChange={(event) =>
                  setSession((prev) => ({
                    ...prev,
                    intake: { ...prev.intake, cities: event.target.value },
                  }))
                }
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Trip Brief</p>
              <Textarea
                rows={8}
                placeholder="Share everything: goals, budget comfort, must-do experiences, pace, travel style, concerns, ideal dates, and anything non-negotiable."
                value={session.intake.tripBrief}
                onChange={(event) =>
                  setSession((prev) => ({
                    ...prev,
                    intake: { ...prev.intake, tripBrief: event.target.value },
                  }))
                }
              />
            </div>

            {!started ? (
              <Button onClick={() => void startConversation()} disabled={loading || !session.intake.tripBrief.trim()}>
                {loading ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
                {loading ? "Starting planner..." : "Start Planner Conversation"}
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Final Output</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {session.livingBrief ? (
              <p className="max-h-[320px] overflow-auto whitespace-pre-wrap text-sm">{session.livingBrief}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Gather details through chat, then generate your final output.
              </p>
            )}

            <Button onClick={() => void generateFinalOutput()} disabled={loading || !canGenerateFinal}>
              {loading && isFinalizing ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
              {loading && isFinalizing ? "Generating final output..." : "Generate Final Output"}
            </Button>

            <Button variant="outline" onClick={applyToTrip} disabled={loading || !canApply}>
              Apply to Trip
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!started ? (
            <p className="text-sm text-muted-foreground">
              Once you start, the planner will ask focused follow-up questions to fill any gaps.
            </p>
          ) : (
            <div className="max-h-[420px] space-y-2 overflow-auto rounded-sm border p-3">
              {session.messages.map((message, idx) => (
                <div
                  key={`${message.role}-${idx}`}
                  className={
                    message.role === "assistant"
                      ? "max-w-[92%] rounded-sm border p-2 text-sm"
                      : "ml-auto max-w-[92%] rounded-sm bg-primary p-2 text-sm text-primary-foreground"
                  }
                >
                  {message.role === "assistant" ? (
                    <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <BotIcon className="size-3" /> Planner
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="rounded-sm border p-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Loader2Icon className="size-4 animate-spin" />
                {isFinalizing ? "Generating final output..." : "Planner is thinking..."}
              </div>
            </div>
          ) : null}

          {error ? <div className="rounded-sm border border-destructive p-3 text-sm text-destructive">{error}</div> : null}
          {session.degraded ? (
            <div className="rounded-sm border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-800">
              Live planner context is partially unavailable. Guidance may be less accurate.
            </div>
          ) : null}

          <div className="space-y-2">
            <Textarea
              rows={4}
              placeholder="Reply to the planner here..."
              value={followUpInput}
              onChange={(event) => setFollowUpInput(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault()
                  void sendFollowUp()
                }
              }}
              disabled={!started}
            />
            <Button onClick={() => void sendFollowUp()} disabled={loading || !started || !followUpInput.trim()}>
              <SendIcon /> Send
            </Button>
          </div>

          {session.sources.length > 0 ? (
            <div className="rounded-sm border p-3 text-xs text-muted-foreground">
              {session.sources.map((source) => (
                <p key={`${source.name}-${source.fetchedAt}`}>
                  {source.name}: {source.status} · {new Date(source.fetchedAt).toLocaleTimeString()}
                  {source.detail ? ` · ${source.detail}` : ""}
                </p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
