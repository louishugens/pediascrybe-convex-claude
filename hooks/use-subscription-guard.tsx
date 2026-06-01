"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Mirror of FEATURE_ACCESS from convex/subscriptions.ts (client-side check)
const ALL_PAID = ["essentials", "professional", "complete", "institution"];
const PROF_UP = ["professional", "complete", "institution"];
const COMPLETE_UP = ["complete", "institution"];

const FEATURE_ACCESS: Record<string, string[]> = {
  emr: ALL_PAID,
  all_growth_charts: ALL_PAID,
  billing_receipts: ALL_PAID,
  multi_currency: ALL_PAID,
  scrybegpt: ALL_PAID,
  patient_specific_ai: ALL_PAID,
  ai_diagnostic: ALL_PAID,
  ai_prescription: ALL_PAID,
  ai_lab_exam: ALL_PAID,
  vaccination_management: ALL_PAID,
  basic_analytics: ALL_PAID,
  pdf_export: ALL_PAID,
  email_support: ALL_PAID,
  whatsapp_scrybegpt: ALL_PAID, // essentials has trial limit
  ai_report: PROF_UP,
  advanced_analytics: PROF_UP,
  email_chat_support: PROF_UP,
  patient_portal: PROF_UP,
  telehealth: PROF_UP,
  priority_support: COMPLETE_UP,
  staff_accounts: COMPLETE_UP,
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
      const minTier = allowedTiers?.[0] || "Professional";
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
