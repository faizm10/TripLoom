import { createClient } from "@/lib/supabase/client"

export type UserProfileRow = {
  user_id: string
  country_code: string
  updated_at?: string
}

/**
 * Load the signed-in user's profile row. Returns null if missing or not signed in.
 */
export async function getUserProfileFromSupabase(): Promise<UserProfileRow | null> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, country_code, updated_at")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error || !data) return null
  return data as UserProfileRow
}

/**
 * Upsert country of residence (ISO 3166-1 alpha-2) for the current user.
 */
export async function upsertUserCountryInSupabase(countryCode: string): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!user) throw new Error("You must be signed in to save your country.")

  const code = countryCode.trim().toUpperCase()
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      country_code: code,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (error) throw new Error(error.message)
}
