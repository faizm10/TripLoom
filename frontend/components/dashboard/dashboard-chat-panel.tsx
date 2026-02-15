"use client"

import { BotIcon, SendIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function DashboardChatPanel({ chatOpen }: { chatOpen: boolean }) {
  return (
    <aside
      className={cn(
        "bg-card border-l transition-[width] duration-200 ease-linear",
        chatOpen ? "w-full sm:w-[360px]" : "w-0"
      )}
    >
      <div
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden",
          chatOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <BotIcon className="size-4" />
            <p className="text-sm font-medium">AI Copilot</p>
          </div>
          <Badge variant="secondary" className="rounded-none">
            Beta
          </Badge>
        </div>

        <div className="flex-1 space-y-3 overflow-auto p-4 text-sm">
          <div className="bg-muted border p-3">
            Try: <span className="font-medium">"Plan a low-cost day 2 route"</span>
          </div>
          <div className="border p-3">
            I can help optimize flights, hotels, transit paths, and nearby attractions.
          </div>
          <div className="bg-primary text-primary-foreground ml-auto max-w-[90%] border p-3">
            What should I prioritize for first-time travelers?
          </div>
          <div className="border p-3">
            Start with visa and documents, then lock flights/hotel, then build transit-safe daily plans.
          </div>
        </div>

        <div className="border-t p-3">
          <div className="space-y-2">
            <Input placeholder="Ask the trip assistant..." />
            <Textarea
              rows={3}
              placeholder="Add context: budget, group size, priorities"
            />
            <Button className="w-full rounded-none">
              <SendIcon /> Send
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
