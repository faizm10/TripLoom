import type { Metadata } from "next"

import { BuildSection } from "@/components/landing/build-section"
import { CtaSection } from "@/components/landing/cta-section"
import { HeroSection } from "@/components/landing/hero-section"
import { NavSection } from "@/components/landing/nav-section"
import { RoadmapSection } from "@/components/landing/roadmap-section"
import { WhySection } from "@/components/landing/why-section"

export const metadata: Metadata = {
  title: "TripLoom | Plan, Book, and Manage Travel",
  description:
    "TripLoom is an AI travel platform for first-time travelers to plan itineraries, compare flights and hotels, route transit, and explore nearby attractions.",
}

export default function Page() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "TripLoom",
    applicationCategory: "TravelApplication",
    operatingSystem: "Web",
    description:
      "TripLoom is an AI-powered travel planning and booking platform for first-time travelers.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  }

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <NavSection />
      <HeroSection />
      <BuildSection />
      <WhySection />
      <RoadmapSection />
      <CtaSection />
    </main>
  )
}
