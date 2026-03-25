"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Mirror of FEATURE_ACCESS from convex/subscriptions.ts (client-side check)
const FEATURE_ACCESS: Record<string, string[]> = {
  emr: ["starter", "pro", "premium"],
  basic_growth_charts: ["starter", "pro", "premium"],
  billing_receipts: ["starter", "pro", "premium"],
  multi_currency: ["starter", "pro", "premium"],
  scrybegpt: ["starter", "pro", "premium"],
  ai_diagnostic: ["starter", "pro", "premium"],
  ai_prescription: ["starter", "pro", "premium"],
  ai_lab_exam: ["starter", "pro", "premium"],
  basic_analytics: ["starter", "pro", "premium"],
  pdf_export: ["starter", "pro", "premium"],
  email_support: ["starter", "pro", "premium"],
  vaccination_management: ["pro", "premium"],
  all_growth_charts: ["pro", "premium"],
  ai_report: ["pro", "premium"],
  advanced_analytics: ["pro", "premium"],
  email_chat_support: ["pro", "premium"],
  patient_portal: ["pro", "premium"],
  priority_support: ["premium"],
  telehealth: ["premium"],
  staff_accounts: ["premium"],
  whatsapp_scrybegpt: [ "premium"],
};

interface SubscriptionGuardContextType {
  hasActiveSubscription: boolean;
  isLoading: boolean;
  requireSubscription: (actionName: string) => boolean;
  requireFeature: (feature: string, actionName: string) => boolean;
  tierName: string | null;
  dialogOpen: boolean;
  blockedAction: string | null;
  closeDialog: () => void;
}

const SubscriptionGuardContext = createContext<SubscriptionGuardContextType | null>(null);

export function SubscriptionGuardProvider({ children }: { children: ReactNode }) {
  const subscription = useQuery(api.subscriptions.getCurrentSubscriptionDetails);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [blockedAction, setBlockedAction] = useState<string | null>(null);

  const isLoading = subscription === undefined;

  const hasActiveSubscription =
    subscription?.status === "active" ||
    subscription?.status === "trialing";

  console.log("subscription", subscription);

  const tierName = hasActiveSubscription ? (subscription?.tier || null) : null;

  const requireSubscription = useCallback((actionName: string): boolean => {
    if (isLoading) {
      return false;
    }

    if (hasActiveSubscription) {
      return true;
    }

    setBlockedAction(actionName);
    setDialogOpen(true);
    return false;
  }, [hasActiveSubscription, isLoading]);

  const requireFeature = useCallback((feature: string, actionName: string): boolean => {
    if (isLoading) {
      return false;
    }

    if (!hasActiveSubscription) {
      setBlockedAction(actionName);
      setDialogOpen(true);
      return false;
    }

    // Check if the current tier has access to this feature
    const allowedTiers = FEATURE_ACCESS[feature];
    if (!allowedTiers || !tierName || !allowedTiers.includes(tierName)) {
      const minTier = allowedTiers?.[0] || "Premium";
      setBlockedAction(`${actionName} (requires ${minTier.charAt(0).toUpperCase() + minTier.slice(1)}+ plan)`);
      setDialogOpen(true);
      return false;
    }

    return true;
  }, [hasActiveSubscription, isLoading, tierName]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setBlockedAction(null);
  }, []);

  return (
    <SubscriptionGuardContext.Provider
      value={{
        hasActiveSubscription,
        isLoading,
        requireSubscription,
        requireFeature,
        tierName,
        dialogOpen,
        blockedAction,
        closeDialog,
      }}
    >
      {children}
    </SubscriptionGuardContext.Provider>
  );
}

export function useSubscriptionGuard() {
  const context = useContext(SubscriptionGuardContext);

  if (!context) {
    throw new Error("useSubscriptionGuard must be used within a SubscriptionGuardProvider");
  }

  return context;
}
