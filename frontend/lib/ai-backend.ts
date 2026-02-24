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

type AiChatEnvelope = {
  ok: boolean
  data?: AiChatResponse
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
