"use client"

import * as React from "react"
import { BotIcon, SendIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { postAiChat, type AiMessage, type AiPageContext, type AiSource } from "@/lib/ai-backend"
import { cn } from "@/lib/utils"

export function TripAiPanel({
  open,
  tripId,
  pageKey,
  pageContext,
}: {
  open: boolean
  tripId: string
  pageKey: string
  pageContext?: AiPageContext
}) {
  const [draft, setDraft] = React.useState("")
  const [messages, setMessages] = React.useState<AiMessage[]>([])
  const [sources, setSources] = React.useState<AiSource[]>([])
  const [degraded, setDegraded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  async function onSend() {
    const content = draft.trim()
    if (!content || loading) return

    const nextMessages = [...messages, { role: "user" as const, content }]
    setMessages(nextMessages)
    setDraft("")
    setError(null)
    setLoading(true)
    try {
      const response = await postAiChat({
        tripId,
        pageKey,
        pageContext,
        messages: nextMessages,
        refresh: true,
      })
      setMessages((prev) => [...prev, { role: "assistant", content: response.answer }])
      setSources(response.sources)
      setDegraded(response.degraded)
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside
      className={cn(
        "bg-card border-l transition-[width] duration-200 ease-linear",
        open ? "w-full sm:w-[360px]" : "w-0"
      )}
    >
      <div
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <BotIcon className="size-4" />
            <p className="text-sm font-medium">TripLoom AI</p>
          </div>
          <Badge variant="secondary" className="rounded-none">Beta</Badge>
        </div>

        <div className="flex-1 space-y-3 overflow-auto p-4 text-sm">
          {messages.length === 0 ? (
            <div className="bg-muted border p-3">
              Try: <span className="font-medium">&quot;What is my next best step?&quot;</span>
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                "max-w-[92%] border p-3 whitespace-pre-wrap",
                message.role === "assistant"
                  ? "bg-card text-foreground"
                  : "bg-primary text-primary-foreground ml-auto"
              )}
            >
              {message.content}
            </div>
          ))}

          {loading ? <div className="border p-3 text-muted-foreground">Thinking...</div> : null}
          {error ? <div className="border border-destructive p-3 text-destructive">{error}</div> : null}
          {degraded ? (
            <div className="border p-3 text-amber-700">
              Live data is partially unavailable. Recommendations may be less accurate.
            </div>
          ) : null}
          {sources.length > 0 ? (
            <div className="border p-3">
              <p className="mb-2 text-xs font-medium">Context used ({pageKey})</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                {pageContext?.title ? <p>page_title: {pageContext.title}</p> : null}
                {pageContext?.subtitle ? <p>page_subtitle: {pageContext.subtitle}</p> : null}
                {pageContext?.path ? <p>page_path: {pageContext.path}</p> : null}
                {pageContext?.details ? <p>page_details: {pageContext.details}</p> : null}
                {sources.map((source) => (
                  <p key={`${source.name}-${source.fetchedAt}`}>
                    {source.name}: {source.status} · {new Date(source.fetchedAt).toLocaleTimeString()}
                    {source.detail ? ` · ${source.detail}` : ""}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t p-3">
          <div className="space-y-2">
            <Textarea
              rows={3}
              placeholder="Ask TripLoom AI..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault()
                  void onSend()
                }
              }}
            />
            <Button className="w-full rounded-none" onClick={() => void onSend()} disabled={loading}>
              <SendIcon /> Send
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
