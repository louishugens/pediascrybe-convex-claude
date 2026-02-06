"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export function SubscriptionBanner() {
  const subscription = useQuery(api.subscriptions.getCurrentSubscriptionDetails);
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage for dismissed state (resets daily)
  useEffect(() => {
    const dismissedDate = localStorage.getItem("subscription_banner_dismissed");
    if (dismissedDate) {
      const today = new Date().toDateString();
      if (dismissedDate === today) {
        setDismissed(true);
      } else {
        localStorage.removeItem("subscription_banner_dismissed");
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("subscription_banner_dismissed", new Date().toDateString());
  };

  // Don't show if loading
  if (!subscription) return null;

  // Show banner for users with no subscription
  if (subscription.status === "none" && !dismissed) {
    return (
      <div className="px-4 pt-4">
        <Alert className="relative border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="flex items-center gap-2">
            No Active Subscription
          </AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>
              Subscribe to a plan to unlock all features and start managing your patients.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/user/pricing">
                <Button size="sm" variant="default">
                  View Plans
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Don't show if dismissed
  if (dismissed) return null;

  // Calculate days remaining in trial
  const isTrialing = subscription.status === "trialing";
  const trialEnd = subscription.trialEnd;
  
  let daysRemaining = 0;
  if (isTrialing && trialEnd) {
    const now = Date.now();
    const trialEndMs = trialEnd * 1000; // Convert from seconds to ms
    daysRemaining = Math.ceil((trialEndMs - now) / (1000 * 60 * 60 * 24));
  }

  // Show banner if trial is ending soon (3 days or less)
  const showTrialWarning = isTrialing && daysRemaining <= 3 && daysRemaining > 0;

  // Show banner if trial has ended (will be converted to active or canceled)
  const trialEnded = isTrialing && daysRemaining <= 0;

  if (!showTrialWarning && !trialEnded) return null;

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium truncate">
            {trialEnded ? (
              "Your trial has ended"
            ) : (
              <>
                <Sparkles className="inline h-3.5 w-3.5 text-primary mr-1" />
                {daysRemaining === 1 ? "1 day" : `${daysRemaining} days`} left in your trial
              </>
            )}
            <span className="text-muted-foreground font-normal ml-1.5">
              {trialEnded
                ? "— Subscribe now to continue using all features."
                : "— Subscribe now to ensure uninterrupted access to all features."}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/user/pricing">
            <Button size="sm" className="h-7 text-xs">
              Subscribe
            </Button>
          </Link>
          {!trialEnded && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleDismiss}
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
