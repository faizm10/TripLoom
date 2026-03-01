"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { CheckIcon, ChevronRightIcon } from "lucide-react"

const values = [
  {
    title: "Step-by-step flow",
    description:
      "Search → select → confirm. Beginner-friendly with no jargon. Every decision point is explained.",
  },
  {
    title: "Clear tradeoffs",
    description:
      "Price vs. time vs. comfort — we show what each option costs you in plain language, not specs.",
  },
  {
    title: "Single workspace",
    description:
      "Flights, hotels, itinerary, transit, and budget all update together. Nothing falls through the cracks.",
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export function WhySection() {
  return (
    <section id="why" className="mx-auto max-w-6xl px-6 py-24 sm:px-10">
      <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Why TripLoom
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Designed for people who&apos;ve never done this before.
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed">
            Most travel tools assume you already know what you&apos;re doing. TripLoom
            takes the opposite approach — guided decisions, visual clarity, and AI
            support at every step so you always know what comes next.
          </p>

          <div className="mt-8">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Open the Dashboard <ChevronRightIcon className="size-4" />
            </a>
          </div>
        </motion.div>

        {/* Right: value props */}
        <div className="space-y-4">
          {values.map((v, i) => (
            <motion.article
              key={v.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="flex gap-4 border border-border bg-card p-5 transition-colors hover:border-primary/30"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-primary-foreground">
                <CheckIcon className="size-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {v.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
