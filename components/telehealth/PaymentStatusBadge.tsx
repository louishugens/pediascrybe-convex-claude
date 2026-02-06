"use client"

import { Badge } from "@/components/ui/badge"

const PAYMENT_CONFIG = {
  pending: { label: "Payment Pending", className: "border-yellow-500 text-yellow-700 bg-yellow-50" },
  paid: { label: "Paid", className: "border-green-500 text-green-700 bg-green-50" },
  waived: { label: "Waived", className: "border-blue-500 text-blue-700 bg-blue-50" },
}

export function PaymentStatusBadge({ status }: { status: "pending" | "paid" | "waived" }) {
  const config = PAYMENT_CONFIG[status]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
