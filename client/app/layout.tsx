import type { Metadata } from "next"
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import { TripsProvider } from "@/components/providers/trips-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const ui = Inter({ subsets: ["latin"], variable: "--font-ui" })
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
})
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "TripLoom",
  description: "Plan the trip, not the tabs.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${ui.variable} ${display.variable} ${mono.variable}`}>
        <TripsProvider>
          <div id="root">{children}</div>
          <Toaster richColors position="top-right" />
        </TripsProvider>
        <Analytics />
      </body>
    </html>
  )
}
