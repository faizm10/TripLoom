# TripLoom — Next.js

A travel-planning workspace prototype, ported to Next.js 14 (App Router) with TypeScript.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Structure

```
app/
  layout.tsx            # Root layout, loads fonts + globals.css
  globals.css           # Design tokens + base styles
  page.tsx              # Landing  (/)
  trips/
    page.tsx            # Dashboard (/trips)
    [id]/page.tsx       # Workspace (/trips/tokyo-2026)
components/
  Brand.tsx
  Icon.tsx
  Shared.tsx            # AvatarStack, PresenceDot, TripCover
  Landing.tsx
  Dashboard.tsx
  Workspace.tsx
  Itinerary.tsx
  MapView.tsx
  Tweaks.tsx
lib/
  data.ts               # Trip fixture, types, sidebar config
```

## Notes

- All interactive components are marked `"use client"` since this prototype
  relies on local React state (drag/drop, view toggles, etc).
- Fonts are pulled from Google Fonts via a `<link>` in `layout.tsx`. Swap to
  `next/font/google` if you want self-hosting.
- The Tweaks panel keeps its `postMessage` host protocol — harmless when run
  standalone.
