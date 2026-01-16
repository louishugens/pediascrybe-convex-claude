"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function SubscriptionSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: isAuthPending } = authClient.useSession();
  const syncMySubscription = useAction(api.stripe.syncMySubscription);
  const subscription = useQuery(api.subscriptions.getCurrentSubscriptionDetails);
  const hasSynced = useRef(false);
  const hasShownSuccess = useRef(false);
  const [syncFailed, setSyncFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const subscriptionStatus = searchParams.get("subscription");
  const isAuthenticated = !isAuthPending && !!session?.user;

  // Remove query param on mount if success
  useEffect(() => {
    if (subscriptionStatus === "success") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("subscription");
      router.replace((newUrl.pathname + newUrl.search) as any, { scroll: false });
    }
  }, [subscriptionStatus, router]);

  // Sync subscription when authenticated and success param was present
  useEffect(() => {
    if (subscriptionStatus === "success" && isAuthenticated && !hasSynced.current) {
      hasSynced.current = true;
      
      const sync = async () => {
        try {
          const result = await syncMySubscription();
          if (result.success) {
            toast.success("Subscription activated!", {
              description: `You're now on the ${result.message?.replace("Synced as ", "")} plan.`,
            });
            hasShownSuccess.current = true;
            setSyncFailed(false);
          } else {
            // Webhook might have already synced - let the subscription query handle it
            setSyncFailed(true);
          }
        } catch (error) {
          console.error("Failed to sync subscription:", error);
          // Webhook might have already synced - let the subscription query handle it
          setSyncFailed(true);
        }
      };
      
      sync();
    }
  }, [subscriptionStatus, isAuthenticated, syncMySubscription]);

  // If subscription loaded and is active, hide any error and show success
  useEffect(() => {
    if (subscription && subscription.status !== "none" && !hasShownSuccess.current) {
      if (syncFailed) {
        setSyncFailed(false);
      }
      // Only show toast if we were trying to sync (subscription=success was in URL)
      if (subscriptionStatus === "success" || hasSynced.current) {
        hasShownSuccess.current = true;
        toast.success("Subscription activated!", {
          description: `You're now on the ${subscription.tierDisplayName} plan.`,
        });
      }
    }
  }, [subscription, syncFailed, subscriptionStatus]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const result = await syncMySubscription();
      if (result.success) {
        toast.success("Subscription synced successfully!", {
          description: `You're now on the ${result.message?.replace("Synced as ", "")} plan.`,
        });
        setSyncFailed(false);
      } else {
        toast.error("Sync failed. Please try again or contact support.");
      }
    } catch (error) {
      console.error("Retry sync failed:", error);
      toast.error("Sync failed. Please try again or contact support.");
    } finally {
      setIsRetrying(false);
    }
  };

  if (!syncFailed) return null;

  return (
    <div className="px-4 pt-4">
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle>Subscription Sync Issue</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            We couldn't sync your subscription automatically. This usually resolves in a few seconds.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
            className="shrink-0"
          >
            {isRetrying ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            Retry Sync
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
