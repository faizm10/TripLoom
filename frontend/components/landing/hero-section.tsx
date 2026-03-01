"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PlaneIcon,
  SparklesIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const stats = [
  { icon: PlaneIcon, label: "Flights", value: "SerpAPI" },
  { icon: MapPinIcon, label: "Hotels", value: "Booking.com" },
  { icon: CalendarDaysIcon, label: "Itinerary", value: "Day Planner" },
  { icon: SparklesIcon, label: "AI", value: "GPT-4.1" },
]

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-24 pb-20 sm:px-10">
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-1/4 h-[600px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.71 0.13 215), oklch(0.61 0.11 222) 50%, transparent 80%)",
          }}
        />
        <div
          className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full opacity-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.80 0.13 212), transparent 70%)",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-6xl">
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Now in development — Milestone 1 complete
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-foreground sm:text-7xl"
        >
          The only travel platform{" "}
          <span
            className="text-transparent"
            style={{
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              backgroundImage:
                "linear-gradient(135deg, oklch(0.80 0.13 212), oklch(0.61 0.11 222))",
            }}
          >
            built for clarity.
          </span>
        </motion.h1>

        {/* Subline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          TripLoom guides first-time travelers through every step — flights,
          hotels, itineraries, transit, budgets, and group coordination — in one
          seamless workflow with AI support throughout.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <Button asChild size="lg" className="group">
            <Link href="/dashboard">
              Start Planning Free
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#features">See How It Works</a>
          </Button>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.45}
          className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {stats.map(({ icon: Icon, label, value }) => (
            <article
              key={label}
              className="flex items-center gap-3 border border-border bg-card/60 px-4 py-3 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <p className="text-xs font-semibold text-foreground">{value}</p>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
