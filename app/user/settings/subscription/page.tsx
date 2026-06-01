'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  TrendingUp,
  Calendar,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BuyCreditPacksDialog } from '@/components/billing/buy-credit-packs-dialog';

export default function SubscriptionSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [buyPacksOpen, setBuyPacksOpen] = useState(false);

  const subscriptionDetails = useQuery(api.subscriptions.getCurrentSubscriptionDetails);
  const usageWithLimits = useQuery(api.usage.getUsageWithLimits);
  const stripeCustomerId = useQuery(api.stripe.getStripeCustomerId);
  const tiers = useQuery(api.stripe.getSubscriptionTiers);
  const createPortalSession = useAction(api.stripe.createPortalSession);

  // Check for success message from checkout
  const subscriptionSuccess = searchParams.get('subscription') === 'success';

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
        return 'bg-primary/10 text-primary';
      case 'complete':
        return 'bg-amber-100 text-amber-600';
      case 'institution':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Canceled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!subscriptionDetails) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasNoSubscription = subscriptionDetails.status === 'none';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Banner */}
      {subscriptionSuccess && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-800">Subscription activated!</h3>
            <p className="text-sm text-green-700">
              Your subscription is now active. Enjoy all the features of your new plan.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
        <p className="text-muted-foreground">Manage your subscription plan and view usage</p>
      </div>

      {/* No Subscription - Prompt to Subscribe */}
      {hasNoSubscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>No Active Subscription</CardTitle>
                <CardDescription>
                  Subscribe to unlock all features including AI diagnostics, vaccination management, and more.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-foreground">Start your 7-day free trial</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose a plan that fits your practice. All plans include a 7-day free trial.
                  </p>
                  {tiers && (
                    <div className="mt-3 flex gap-4 text-sm">
                      {tiers.filter(t => !t.isCustom).map((tier) => {
                        const colors: Record<string, string> = {
                          essentials: 'text-blue-600',
                          professional: 'text-violet-600',
                          complete: 'text-amber-600',
                        };
                        return (
                          <span key={tier._id} className={`${colors[tier.name] || 'text-foreground'} font-medium`}>
                            {tier.displayName} ${Math.round(tier.priceAmountCents / 100)}/mo
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Button asChild>
                  <Link href="/user/pricing">
                    View Plans
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Current Plan Card */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", getTierColor(subscriptionDetails.tier))}>
                  {getTierIcon(subscriptionDetails.tier)}
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {subscriptionDetails.tierDisplayName} Plan
                    {getStatusBadge(subscriptionDetails.status)}
                  </CardTitle>
                  <CardDescription>
                    {subscriptionDetails.cancelAtPeriodEnd
                      ? 'Your subscription will cancel at the end of the current period'
                      : 'Your subscription renews automatically'
                    }
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={isLoadingPortal}
              >
                {isLoadingPortal ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Manage Billing
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {subscriptionDetails.status === 'trialing' && subscriptionDetails.trialEnd && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Trial ends</p>
                  <p className="font-medium">{formatDate(subscriptionDetails.trialEnd)}</p>
                </div>
              )}
              {subscriptionDetails.currentPeriodEnd && (
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    {subscriptionDetails.cancelAtPeriodEnd ? 'Access until' : 'Next billing'}
                  </p>
                  <p className="font-medium">{formatDate(subscriptionDetails.currentPeriodEnd)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show usage, limits, and features only when there's an active subscription */}
      {!hasNoSubscription && (
        <>
          {/* Usage Overview */}
          {usageWithLimits && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  Usage This Month
                </CardTitle>
                <CardDescription>
                  Your usage resets on the 1st of each month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Patients */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">Patients</span>
                    <span className="text-muted-foreground">
                      {usageWithLimits.usage.patientCount} / {usageWithLimits.limits.patientCount}
                    </span>
                  </div>
                  <Progress
                    value={usageWithLimits.percentUsed.patientCount}
                    className={cn(
                      "h-2",
                      usageWithLimits.percentUsed.patientCount >= 90 && "bg-red-100"
                    )}
                  />
                  {usageWithLimits.percentUsed.patientCount >= 80 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {usageWithLimits.percentUsed.patientCount >= 100
                        ? 'Limit reached. Upgrade for more patients.'
                        : 'Approaching limit. Consider upgrading.'}
                    </p>
                  )}
                </div>
                {/* Records */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">Records</span>
                    <span className="text-muted-foreground">
                      {usageWithLimits.usage.recordCount} / {usageWithLimits.limits.recordCount}
                    </span>
                  </div>
                  <Progress
                    value={usageWithLimits.percentUsed.recordCount}
                    className={cn(
                      "h-2",
                      usageWithLimits.percentUsed.recordCount >= 90 && "bg-red-100"
                    )}
                  />
                  {usageWithLimits.percentUsed.recordCount >= 80 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {usageWithLimits.percentUsed.recordCount >= 100
                        ? 'Limit reached. Upgrade for more records.'
                        : 'Approaching limit. Consider upgrading.'}
                    </p>
                  )}
                </div>
                {/* AI Credits */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">AI Credits</span>
                    <span className="text-muted-foreground">
                      {usageWithLimits.usage.aiCreditsUsed} / {usageWithLimits.limits.aiCredits}
                      {usageWithLimits.usage.packCreditsRemaining > 0 && (
                        <span className="ml-1 text-primary">+{usageWithLimits.usage.packCreditsRemaining} pack</span>
                      )}
                    </span>
                  </div>
                  <Progress
                    value={usageWithLimits.percentUsed.aiCredits}
                    className={cn(
                      "h-2",
                      usageWithLimits.percentUsed.aiCredits >= 90 && "bg-red-100"
                    )}
                  />
                  {usageWithLimits.percentUsed.aiCredits >= 80 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {usageWithLimits.percentUsed.aiCredits >= 100
                        ? 'Credits exhausted. Buy a credit pack or upgrade.'
                        : 'Low on credits. Consider buying a pack or upgrading.'}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setBuyPacksOpen(true)}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Buy credit pack
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Limits</CardTitle>
              <CardDescription>
                Your current plan's resource limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Patients</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(subscriptionDetails.limits.patientCount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Records/mo</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(subscriptionDetails.limits.recordCount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">AI Credits/mo</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(subscriptionDetails.limits as any).aiCredits ?? 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Storage</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(() => {
                      const mb = (subscriptionDetails.limits as any).fileStorageMB ?? 0;
                      return mb >= 1024 ? `${(mb / 1024).toFixed(0)} GB` : `${mb} MB`;
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Features */}
          <Card>
            <CardHeader>
              <CardTitle>Available Features</CardTitle>
              <CardDescription>
                Features included in your {subscriptionDetails.tierDisplayName} plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subscriptionDetails.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-foreground capitalize">
                      {feature.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Prompt for non-complete users */}
          {subscriptionDetails.tier !== 'complete' && subscriptionDetails.tier !== 'institution' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {subscriptionDetails.tier === 'essentials' ? 'Upgrade to Professional or Complete' : 'Upgrade to Complete'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {subscriptionDetails.tier === 'essentials'
                          ? 'Get more AI credits, patient portal, telehealth, and advanced analytics'
                          : 'Get max credits, 1500 patients, 10GB storage, and priority support'}
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href="/user/pricing">
                      View Plans
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      <BuyCreditPacksDialog open={buyPacksOpen} onOpenChange={setBuyPacksOpen} />
    </div>
  );
}
