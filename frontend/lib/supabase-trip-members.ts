import { createClient } from "@/lib/supabase/client"

export type Role = "owner" | "editor" | "viewer"

export interface TripMember {
  trip_id: string
  user_id: string
  role: Role
  created_at: string
}

// In a real production app with public auth profiles, we would do a join against a 'profiles' table.
// For now, Supabase Auth doesn't let users query other users' emails directly via the client for security.
// Because the backend Go service handles user metadata internally, we will just fetch the trip_members 
// and the current user will map their own auth email if they are in the list.
export async function getTripMembers(tripId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("trip_members")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching trip members:", error)
    return []
  }

  return data as TripMember[]
}

export async function addTripMember(tripId: string, newUserId: string, role: Role = "viewer") {
  const supabase = createClient()
  const { error } = await supabase
    .from("trip_members")
    .insert({
      trip_id: tripId,
      user_id: newUserId,
      role: role,
    })

  if (error) {
    throw new Error(`Failed to add team member: ${error.message}`)
  }
}

export async function updateTripMemberRole(tripId: string, memberUserId: string, newRole: Role) {
  const supabase = createClient()
  const { error } = await supabase
    .from("trip_members")
    .update({ role: newRole })
    .match({ trip_id: tripId, user_id: memberUserId })

  if (error) {
    throw new Error(`Failed to update member role: ${error.message}`)
  }
}

export async function removeTripMember(tripId: string, memberUserId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("trip_members")
    .delete()
    .match({ trip_id: tripId, user_id: memberUserId })

  if (error) {
    throw new Error(`Failed to remove team member: ${error.message}`)
  }
}
