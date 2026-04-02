import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { AdminShell } from "@/components/admin/admin-shell"

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect("/dashboard")
  }

  return <AdminShell userEmail={user.email ?? ""}>{children}</AdminShell>
}
