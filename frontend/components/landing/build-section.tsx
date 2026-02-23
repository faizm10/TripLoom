"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  BotIcon,
  CalendarRangeIcon,
  CreditCardIcon,
  HotelIcon,
  PlaneIcon,
  TrainFrontIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"

const features = [
  {
    icon: PlaneIcon,
    title: "Flights",
    description:
      "One-way, round-trip, and multi-city search via Duffel. Compare stops, baggage, and duration with clear tradeoffs.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: HotelIcon,
    title: "Hotels",
    description:
      "Search by area, filter by rating and amenities, pick the right room type, and book with confidence.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: CalendarRangeIcon,
    title: "Itinerary Builder",
    description:
      "Day-by-day timeline with drag-and-drop. Auto-order by location, export to Google Calendar.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: TrainFrontIcon,
    title: "Transit Routing",
    description:
      "Google Directions for daily route chains. Transitland fallback. Fare and duration shown up front.",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    icon: BotIcon,
    title: "AI Assistant",
    description:
      "Ask it to plan your whole trip, explain tradeoffs, or add bookings. GPT-4.1 with tool calling.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: CreditCardIcon,
    title: "Finance Layer",
    description:
      "Multi-currency totals, per-person budget, daily spend timeline, and FX alerts.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: UsersIcon,
    title: "Group Travel",
    description:
      "Shared workspaces, role permissions, voting/approval flows, and split payment ledgers.",
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/10",
  },
  {
    icon: ZapIcon,
    title: "One Workflow",
    description:
      "Search → select → confirm, from flights to itinerary to budget. No app-switching required.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
]

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export function BuildSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24 sm:px-10">
      <div className="mb-12 max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Features
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything a first-time traveler needs
        </h2>
        <p className="mt-4 text-muted-foreground">
          Eight integrated modules. One platform. No decision fatigue.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {features.map((feat) => (
          <motion.article
            key={feat.title}
            variants={item}
            className="group flex flex-col gap-4 border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className={`flex h-10 w-10 items-center justify-center ${feat.bg}`}>
              <feat.icon className={`size-5 ${feat.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{feat.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {feat.description}
              </p>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  )
}
