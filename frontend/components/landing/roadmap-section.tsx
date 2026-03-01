"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { CheckCircle2Icon, CircleDashedIcon, CircleIcon } from "lucide-react"

type Status = "done" | "in-progress" | "upcoming"

const milestones: { label: string; detail: string; status: Status }[] = [
  {
    label: "Foundation",
    detail: "Auth, profiles, group model, base UI shell, navigation.",
    status: "done",
  },
  {
    label: "Flights",
    detail: "Duffel offer requests, multi-city slices, booking flow.",
    status: "done",
  },
  {
    label: "Hotels",
    detail: "Search, availability, room selection, booking confirmation.",
    status: "in-progress",
  },
  {
    label: "Itinerary + Suggestions",
    detail: "Day planner, timeline view, automatic place suggestions.",
    status: "in-progress",
  },
  {
    label: "Transit Routing",
    detail: "Google Directions (TRANSIT) with Transitland fallback.",
    status: "done",
  },
  {
    label: "AI Assistant",
    detail: "GPT-4.1 planner, GPT-4.1 mini chat, optional GPT-4o vision.",
    status: "upcoming",
  },
  {
    label: "Finance + Group Travel",
    detail: "Split ledger, multi-currency budget, FX alerts, approvals.",
    status: "done",
  },
  {
    label: "Visual Polish",
    detail: "Framer Motion interactions, accessibility, performance pass.",
    status: "in-progress",
  },
]

const statusConfig: Record<Status, { icon: React.ElementType; label: string; className: string }> = {
  done: {
    icon: CheckCircle2Icon,
    label: "Done",
    className: "text-emerald-500 bg-emerald-500/10",
  },
  "in-progress": {
    icon: CircleDashedIcon,
    label: "In Progress",
    className: "text-primary bg-primary/10",
  },
  upcoming: {
    icon: CircleIcon,
    label: "Upcoming",
    className: "text-muted-foreground bg-muted",
  },
}

export function RoadmapSection() {
  return (
    <section id="roadmap" className="mx-auto max-w-6xl px-6 py-24 sm:px-10 pb-32">
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Build Roadmap
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Where we&apos;re at.
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl">
          Eight milestones from first line of code to production polish. Transparent progress, no vaporware.
        </p>
      </div>

      <ol className="relative space-y-3">
        {milestones.map((m, idx) => {
          const cfg = statusConfig[m.status]
          const Icon = cfg.icon
          return (
            <motion.li
              key={m.label}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] as const }}
              className="flex items-start gap-4 border border-border bg-card p-4 transition-colors hover:border-primary/20"
            >
              {/* Number */}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border text-xs font-semibold text-muted-foreground">
                {idx + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{m.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.detail}</p>
              </div>

              {/* Status chip */}
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium ${cfg.className}`}>
                <Icon className="size-3" />
                {cfg.label}
              </span>
            </motion.li>
          )
        })}
      </ol>

      {/* Bottom goal bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 border border-primary bg-primary px-6 py-5 text-primary-foreground"
      >
        <p className="text-sm font-medium">
          🎯 Goal: become the default trip operating system for first-time travelers.
        </p>
      </motion.div>
    </section>
  )
}
