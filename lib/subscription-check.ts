import { isAuthenticated } from '@/lib/auth-server';

// Features that require specific tiers
// Note: AI features (diagnostic, prescription, lab) are available to ALL tiers with quotas
// Quota enforcement happens in Convex - only tier-restricted features listed here
const FEATURE_TIERS: Record<string, string[]> = {
  ai_report_generation: ['professional', 'complete', 'institution'],
  vaccination_management: ['essentials', 'professional', 'complete', 'institution'],
  all_growth_charts: ['essentials', 'professional', 'complete', 'institution'],
};

export interface SubscriptionCheckResult {
  allowed: boolean;
  reason?: string;
  tier?: string;
  remainingQueries?: number;
}

/**
 * Check if user has access to a feature based on their subscription
 * Note: Server-side subscription checks are handled by Convex mutations/queries.
 * This is a placeholder for potential future server-side API route checks.
 */
export async function checkFeatureAccess(feature: string): Promise<SubscriptionCheckResult> {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return {
        allowed: false,
        reason: 'Authentication required',
      };
    }

    // Feature access is primarily checked via Convex queries on the client
    // Server-side mutations in Convex already enforce subscription limits
    const requiredTiers = FEATURE_TIERS[feature];
    
    if (!requiredTiers) {
      // Feature not restricted
      return { allowed: true };
    }

    // Return allowed - actual enforcement happens in Convex
    return { allowed: true };
  } catch (error) {
    console.error('Feature access check error:', error);
    return {
      allowed: false,
      reason: 'Error checking subscription',
    };
  }
}

/**
 * Check if user can make an AI query (within limits)
 * Note: Actual limit enforcement happens in Convex queries/mutations.
 */
export async function checkAIQueryLimit(): Promise<SubscriptionCheckResult> {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return {
        allowed: false,
        reason: 'Authentication required',
      };
    }

    // Return allowed - actual enforcement happens in Convex
    return { allowed: true, remainingQueries: 0 };
  } catch (error) {
    console.error('AI query limit check error:', error);
    return {
      allowed: false,
      reason: 'Error checking usage limits',
    };
  }
}

/**
 * Combined check for AI feature + query limit
 */
export async function checkAIAccess(feature: string): Promise<SubscriptionCheckResult> {
  // Check feature access
  const featureCheck = await checkFeatureAccess(feature);
  if (!featureCheck.allowed) {
    return featureCheck;
  }

  // Check query limit
  const limitCheck = await checkAIQueryLimit();
  if (!limitCheck.allowed) {
    return limitCheck;
  }

  return {
    allowed: true,
    remainingQueries: limitCheck.remainingQueries,
  };
}
