"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Send, UserPlus, Crown } from "lucide-react"

interface InviteDialogProps {
  patientId: Id<"patients">
  patientEmail?: string
  patientName: string
}

export function InviteDialog({ patientId, patientEmail, patientName }: InviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(patientEmail || "")
  const [loading, setLoading] = useState(false)

  const createInvitation = useMutation(api.invitations.createInvitation)
  const hasAccess = useQuery(api.subscriptions.hasFeatureAccess, { feature: "patient_portal" })

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    setLoading(true)
    try {
      await createInvitation({ patientId, email: email.trim() })
      toast.success(`Invitation sent to ${email}`)
      setOpen(false)
      setEmail("")
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  // If no access, show upgrade prompt
  if (hasAccess === false) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite to Portal
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Upgrade Required
            </DialogTitle>
            <DialogDescription>
              The Parent Portal is available on Pro and Premium plans.
              Upgrade your subscription to invite parents to view their child&apos;s health records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite to Portal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Parent to Portal</DialogTitle>
          <DialogDescription>
            Send an invitation to {patientName}&apos;s parent or guardian.
            They&apos;ll be able to view medical records, print prescriptions, and track vaccinations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Parent Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInvite()
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            An email will be sent with a link to create an account and access the Parent Portal.
            The invitation expires in 7 days.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading} className="gap-2">
            {loading ? <Spinner /> : <Send className="h-4 w-4" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
