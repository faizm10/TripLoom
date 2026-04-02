import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Geist, Geist_Mono, Outfit } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { TripsProvider } from "@/components/providers/trips-provider"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://triploom.com"),
  title: {
    default: "TripLoom | AI Travel Planning",
    template: "%s | TripLoom",
  },
  description:
    "TripLoom helps first-time travelers plan, organize, and manage trips — itineraries, transit, budgets, and group coordination in one guided platform.",
  applicationName: "TripLoom",
  keywords: [
    "TripLoom",
    "travel planning platform",
    "AI travel assistant",
    "itinerary builder",
    "transit routing",
    "group travel planning",
    "first-time travelers",
    "trip organizer",
  ],
  openGraph: {
    type: "website",
    siteName: "TripLoom",
    title: "TripLoom | AI Travel Planning",
    description:
      "Plan, organize, and manage your trips with AI guidance — itineraries, transit, budgets, and group coordination.",
    url: "https://triploom.com",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TripLoom travel planning platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TripLoom | AI Travel Planning",
    description:
      "The all-in-one travel workspace for first-time travelers: itinerary, transit, budgets, and AI support.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: [{ url: "/icon", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "travel",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="triploom-theme"
          themes={["light", "dark"]}
        >
          <TripsProvider>
            {children}
            <ThemeToggle />
            <Toaster richColors position="top-right" />
          </TripsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
