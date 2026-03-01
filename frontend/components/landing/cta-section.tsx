"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative overflow-hidden border border-primary/30 px-8 py-14 text-center sm:px-16"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.61 0.11 222 / 0.12), oklch(0.80 0.13 212 / 0.08))",
        }}
      >
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/4 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: "oklch(0.71 0.13 215)" }}
          />
          <div
            className="absolute right-1/4 bottom-0 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full opacity-20 blur-3xl"
            style={{ background: "oklch(0.80 0.13 212)" }}
          />
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Get started today
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Plan your first trip — right now.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          No signup required to explore. Create a trip, build your itinerary,
          compare flights — all in one place.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="group">
            <Link href="/dashboard">
              Open Dashboard
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
