"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"
import { ChildCard } from "@/components/portal/child-card"
import { Spinner } from "@/components/ui/spinner"
import { Bell, Baby } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function PortalDashboard() {
  const patients = useQuery(api.portal.getMyPatients)
  const unreadCount = useQuery(api.portal.getUnreadNotificationCount)
  const { data: session } = authClient.useSession()

  const userName = session?.user?.name?.split(" ")[0] || "there"

  if (patients === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome, {userName}</h1>
          <p className="text-muted-foreground mt-1">Parent Portal</p>
        </div>
        {unreadCount !== undefined && unreadCount > 0 && (
          <Link href="/portal/notifications">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {unreadCount} new notification{unreadCount > 1 ? "s" : ""}
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Children Cards */}
      {patients.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Baby className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No children linked yet</h2>
          <p className="text-muted-foreground">
            Ask your doctor to send you a portal invitation to get started.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            My Children
            <Badge variant="secondary" className="ml-2">{patients.length}</Badge>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {patients.map((patient) => {
              if (!patient) return null
              return <ChildCard key={patient._id} patient={patient} />
            })}
          </div>
        </div>
      )}
    </div>
  )
}
