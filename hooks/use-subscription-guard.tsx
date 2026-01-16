"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface SubscriptionGuardContextType {
  hasActiveSubscription: boolean;
  isLoading: boolean;
  requireSubscription: (actionName: string) => boolean;
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

  const requireSubscription = useCallback((actionName: string): boolean => {
    if (isLoading) {
      // Still loading, block action but don't show dialog
      return false;
    }
    
    if (hasActiveSubscription) {
      return true;
    }
    
    // No active subscription - show dialog
    setBlockedAction(actionName);
    setDialogOpen(true);
    return false;
  }, [hasActiveSubscription, isLoading]);

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
