'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, X, Sparkles, Zap, Crown, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Feature display configuration
const FEATURE_LABELS: Record<string, { label: string; description?: string }> = {
  emr: { label: 'Patient Management (EMR)', description: 'Full electronic medical records' },
  basic_growth_charts: { label: 'Basic Growth Charts (3 types)', description: 'Weight, height, and BMI charts' },
  all_growth_charts: { label: 'All WHO Growth Charts (9 types)', description: 'Complete WHO growth standards' },
  vaccination_management: { label: 'Vaccination Management', description: 'Immunization schedules & tracking' },
  ai_diagnostic_suggestions: { label: 'AI Diagnostic Suggestions', description: 'Smart differential diagnosis' },
  ai_prescription_recommendations: { label: 'AI Prescription Recommendations', description: 'Weight-based dosing suggestions' },
  ai_lab_proposals: { label: 'AI Lab Exam Proposals', description: 'Pediatric-specific lab recommendations' },
  ai_report_generation: { label: 'AI Report Generation', description: 'Automated clinical documentation' },
  billing_receipts: { label: 'Basic Billing & Receipts' },
  multi_currency: { label: 'Multi-Currency Support' },
  basic_templates: { label: 'Basic Document Templates' },
  full_templates: { label: 'Full Document Templates & Editor' },

  basic_analytics: { label: 'Basic Analytics Dashboard' },
  advanced_analytics: { label: 'Advanced Analytics Dashboard' },
  analytics_export: { label: 'Analytics Export' },
  pdf_export: { label: 'PDF Export' },
  pdf_csv_export: { label: 'PDF + CSV Export' },
  full_export: { label: 'Full API Access' },
  email_support: { label: 'Email Support (48hr response)' },
  email_chat_support: { label: 'Email + Chat Support (24hr response)' },
  priority_support: { label: '24/7 Priority Support + Phone' },

};

// Features to highlight in the comparison table (aligned with pricing doc)
const COMPARISON_FEATURES = [
  // Quotas
  { key: 'patients', label: 'Patient Count' },
  { key: 'records', label: 'Record Count' },
  { key: 'scrybegpt', label: 'ScrybeGPT Messages' },
  // Core Features
  { key: 'emr', label: 'Patient Management (EMR)' },
  { key: 'basic_growth_charts', label: 'WHO Growth Charts (Basic - 3 types)' },
  { key: 'all_growth_charts', label: 'WHO Growth Charts (All 9 types)' },
  { key: 'vaccination_management', label: 'Vaccination Management' },
  { key: 'billing_receipts', label: 'Basic Billing & Receipts' },
  { key: 'multi_currency', label: 'Multi-Currency Support' },
  // AI Features (quota-based)
  { key: 'ai_diagnostic', label: 'AI Diagnostic Suggestions' },
  { key: 'ai_prescription', label: 'AI Prescription Recommendations' },
  { key: 'ai_lab_exam', label: 'AI Lab Exam Proposals' },
  { key: 'ai_report', label: 'AI Report Generation' },
  // Analytics & Support
  { key: 'analytics', label: 'Analytics Dashboard' },
  { key: 'support', label: 'Priority Support' },
  { key: 'pdf_export', label: 'Data Export - PDF' },
];

// Format price from cents to display string
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function UserPricingPage() {
  const searchParams = useSearchParams();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  
  const tiers = useQuery(api.stripe.getSubscriptionTiers);
  const currentSubscription = useQuery(api.subscriptions.getCurrentSubscriptionDetails);
  const stripeCustomerId = useQuery(api.stripe.getStripeCustomerId);

  // Check for subscription canceled message
  const subscriptionCanceled = searchParams.get('subscription') === 'canceled';

  const handleSelectPlan = async (tierName: string) => {
    setLoadingTier(tierName);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierName,
          customerId: stripeCustomerId,
          successUrl: `${window.location.origin}/user?subscription=success`,
          cancelUrl: `${window.location.origin}/user/pricing?subscription=canceled`,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
    } finally {
      setLoadingTier(null);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case 'starter':
        return <Zap className="w-6 h-6" />;
      case 'pro':
        return <Sparkles className="w-6 h-6" />;
      case 'premium':
        return <Crown className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  const getFeatureValue = (tier: typeof tiers extends (infer T)[] | undefined ? T : never, featureKey: string): string | boolean => {
    if (!tier) return false;
    
    switch (featureKey) {
      // Quota-based limits
      case 'patients':
        return tier.limits.patientCount === -1 ? 'Unlimited' : `${tier.limits.patientCount.toLocaleString()}`;
      case 'records':
        return tier.limits.recordCount === -1 ? 'Unlimited' : `${tier.limits.recordCount.toLocaleString()}`;
      case 'scrybegpt':
        return tier.limits.scrybegptMessages === -1 ? 'Unlimited' : `${tier.limits.scrybegptMessages}/mo`;
      // AI features with quotas
      case 'ai_prescription':
        return tier.limits.aiPrescription === -1 ? 'Unlimited' : tier.limits.aiPrescription === 0 ? false : `${tier.limits.aiPrescription}/mo`;
      case 'ai_lab_exam':
        return tier.limits.aiLabExam === -1 ? 'Unlimited' : tier.limits.aiLabExam === 0 ? false : `${tier.limits.aiLabExam}/mo`;
      case 'ai_diagnostic':
        return tier.limits.aiDiagnostic === -1 ? 'Unlimited' : tier.limits.aiDiagnostic === 0 ? false : `${tier.limits.aiDiagnostic}/mo`;
      case 'ai_report':
        return tier.limits.aiReport === -1 ? 'Unlimited' : tier.limits.aiReport === 0 ? false : `${tier.limits.aiReport}/mo`;
      // Analytics - show tier-specific value
      case 'analytics':
        return tier.features.includes('advanced_analytics') ? 'Advanced' : 'Basic';
      // Support - show tier-specific value
      case 'support':
        if (tier.features.includes('priority_support')) return '24/7 + Phone';
        if (tier.features.includes('email_chat_support')) return 'Email + Chat';
        return 'Email';
      default:
        return tier.features.includes(featureKey);
    }
  };

  const hasActiveSubscription = currentSubscription && currentSubscription.status !== 'none';
  const currentTier = currentSubscription?.tier;

  if (!tiers) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/user/profile" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Profile
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {hasActiveSubscription ? 'Change Your Plan' : 'Choose Your Plan'}
        </h1>
        <p className="text-muted-foreground">
          {hasActiveSubscription 
            ? `You're currently on the ${currentSubscription.tierDisplayName} plan`
            : 'Start with a 7-day free trial on any plan'
          }
        </p>
      </div>

      {subscriptionCanceled && (
        <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-800">
            Your checkout was canceled. Feel free to try again when you're ready.
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {tiers.map((tier) => {
          const isCurrentPlan = currentTier === tier.name;
          const isLoading = loadingTier === tier.name;
          
          return (
            <div
              key={tier._id}
              className={cn(
                "relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-lg",
                tier.isPopular && "border-primary shadow-md ring-2 ring-primary/20",
                isCurrentPlan && "ring-2 ring-green-500/50 border-green-500"
              )}
            >
              {tier.isPopular && !isCurrentPlan && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Current Plan
                </div>
              )}

              <div className="p-6">
                {/* Tier Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    tier.name === 'starter' && "bg-blue-100 text-blue-600",
                    tier.name === 'pro' && "bg-primary/10 text-primary",
                    tier.name === 'premium' && "bg-amber-100 text-amber-600"
                  )}>
                    {getTierIcon(tier.name)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{tier.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {formatPrice(tier.priceAmountCents)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    7-day free trial included
                  </p>
                </div>

                {/* Limits Summary */}
                <div className="space-y-2 mb-6 pb-6 border-b">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Patients</span>
                    <span className="font-medium">
                      {tier.limits.patientCount === -1 ? 'Unlimited' : tier.limits.patientCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Records</span>
                    <span className="font-medium">
                      {tier.limits.recordCount === -1 ? 'Unlimited' : tier.limits.recordCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ScrybeGPT Messages</span>
                    <span className="font-medium">
                      {tier.limits.scrybegptMessages === -1 ? 'Unlimited' : `${tier.limits.scrybegptMessages}/mo`}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                {isCurrentPlan ? (
                  <Button disabled className="w-full" variant="outline" size="lg">
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSelectPlan(tier.name)}
                    disabled={isLoading}
                    className="w-full"
                    variant={tier.isPopular ? "default" : "outline"}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : hasActiveSubscription ? (
                      <>
                        Switch to {tier.displayName}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Start Free Trial
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}

                {/* Key Features */}
                <div className="mt-6 space-y-3">
                  {tier.features.slice(0, 8).map((feature) => {
                    const featureInfo = FEATURE_LABELS[feature];
                    if (!featureInfo) return null;
                    return (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{featureInfo.label}</span>
                      </div>
                    );
                  })}
                  {tier.features.length > 8 && (
                    <p className="text-sm text-primary font-medium">
                      + {tier.features.length - 8} more features
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Compare all features
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-medium text-muted-foreground">Feature</th>
                {tiers.map((tier) => (
                  <th key={tier._id} className="text-center py-4 px-4">
                    <span className="font-bold text-foreground">{tier.displayName}</span>
                    <p className="text-sm font-normal text-muted-foreground">
                      {formatPrice(tier.priceAmountCents)}/mo
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((feature) => (
                <tr key={feature.key} className="border-b last:border-b-0">
                  <td className="py-4 px-4 text-sm text-foreground">{feature.label}</td>
                  {tiers.map((tier) => {
                    const value = getFeatureValue(tier, feature.key);
                    return (
                      <td key={tier._id} className="text-center py-4 px-4">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <Check className="w-5 h-5 text-primary mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-foreground">{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Frequently Asked Questions
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border">
            <h3 className="font-semibold text-foreground mb-2">Can I change my plan later?</h3>
            <p className="text-muted-foreground text-sm">
              Yes, you can upgrade or downgrade at any time. Changes take effect immediately for upgrades.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border">
            <h3 className="font-semibold text-foreground mb-2">What happens to my data if I downgrade?</h3>
            <p className="text-muted-foreground text-sm">
              Your data is always safe. If you exceed the new plan's limits, you'll keep access to existing data but can't add more.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border">
            <h3 className="font-semibold text-foreground mb-2">How do I cancel my subscription?</h3>
            <p className="text-muted-foreground text-sm">
              You can cancel anytime from the Manage Billing portal. You'll keep access until the end of your billing period.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border">
            <h3 className="font-semibold text-foreground mb-2">Is there a contract?</h3>
            <p className="text-muted-foreground text-sm">
              No contracts. All plans are month-to-month with no long-term commitment required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
