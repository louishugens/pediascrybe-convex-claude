'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { 
  CreditCard, 
  Crown, 
  Zap, 
  Sparkles, 
  ExternalLink, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader2,
  Settings,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function SubscriptionSection() {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const subscriptionDetails = useQuery(api.subscriptions.getCurrentSubscriptionDetails);
  const usageWithLimits = useQuery(api.usage.getUsageWithLimits);
  const stripeCustomerId = useQuery(api.stripe.getStripeCustomerId);
  const tiers = useQuery(api.stripe.getSubscriptionTiers);
  const createPortalSession = useAction(api.stripe.createPortalSession);

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) {
      toast.error('No subscription found');
      return;
    }

    setIsLoadingPortal(true);
    try {
      const { url } = await createPortalSession({});
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Portal session error:', error);
      toast.error('Failed to open subscription management');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case 'essentials':
        return <Zap className="w-5 h-5" />;
      case 'professional':
        return <Sparkles className="w-5 h-5" />;
      case 'complete':
        return <Crown className="w-5 h-5" />;
      case 'institution':
        return <Crown className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case 'essentials':
        return 'bg-blue-100 text-blue-600';
      case 'professional':
        return 'bg-violet-100 text-violet-600';
      case 'complete':
        return 'bg-amber-100 text-amber-600';
      case 'institution':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Canceled</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (subscriptionDetails === undefined) {
    return (
      <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  const hasNoSubscription = !subscriptionDetails || subscriptionDetails.status === 'none';

  return (
    <div className="w-full h-auto shadow-md rounded-lg p-4 bg-slate-50 mt-4">
      <div className="flex flex-row items-center justify-between mb-4">
        <p className="text-sm font-semibold">Subscription Plan</p>
        <Link 
          href="/user/settings/subscription" 
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <Settings className="w-3 h-3" />
          Full Details
        </Link>
      </div>

      {/* No Subscription - Prompt to Subscribe */}
      {hasNoSubscription ? (
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">No Active Subscription</h3>
              <p className="text-sm text-slate-500 mt-1">
                Subscribe to unlock all features including AI diagnostics, vaccination management, and more.
              </p>
              <div className="mt-4">
                <Button asChild size="sm">
                  <Link href="/user/pricing">
                    View Plans
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
              {/* Plan highlights — pulled from subscriptionTiers */}
              {tiers && tiers.filter(t => !t.isCustom).length > 0 && (
                <>
                  <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
                    {tiers.filter(t => !t.isCustom).map((tier) => {
                      const colors: Record<string, { bg: string; text: string; ring?: string }> = {
                        essentials: { bg: 'bg-blue-50', text: 'text-blue-600' },
                        professional: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-1 ring-violet-200' },
                        complete: { bg: 'bg-amber-50', text: 'text-amber-600' },
                      };
                      const color = colors[tier.name] || { bg: 'bg-slate-50', text: 'text-slate-600' };
                      return (
                        <div key={tier._id} className={`p-2 rounded ${color.bg} ${color.ring || ''}`}>
                          <p className={`text-sm font-bold ${color.text}`}>
                            ${Math.round(tier.priceAmountCents / 100)}
                          </p>
                          <p className="text-xs text-slate-500">{tier.displayName}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">7-day free trial on all plans</p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Active Subscription Display */
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                getTierColor(subscriptionDetails.tier)
              )}>
                {getTierIcon(subscriptionDetails.tier)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">
                    {subscriptionDetails.tierDisplayName} Plan
                  </h3>
                  {getStatusBadge(subscriptionDetails.status)}
                </div>
                <p className="text-xs text-slate-500">
                  {subscriptionDetails.cancelAtPeriodEnd
                    ? `Cancels on ${formatDate(subscriptionDetails.currentPeriodEnd)}`
                    : subscriptionDetails.status === 'trialing'
                      ? `Trial ends ${formatDate(subscriptionDetails.trialEnd)}`
                      : `Renews ${formatDate(subscriptionDetails.currentPeriodEnd)}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Usage Summary */}
          {usageWithLimits && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <TrendingUp className="w-3 h-3" />
                <span>Usage This Month</span>
              </div>
              
              {/* Patients Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Patients</span>
                  <span className="text-slate-500">
                    {usageWithLimits.usage.patientCount} / {usageWithLimits.limits.patientCount}
                  </span>
                </div>
                <Progress
                  value={usageWithLimits.percentUsed.patientCount}
                  className={cn(
                    "h-1.5",
                    usageWithLimits.percentUsed.patientCount >= 90 && "[&>div]:bg-red-500"
                  )}
                />
              </div>
              {/* Records Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Records</span>
                  <span className="text-slate-500">
                    {usageWithLimits.usage.recordCount} / {usageWithLimits.limits.recordCount}
                  </span>
                </div>
                <Progress
                  value={usageWithLimits.percentUsed.recordCount}
                  className={cn(
                    "h-1.5",
                    usageWithLimits.percentUsed.recordCount >= 90 && "[&>div]:bg-red-500"
                  )}
                />
              </div>

              {/* AI Credits Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">AI Credits</span>
                  <span className="text-slate-500">
                    {usageWithLimits.usage.aiCreditsUsed} / {usageWithLimits.limits.aiCredits}
                    {usageWithLimits.usage.packCreditsRemaining > 0 && (
                      <span className="ml-1 text-primary">+{usageWithLimits.usage.packCreditsRemaining}</span>
                    )}
                  </span>
                </div>
                <Progress
                  value={usageWithLimits.percentUsed.aiCredits}
                  className={cn(
                    "h-1.5",
                    usageWithLimits.percentUsed.aiCredits >= 90 && "[&>div]:bg-red-500"
                  )}
                />
              </div>

              {/* Warning if approaching limits */}
              {(usageWithLimits.percentUsed.patientCount >= 80 || usageWithLimits.percentUsed.aiCredits >= 80) && (
                <p className="text-xs text-amber-600 flex items-center gap-1 pt-1">
                  <AlertCircle className="w-3 h-3" />
                  Approaching usage limits
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManageSubscription}
              disabled={isLoadingPortal}
              className="flex-1"
            >
              {isLoadingPortal ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <CreditCard className="w-3 h-3 mr-1" />
              )}
              Manage Billing
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
            {subscriptionDetails.tier !== 'complete' && subscriptionDetails.tier !== 'institution' && (
              <Button asChild size="sm" variant="default" className="flex-1">
                <Link href="/user/pricing">
                  Upgrade
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {/* Features Preview */}
          {subscriptionDetails.features && subscriptionDetails.features.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-slate-500 mb-2">Included Features</p>
              <div className="flex flex-wrap gap-1">
                {subscriptionDetails.features.slice(0, 6).map((feature) => (
                  <span 
                    key={feature} 
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {feature.replace(/_/g, ' ')}
                  </span>
                ))}
                {subscriptionDetails.features.length > 6 && (
                  <span className="text-xs text-slate-400">
                    +{subscriptionDetails.features.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
