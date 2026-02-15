import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { TripsProvider } from "@/components/providers/trips-provider";
import "./globals.css";

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://triploom.com"),
  title: {
    default: "TripLoom | AI Travel Planning and Booking",
    template: "%s | TripLoom",
  },
  description:
    "TripLoom helps first-time travelers plan, book, and manage flights, hotels, transit, and attractions in one guided platform.",
  applicationName: "TripLoom",
  keywords: [
    "TripLoom",
    "travel planning platform",
    "AI travel assistant",
    "flight and hotel booking",
    "itinerary builder",
    "transit routing",
    "group travel planning",
    "first-time travelers",
  ],
  openGraph: {
    type: "website",
    siteName: "TripLoom",
    title: "TripLoom | AI Travel Planning and Booking",
    description:
      "Plan, book, and manage your trips with AI guidance for flights, hotels, transit, and attractions.",
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
    title: "TripLoom | AI Travel Planning and Booking",
    description:
      "The all-in-one travel workflow for first-time travelers: itinerary, bookings, transit, and AI support.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TripsProvider>{children}</TripsProvider>
      </body>
    </html>
  );
}
