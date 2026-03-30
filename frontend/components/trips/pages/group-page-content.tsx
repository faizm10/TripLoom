"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  UsersIcon,
  ShieldCheckIcon,
  LinkIcon,
  CopyIcon,
  MailIcon,
  PlusIcon,
  MoreHorizontalIcon,
  CreditCardIcon,
  BriefcaseBusinessIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// --- Mock Data --- 

type Role = "Owner" | "Editor" | "Viewer"

interface Member {
  id: string
  name: string
  email: string
  role: Role
  avatarFallback: string
  isCurrentUser?: boolean
}

const mockMembers: Member[] = [
  {
    id: "m1",
    name: "Faiz Mustansar",
    email: "faiz@triploom.com",
    role: "Owner",
    avatarFallback: "FM",
    isCurrentUser: true,
  },
  {
    id: "m2",
    name: "Hamza Elmi",
    email: "hamza@example.com",
    role: "Editor",
    avatarFallback: "HE",
  },
  {
    id: "m3",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    role: "Viewer",
    avatarFallback: "SJ",
  },
]

// --- Component ---

export function GroupPageContent() {
  const [inviteEmail, setInviteEmail] = React.useState("")

  function handleCopyLink() {
    navigator.clipboard.writeText("https://triploom.com/invite/trp_8a7f92b")
    toast.success("Invite link copied to clipboard!")
  }

  function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return
    toast.success(`Invite sent to ${inviteEmail}`)
    setInviteEmail("")
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Group & Collaborators</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Invite friends to view or edit the itinerary. Split expenses and share packing lists.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        
        {/* Left Column: Members & Invites */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Members List */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UsersIcon className="size-4" /> 
                  Trip Members ({mockMembers.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {mockMembers.map((member) => (
                  <li key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 rounded-full border">
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                          {member.avatarFallback}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{member.name}</p>
                          {member.isCurrentUser && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 h-4">You</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        {member.role === "Owner" && <ShieldCheckIcon className="size-3.5 text-primary" />}
                        <span className={member.role === "Owner" ? "font-medium text-primary" : "text-muted-foreground"}>
                          {member.role}
                        </span>
                      </div>
                      
                      {!member.isCurrentUser && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground ml-2">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Invite Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Invite Travelers</CardTitle>
              <CardDescription className="text-xs">
                Send an email invitation or share a secure link to join this trip.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <form onSubmit={handleSendInvite} className="flex gap-2">
                <div className="relative flex-1">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="Email address" 
                    className="pl-9 text-sm"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" variant="secondary" disabled={!inviteEmail}>
                  Invite
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or share link</span>
                </div>
              </div>

              <div className="flex items-center gap-2 border bg-muted/30 p-1 pl-3 rounded-md">
                <LinkIcon className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
                  triploom.com/invite/trp_8a7f92b
                </span>
                <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0" onClick={handleCopyLink}>
                  <CopyIcon className="size-3.5 mr-1" />
                  Copy
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Group Modules */}
        <div className="space-y-4">
           {/* Split Expenses Stub */}
           <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20 cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center bg-emerald-500/20 text-emerald-600 rounded-md">
                    <CreditCardIcon className="size-4" />
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-white/50 backdrop-blur-sm">
                    Coming Soon
                  </Badge>
                </div>
                <CardTitle className="text-sm mt-3 group-hover:text-emerald-700 transition-colors">Split Expenses</CardTitle>
                <CardDescription className="text-xs">
                  Track shared costs, settle up automatically in multiple currencies.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Shared Packing List Stub */}
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border-indigo-500/20 cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center bg-indigo-500/20 text-indigo-600 rounded-md">
                    <BriefcaseBusinessIcon className="size-4" />
                  </div>
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 bg-white/50 backdrop-blur-sm">
                    Coming Soon
                  </Badge>
                </div>
                <CardTitle className="text-sm mt-3 group-hover:text-indigo-700 transition-colors">Shared Packing List</CardTitle>
                <CardDescription className="text-xs">
                  See who is bringing shared items like adapters, cameras, and sunblock.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
