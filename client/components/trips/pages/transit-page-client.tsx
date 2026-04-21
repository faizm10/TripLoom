"use client"

import dynamic from "next/dynamic"

const TransitPageContent = dynamic(
  () =>
    import("@/components/trips/pages/transit-page-content").then(
      (module) => module.TransitPageContent
    ),
  { ssr: false }
)

export function TransitPageClient() {
  return <TransitPageContent />
}
