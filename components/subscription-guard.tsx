'use client'

import { ReactNode, useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UpgradeModal } from '@/components/upgrade-modal';
import { Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionGuardProps {
  /** Feature key to check access for */
  feature: string;
  /** Required tier (for display purposes) */
  requiredTier?: string;
  /** Content to show when user has access */
  children: ReactNode;
  /** Custom fallback when access denied */
  fallback?: ReactNode;
  /** Whether to show a locked overlay instead of fallback */
  showLockedOverlay?: boolean;
  /** Feature name for display */
  featureDisplayName?: string;
  /** Custom className for the wrapper */
  className?: string;
}

/**
 * Guards content based on subscription feature access.
 * Shows upgrade modal when user tries to access locked features.
 */
export function SubscriptionGuard({
  feature,
  requiredTier = 'Professional',
  children,
  fallback,
  showLockedOverlay = true,
  featureDisplayName,
  className,
}: SubscriptionGuardProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const hasAccess = useQuery(api.subscriptions.hasFeatureAccess, { feature });

  // Still loading
  if (hasAccess === undefined) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // User has access
  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showLockedOverlay) {
    return (
      <>
        <div 
          className={cn("relative cursor-pointer", className)}
          onClick={() => setShowUpgrade(true)}
        >
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
            <div className="text-center p-4">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">
                {featureDisplayName || feature.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Upgrade to {requiredTier} to unlock
              </p>
            </div>
          </div>
          <div className="opacity-30 pointer-events-none select-none">
            {children}
          </div>
        </div>

        <UpgradeModal
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          reason="feature_locked"
          featureName={featureDisplayName || feature.replace(/_/g, ' ')}
        />
      </>
    );
  }

  return null;
}

interface AIQueryGuardProps {
  /** Content to show when user can make queries */
  children: ReactNode;
  /** Callback when query is blocked */
  onBlocked?: (reason: string) => void;
  /** Custom fallback when blocked */
  fallback?: ReactNode;
  /** Feature to check (ai_diagnostic_suggestions, ai_prescription_recommendations, etc.) */
  aiFeature?: string;
}

/**
 * Guards AI query functionality based on subscription limits.
 * Checks both feature access and query limits.
 */
export function AIQueryGuard({
  children,
  onBlocked,
  fallback,
  aiFeature,
}: AIQueryGuardProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [blockReason, setBlockReason] = useState<'feature' | 'limit' | null>(null);
  
  const canMakeQuery = useQuery(api.usage.canMakeAIQuery);
  const hasFeatureAccess = useQuery(
    api.subscriptions.hasFeatureAccess, 
    aiFeature ? { feature: aiFeature } : 'skip'
  );

  // Still loading
  if (canMakeQuery === undefined || (aiFeature && hasFeatureAccess === undefined)) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check feature access first
  if (aiFeature && !hasFeatureAccess) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <>
        <div 
          className="cursor-pointer"
          onClick={() => {
            setBlockReason('feature');
            setShowUpgrade(true);
            onBlocked?.('Feature not available on your plan');
          }}
        >
          {children}
        </div>

        <UpgradeModal
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          reason="feature_locked"
          featureName={aiFeature.replace(/_/g, ' ')}
        />
      </>
    );
  }

  // Check query limit
  if (!canMakeQuery.allowed) {
    if (fallback) return <>{fallback}</>;

    return (
      <>
        <div 
          className="cursor-pointer"
          onClick={() => {
            setBlockReason('limit');
            setShowUpgrade(true);
            onBlocked?.(canMakeQuery.reason || 'Query limit reached');
          }}
        >
          {children}
        </div>

        <UpgradeModal
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          reason="ai_query_limit"
          limit={canMakeQuery.remaining === 0 ? 50 : undefined} // Estimate
        />
      </>
    );
  }

  // User can proceed
  return <>{children}</>;
}

/**
 * Hook to check if user can perform an action
 */
export function useSubscriptionCheck(feature?: string) {
  const hasFeatureAccess = useQuery(
    api.subscriptions.hasFeatureAccess,
    feature ? { feature } : 'skip'
  );
  const currentTier = useQuery(api.subscriptions.getCurrentTier);
  const subscriptionDetails = useQuery(api.subscriptions.getCurrentSubscriptionDetails);

  return {
    hasAccess: feature ? hasFeatureAccess : true,
    tier: currentTier,
    subscription: subscriptionDetails,
    isLoading: hasFeatureAccess === undefined || currentTier === undefined,
  };
}

/**
 * Hook for AI query access
 */
export function useAIQueryAccess(aiFeature?: string) {
  const canMakeQuery = useQuery(api.usage.canMakeAIQuery);
  const hasFeatureAccess = useQuery(
    api.subscriptions.hasFeatureAccess,
    aiFeature ? { feature: aiFeature } : 'skip'
  );

  const isAllowed = 
    (aiFeature ? hasFeatureAccess : true) && 
    canMakeQuery?.allowed;

  return {
    isAllowed,
    canQuery: canMakeQuery,
    hasFeature: aiFeature ? hasFeatureAccess : true,
    isLoading: canMakeQuery === undefined || (aiFeature && hasFeatureAccess === undefined),
    reason: !isAllowed 
      ? (aiFeature && !hasFeatureAccess 
          ? 'Feature not available on your plan' 
          : canMakeQuery?.reason)
      : undefined,
  };
}
