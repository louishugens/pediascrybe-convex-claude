"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Globe, Clock, CheckCircle2 } from "lucide-react"

interface InvitationStatusBadgeProps {
  patientId: Id<"patients">
}

export function InvitationStatusBadge({ patientId }: InvitationStatusBadgeProps) {
  const invitations = useQuery(api.invitations.listByPatient, { patientId })

  if (!invitations || invitations.length === 0) {
    return null
  }

  const hasAccepted = invitations.some((inv) => inv.status === "accepted")
  const hasPending = invitations.some((inv) => inv.status === "pending")

  if (hasAccepted) {
    return (
      <Badge variant="secondary" className="text-xs gap-1 bg-green-500/10 text-green-700 border-green-500/20">
        <Globe className="h-3 w-3" />
        Portal Active
      </Badge>
    )
  }

  if (hasPending) {
    return (
      <Badge variant="secondary" className="text-xs gap-1 bg-amber-500/10 text-amber-700 border-amber-500/20">
        <Clock className="h-3 w-3" />
        Portal Pending
      </Badge>
    )
  }

  return null
}
