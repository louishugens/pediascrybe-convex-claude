"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Bell } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export function NotificationBell() {
  const unreadCount = useQuery(api.portal.getUnreadNotificationCount)

  return (
    <Link href="/portal/notifications" className="relative inline-flex items-center">
      <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      {unreadCount !== undefined && unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 text-[10px] px-1 py-0 min-w-4 h-4 flex items-center justify-center"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Link>
  )
}
