import { BuildSection } from "@/components/landing/build-section"
import { HeroSection } from "@/components/landing/hero-section"
import { RoadmapSection } from "@/components/landing/roadmap-section"
import { WhySection } from "@/components/landing/why-section"

function HalfDottedDivider() {
  return <div className="mx-auto h-px w-1/2 border-t border-dotted border-border" />
}

export default function Page() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <HalfDottedDivider />
      <BuildSection />
      <HalfDottedDivider />
      <WhySection />
      <HalfDottedDivider />
      <RoadmapSection />
    </main>
  )
}
