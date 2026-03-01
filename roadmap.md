# Travel Platform Roadmap

## Vision
Build an all-in-one travel platform for first-time travelers that plans, books, and manages trips with a simple, guided experience and visually rich UI.

## Target Audience
- First-time travelers who want clarity, guidance, and minimal decision fatigue.

## Core Stack (Frameworks & Languages)
- **Frontend:** Next.js (React) + TypeScript
- **Styling & Motion:** TailwindCSS + Framer Motion
- **Backend:** Node.js (Next.js API routes or NestJS)
- **Database:** PostgreSQL + Supabase
- **Cache & Jobs:** Redis + BullMQ
- **Maps:** Google Maps JS SDK

## API Providers
- **Flights (Booking):** SerpAPI Google Flights
- **Hotels (Booking):** Booking.com Demand API
- **Transit:** Google Directions API + Transitland Routing API
- **Currency Exchange:** Fixer API (or ExchangeRatesAPI)

## AI Stack (Recommended)
- **Primary planner/chat:** OpenAI GPT-4.1
- **Fast/low-cost chat:** GPT-4.1 mini
- **Vision (optional):** GPT-4o (images/maps/tickets)
- **Voice (optional):** OpenAI Realtime API

## Key Features
- **Flight search & booking:** one-way, round-trip, multi-city (SerpAPI Google Flights)
- **Hotel search & booking**
- **Itinerary builder:** day-by-day plan + timeline view
- **Transit routing:** best public transit paths per day
- **Automatic place suggestions:** based on destination + trip length
- **Route expansion:** suggest add-on cities and alternate routes
- **AI assistant:** “plan it for me”, add bookings, explain options
- **Finance layer:** multi-currency totals, group split ledger, budget timeline, FX alerts
- **Group travel:** shared itineraries, approvals, split payments, group limits handling

## Feature Breakdown (What Each Should Include)
### Flight Search & Booking (SerpAPI Google Flights)
- Search types: one-way, round-trip, multi-city (slices)
- Filters: price, stops, duration, baggage, departure windows
- Offer selection: “best pick” badge + clear tradeoffs
- Booking: passenger details, contact, payment, confirmation
- Order management: view ticket, cancellation/refund rules

### Hotel Search & Booking
- Search: destination, dates, guests, rooms
- Filters: price, rating, amenities, distance to center
- Availability: room types + policies
- Booking: guest details + payment + confirmation

### Itinerary Builder
- Day-by-day timeline with time blocks
- Drag-and-drop activities
- Auto-order by location + time
- Export/share itinerary

### Transit Routing
- Directions per day with transit mode
- Saved routes (hotel → attraction → restaurant)
- Fare and duration display
- Fallback to Transitland if Google fails

### Automatic Place Suggestions
- POIs by interest and trip length
- “Must-see” vs “hidden gems” tabs
- Save to itinerary in one click

### Route Expansion (Add-on Trips)
- Nearby cities within X hours
- Alternate route suggestions (cheaper/faster)
- Multi-city rebuild with 1 click

### AI Assistant
- “Plan it for me” itinerary generation
- Explain tradeoffs (price vs time)
- Add/remove bookings and activities
- Summaries for first-time travelers

### Finance Layer
- Multi-currency totals (home + destination)
- Group split ledger (equal/custom)
- Daily budget timeline
- FX alerts + “best time to exchange”

### Group Travel
- Shared trip workspace
- Voting/approval flow
- Split bookings (when >9 passengers)
- Role permissions (owner/editor/viewer)

## UX Principles (First-Time Travelers)
- Simple step-by-step flow (search → select → confirm)
- Clear “best pick” explanations (price, time, baggage, stops)
- Minimal jargon, guided decisions, visual clarity
- Motion for transitions, not distractions

## Milestones
### Milestone 1 — Foundation
- Auth, profiles, group model
- Trip data schema
- Base UI shell + navigation

### Milestone 2 — Flights (SerpAPI)
- Offer request + multi-city slices
- Offer listing + selection
- Booking flow (create order)

### Milestone 3 — Hotels
- Search + availability
- Booking flow
- Unified itinerary view

### Milestone 4 — Itinerary + Suggestions
- Day planner + timeline
- Automatic place suggestions
- Cost summary (base version)

### Milestone 5 — Transit
- Google Directions (TRANSIT)
- Transitland routing fallback

### Milestone 6 — AI Assistant
- GPT-4.1 planner + tool calling
- GPT-4.1 mini for quick chat
- Optional GPT-4o for images

### Milestone 7 — Finance + Group Travel
- Group split ledger
- Multi-currency budget timeline
- FX alerts and guidance

### Milestone 8 — Visual Polish
- Framer Motion interactions
- Accessibility + performance pass
