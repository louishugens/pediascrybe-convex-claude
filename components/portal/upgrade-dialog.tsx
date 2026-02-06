"use client"

import { useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Check, Loader2 } from "lucide-react"

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const createCheckout = useAction(api.patientSubscriptions.createCheckout)
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const { url } = await createCheckout()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Upgrade to Scrybe Assist Premium</DialogTitle>
              <DialogDescription>
                You&apos;ve used all 5 free AI explanations this month
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-lg">Premium</span>
              <div className="text-right">
                <span className="text-2xl font-bold">$4.99</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
            </div>

            <ul className="space-y-2 text-sm">
              {[
                "Unlimited AI explanations",
                "All medication, diagnostic, and vaccine explanations",
                "Growth chart summaries",
                "Lab exam preparation guides",
                "Works for all your children",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Maybe Later
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Upgrade Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
