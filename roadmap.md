# Travel Platform Roadmap

## Vision
Build an all-in-one travel platform for first-time travelers that plans, organizes, and manages trips with a simple, guided experience and visually rich UI.

## Target Audience
- First-time travelers who want clarity, guidance, and minimal decision fatigue.

## Core Stack (Frameworks & Languages)
- **Frontend:** Next.js (React) + TypeScript
- **Styling & Motion:** TailwindCSS + Framer Motion
- **Backend:** Node.js (Next.js API routes) + Go
- **Database:** PostgreSQL + Supabase
- **Maps:** Google Maps JS SDK

## API Providers
- **Transit:** Google Directions API + Transitland Routing API
- **Currency Exchange:** Fixer API (or ExchangeRatesAPI)

## AI Stack (Recommended)
- **Primary planner/chat:** OpenAI GPT-4.1
- **Fast/low-cost chat:** GPT-4.1 mini
- **Vision (optional):** GPT-4o (images/maps/tickets)
- **Voice (optional):** OpenAI Realtime API

## Key Features
- **Flight workspace:** log outbound, inbound, and multi-city legs with times, stops, and notes
- **Hotel workspace:** record stays, dates, area notes, and costs
- **Itinerary builder:** day-by-day plan + timeline view + calendar
- **Transit routing:** best public transit paths per day, domestic quick-capture
- **Automatic place suggestions:** based on destination + trip length
- **Route expansion:** suggest add-on cities and alternate routes
- **AI assistant:** "plan it for me", explain options, fill in details
- **Finance layer:** multi-currency totals, group split ledger, budget timeline, daily pace tracking
- **Group travel:** shared itineraries, approvals, split payments, group limits handling
- **Packing lists:** personal checklist per trip; shared group list on group trips; synced checkboxes and labels
- **Sharing:** public read-only share links with live-updating trip snapshots

## Feature Breakdown (What Each Should Include)
### Flight Workspace
- Log types: outbound, inbound, one-way
- Fields: route, date, departure/arrival times, duration, stops, airline, flight number, notes
- Per-trip organization with overview integration

### Hotel Workspace
- Fields: property name, area, check-in/out, address notes, cost, currency
- Per-trip organization with overview integration

### Itinerary Builder
- Day-by-day timeline with time blocks
- Drag-and-drop activities on a calendar
- Auto-order by location + time
- Export to Google Calendar
- Immediate save to database

### Transit Routing
- Directions per day with transit mode
- Domestic quick-capture: title, notes, optional From/To legs
- International detailed routes with fares and durations
- Saved routes with database persistence

### Automatic Place Suggestions
- POIs by interest and trip length
- "Must-see" vs "hidden gems" tabs
- Save to itinerary in one click

### Route Expansion (Add-on Trips)
- Nearby cities within X hours
- Alternate route suggestions (cheaper/faster)
- Multi-city rebuild with 1 click

### AI Assistant
- "Plan it for me" itinerary generation
- Explain tradeoffs (price vs time)
- Fill in trip details and activities
- Summaries for first-time travelers

### Finance Layer
- Multi-currency totals (home + destination)
- Group split ledger (equal/custom)
- Daily budget timeline (excludes fixed costs like flights/hotels)
- Guardrail alerts for overspending

### Group Travel
- Shared trip workspace
- Voting/approval flow
- Role permissions (owner/editor/viewer)
- Public share links with live updates

### Packing Lists
- Personal list (always) + group list (group trips only)
- Add, rename, check off, remove items with realtime-friendly persistence
- Clear separation of "yours" vs "shared with the group"

## UX Principles (First-Time Travelers)
- Simple step-by-step flow (plan → organize → share)
- Clear explanations with no jargon
- Guided decisions, visual clarity
- Motion for transitions, not distractions

## Milestones
### Milestone 1 — Foundation
- Auth, profiles, group model
- Trip data schema
- Base UI shell + navigation
- Packing lists (personal + group) with database sync and row-level security

### Milestone 2 — Flight & Hotel Workspace
- Manual flight log with outbound/inbound/one-way support
- Manual hotel workspace with dates and cost tracking

### Milestone 3 — Itinerary + Suggestions
- Day planner + calendar view
- Drag-and-drop scheduling
- Database persistence
- Automatic place suggestions

### Milestone 4 — Transit
- Google Directions (TRANSIT)
- Transitland routing fallback
- Domestic quick-capture mode

### Milestone 5 — AI Assistant
- GPT-4.1 planner + tool calling
- GPT-4.1 mini for quick chat
- Optional GPT-4o for images

### Milestone 6 — Finance + Group Travel
- Group split ledger
- Multi-currency budget timeline
- Daily pace tracking (excludes fixed costs)
- Guardrail alerts

### Milestone 7 — Sharing & Collaboration
- Public read-only share links
- Collaborator invites with role permissions
- Live-updating share snapshots

### Milestone 8 — Visual Polish
- Framer Motion interactions
- Accessibility + performance pass
