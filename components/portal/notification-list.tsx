"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { format, formatDistanceToNow } from "date-fns"
import {
  Pill,
  FlaskConical,
  FileText,
  Syringe,
  ScrollText,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NOTIFICATION_ICONS = {
  new_prescription: Pill,
  new_lab_exam: FlaskConical,
  appointment_summary: FileText,
  new_vaccine_record: Syringe,
  new_report: ScrollText,
} as const

const NOTIFICATION_COLORS = {
  new_prescription: "text-blue-500 bg-blue-500/10",
  new_lab_exam: "text-purple-500 bg-purple-500/10",
  appointment_summary: "text-green-500 bg-green-500/10",
  new_vaccine_record: "text-amber-500 bg-amber-500/10",
  new_report: "text-cyan-500 bg-cyan-500/10",
} as const

interface Notification {
  _id: Id<"portalNotifications">
  patientId: Id<"patients">
  type: keyof typeof NOTIFICATION_ICONS
  message: string
  isRead: boolean
  createdAt: number
  patientName: string
}

interface NotificationListProps {
  notifications: Notification[]
}

export function NotificationList({ notifications }: NotificationListProps) {
  const markRead = useMutation(api.portal.markNotificationRead)
  const markAllRead = useMutation(api.portal.markAllNotificationsRead)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Check className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p>All caught up! No notifications.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead({})}
          >
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => {
          const Icon = NOTIFICATION_ICONS[notification.type]
          const colorClass = NOTIFICATION_COLORS[notification.type]

          return (
            <div
              key={notification._id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                notification.isRead
                  ? "border-border/50 bg-card/30"
                  : "border-primary/20 bg-primary/5"
              )}
              onClick={() => {
                if (!notification.isRead) {
                  markRead({ notificationId: notification._id })
                }
              }}
            >
              <div className={cn("rounded-lg p-2 shrink-0", colorClass)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm",
                  notification.isRead ? "text-muted-foreground" : "text-foreground font-medium"
                )}>
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {notification.patientName}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
