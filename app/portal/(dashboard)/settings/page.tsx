"use client"

import { authClient } from "@/lib/auth-client"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, Mail, Settings, Sparkles, Check, Loader2, CreditCard } from "lucide-react"
import { useState, useEffect } from "react"

export default function SettingsPage() {
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = session?.user

  const subscription = useQuery(api.patientSubscriptions.getMySubscription)
  const aiStatus = useQuery(api.portalAi.canUseAI)
  const createCheckout = useAction(api.patientSubscriptions.createCheckout)
  const createPortalSession = useAction(api.patientSubscriptions.createPortalSession)

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get("subscription") === "success") {
      setSuccessMessage("Your Scrybe Assist Premium subscription is now active!")
      // Clean up the URL
      window.history.replaceState({}, "", "/portal/settings")
    }
  }, [searchParams])

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/")
  }

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      const { url } = await createCheckout()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const { url } = await createPortalSession()
      window.location.href = url
    } catch (error) {
      console.error("Portal session error:", error)
    } finally {
      setPortalLoading(false)
    }
  }

  const displayName = user?.name || "User"
  const email = user?.email || ""
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isPremium =
    subscription?.plan === "premium" &&
    (subscription?.status === "active" || subscription?.status === "trialing")

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Profile Section */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile
        </h3>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.image || ""} alt={displayName} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-lg">{displayName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {email}
            </p>
          </div>
        </div>
      </div>

      {/* Scrybe Assist Subscription */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Scrybe Assist
          {isPremium && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              Premium
            </Badge>
          )}
        </h3>

        {isPremium ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You have unlimited AI-powered explanations for all your children&apos;s medical records.
            </p>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium">Premium Plan</p>
                <p className="text-xs text-muted-foreground">$4.99/month</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600/20">
                {subscription?.status === "trialing" ? "Trial" : "Active"}
              </Badge>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Manage Subscription
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get AI-powered explanations of your children&apos;s medications, diagnoses, lab exams,
              growth data, and vaccinations.
            </p>

            {/* Usage Counter */}
            {aiStatus && (
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Free Usage</p>
                  <p className="text-sm text-muted-foreground">
                    {aiStatus.used ?? 0} of {aiStatus.limit} used this month
                  </p>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(((aiStatus.used ?? 0) / (aiStatus.limit || 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">Upgrade to Premium</span>
                <div>
                  <span className="text-xl font-bold">$4.99</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {[
                  "Unlimited AI explanations",
                  "All 5 explanation types",
                  "Works for all your children",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleUpgrade}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Upgrade to Premium
            </Button>
          </div>
        )}
      </div>

      {/* Account Actions */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Account
        </h3>
        <div className="space-y-3">
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
