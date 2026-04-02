# TripLoom

AI-assisted travel planner. Organize flights and hotels, plan transit, build itineraries, and manage trip budgets.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS, Google Maps API, Supabase

## Run

```bash
cd frontend
npm i
npm run dev
```

## Env

`frontend/.env.local`
```env
# Server-only: required for public trip share links (token → trip payload). Never commit or prefix with NEXT_PUBLIC_.
SUPABASE_SERVICE_ROLE_KEY=

# Required
GOOGLE_MAPS_API_KEY=

# Optional client map keys
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```
