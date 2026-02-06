"use client"

import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG = {
  requested: { label: "Requested", variant: "outline" as const, className: "border-yellow-500 text-yellow-700 bg-yellow-50" },
  confirmed: { label: "Confirmed", variant: "outline" as const, className: "border-green-500 text-green-700 bg-green-50" },
  rescheduled: { label: "Rescheduled", variant: "outline" as const, className: "border-blue-500 text-blue-700 bg-blue-50" },
  completed: { label: "Completed", variant: "outline" as const, className: "border-gray-500 text-gray-700 bg-gray-50" },
  cancelled: { label: "Cancelled", variant: "outline" as const, className: "border-red-500 text-red-700 bg-red-50" },
  no_show: { label: "No Show", variant: "outline" as const, className: "border-orange-500 text-orange-700 bg-orange-50" },
}

export function TelehealthStatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
