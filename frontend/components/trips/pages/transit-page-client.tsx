"use client"

import dynamic from "next/dynamic"

import type { Trip } from "@/lib/trips"

const TransitPageContent = dynamic(
  () =>
    import("@/components/trips/pages/transit-page-content").then(
      (module) => module.TransitPageContent
    ),
  { ssr: false }
)

export function TransitPageClient({ trip }: { trip: Trip }) {
  return <TransitPageContent trip={trip} />
}
