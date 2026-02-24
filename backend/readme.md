# TripLoom Backend (Go + Fiber)

## What this service does
- Owns AI orchestration (`/v1/ai/*`)
- Persists AI conversations/messages/context snapshots in Supabase Postgres (when configured)
- Verifies Supabase JWT bearer tokens (when configured)
- Bridges to existing Next.js APIs for live page context (flights/transit)

## Quick start
1. Copy envs:
   - `cp .env.example .env`
2. Fill required values:
   - `OPENAI_API_KEY`
   - Optional for Supabase mode:
   - `SUPABASE_DB_URL`
   - `SUPABASE_JWKS_URL`
   - `SUPABASE_URL`
3. If using Supabase mode, apply SQL in `migrations/001_init.sql` to your Supabase Postgres DB.
4. Run:
   - `make tidy`
   - `make run`

The backend listens on `http://localhost:8080` by default.

## Test mode (no Supabase, no persistence)
- Leave `SUPABASE_DB_URL` and `SUPABASE_JWKS_URL` unset.
- Auth is bypassed for local testing. Default user is `local-test-user`.
- Set request header `X-User-Id` to simulate a different user.
- Conversations/messages are stored in memory only and reset on restart.

## Endpoints
- `POST /v1/ai/chat`
- `GET /v1/ai/conversations/:tripId`
- `GET /v1/ai/conversations/:conversationId/messages`
- `POST /v1/ai/context/refresh`
- `GET /healthz`
