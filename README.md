# TripLoom

🌍 AI-assisted travel planner. Search flights, track flight status, plan transit, and manage trip itineraries.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS, Duffel API, SerpAPI (Google Flights), FlightAware AeroAPI, Google Maps API

## Run

```bash
cd frontend
npm i
npm run dev
```

## Env

`frontend/.env.local`
```env
# Required
DUFFEL_API_KEY=
SERPAPI_API_KEY=
AERO_API_KEY=
GOOGLE_MAPS_API_KEY=

# Optional aliases / fallbacks
DUFFEL=
SERP_API_KEY=
AEROAPI_KEY=
FLIGHT_STATUS_API_KEY=
AVIATIONSTACK_API_KEY=
AVIATIONSTACK_ACCESS_KEY=

# Optional endpoint overrides
FLIGHT_STATUS_BASE_URL=https://api.aviationstack.com/v1
AEROAPI_BASE_URL=https://aeroapi.flightaware.com/aeroapi

# Optional client map keys
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```
