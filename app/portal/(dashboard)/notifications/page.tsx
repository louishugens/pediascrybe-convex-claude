"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Spinner } from "@/components/ui/spinner"
import { NotificationList } from "@/components/portal/notification-list"
import { Bell } from "lucide-react"

export default function NotificationsPage() {
  const notifications = useQuery(api.portal.getNotifications)

  if (notifications === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications
        </h1>
        <p className="text-muted-foreground mt-1">
          Stay updated on your children&apos;s health activity
        </p>
      </div>

      <NotificationList notifications={notifications} />
    </div>
  )
}
