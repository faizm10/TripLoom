import { processLock } from "@supabase/auth-js"
import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Dev (Turbopack/HMR, Strict Mode) often leaves the Web Locks "steal" recovery
        // fighting itself and surfaces AbortError in the console. In-process lock is enough
        // for a single tab; production keeps the default navigator lock for multi-tab sync.
        ...(process.env.NODE_ENV === "development" ? { lock: processLock } : {}),
      },
    }
  )
}
