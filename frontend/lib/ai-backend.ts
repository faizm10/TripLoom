export type AiRole = "user" | "assistant"

export type AiMessage = {
  role: AiRole
  content: string
}

export type AiSource = {
  name: string
  status: string
  fetchedAt: string
  detail?: string
}

export type AiChatResponse = {
  conversationId: string
  answer: string
  highlights: string[]
  suggestedActions: string[]
  sources: AiSource[]
  degraded: boolean
}

export type AiPageContext = {
  title?: string
  subtitle?: string
  path?: string
  details?: string
}

export type PlannerDraftItem = {
  dayIndex?: number
  title?: string
  timeBlock?: "morning" | "afternoon" | "evening" | string
  category?: string
  notes?: string
}

export type PlannerDraft = {
  destination?: string
  country?: string
  cities?: string[]
  startDate?: string
  endDate?: string
  travelers?: number
  budgetTotal?: number
  activities?: string[]
  itinerary?: PlannerDraftItem[]
}

export type PlannerChatResponse = {
  answer: string
  sources: AiSource[]
  degraded: boolean
  plannerDraft?: PlannerDraft
}

type AiChatEnvelope = {
  ok: boolean
  data?: AiChatResponse
  error?: string
}

type PlannerChatEnvelope = {
  ok: boolean
  data?: PlannerChatResponse
  error?: string
}

function parseSupabaseAccessTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key || !key.includes("-auth-token")) continue
    const raw = window.localStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed) && typeof parsed[0]?.access_token === "string") return parsed[0].access_token
      if (!Array.isArray(parsed) && parsed && typeof parsed === "object") {
        const obj = parsed as { access_token?: unknown; currentSession?: { access_token?: unknown } }
        if (typeof obj.access_token === "string") return obj.access_token
        if (typeof obj.currentSession?.access_token === "string") return obj.currentSession.access_token
      }
    } catch {
      // ignore malformed entries and continue searching
    }
  }
  return null
}

export async function postAiChat(params: {
  tripId: string
  pageKey: string
  pageContext?: AiPageContext
  messages: AiMessage[]
  refresh?: boolean
}): Promise<AiChatResponse> {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
  const token = parseSupabaseAccessTokenFromStorage()

  const res = await fetch(`${backendBase}/v1/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  })

  const payload = (await res.json().catch(() => null)) as AiChatEnvelope | null
  if (!res.ok || !payload?.ok || !payload.data) {
    throw new Error(payload?.error || `AI request failed (${res.status})`)
  }
  return payload.data
}

export async function postPlannerChat(params: {
  messages: AiMessage[]
  plannerContext?: Record<string, unknown>
  refresh?: boolean
}): Promise<PlannerChatResponse> {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
  const token = parseSupabaseAccessTokenFromStorage()

  const res = await fetch(`${backendBase}/v1/ai/planner/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  })

  const payload = (await res.json().catch(() => null)) as PlannerChatEnvelope | null
  if (!res.ok || !payload?.ok || !payload.data) {
    throw new Error(payload?.error || `Planner request failed (${res.status})`)
  }
  return payload.data
}
