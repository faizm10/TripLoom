import { createClient } from "@/lib/supabase/server"
import { Brand } from "@/components/Shared"
import { InviteAcceptClient } from "./invite-accept-client"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const decoded = decodeURIComponent(token)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-6">
        <Brand />
      </div>
      <InviteAcceptClient token={decoded} isLoggedIn={Boolean(user)} />
    </div>
  )
}
