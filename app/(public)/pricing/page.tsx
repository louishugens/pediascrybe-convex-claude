'use client'

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';

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

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tiers = useQuery(api.stripe.getSubscriptionTiers);

  // Check for subscription canceled message
  const subscriptionCanceled = searchParams.get('subscription') === 'canceled';

  const handleSelectPlan = (tierName: string) => {
    router.push(`/signup?plan=${tierName}`);
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

  if (!tiers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading pricing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-b from-primary/5 to-background pt-20 pb-16">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4">
          {subscriptionCanceled && (
            <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200 max-w-xl mx-auto">
              <p className="text-sm text-amber-800 text-center">
                Your checkout was canceled. Feel free to try again when you're ready.
              </p>
            </div>
          )}

          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-muted-foreground">
              Start with a 7-day free trial on any plan. No credit card required to get started.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier._id}
                className={cn(
                  "relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-lg",
                  tier.isPopular && "border-primary shadow-md ring-2 ring-primary/20"
                )}
              >
                {tier.isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    Most Popular
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
                  <Button
                    onClick={() => handleSelectPlan(tier.name)}
                    className="w-full"
                    variant={tier.isPopular ? "default" : "outline"}
                    size="lg"
                  >
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

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
            ))}
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Compare all features
          </h2>

          <div className="max-w-5xl mx-auto overflow-x-auto">
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
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Frequently Asked Questions
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="font-semibold text-foreground mb-2">Can I change my plan later?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, the change takes effect at the end of your current billing period.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border">
              <h3 className="font-semibold text-foreground mb-2">What happens when I hit my usage limits?</h3>
              <p className="text-muted-foreground text-sm">
                We'll notify you when you're approaching your limits. You can upgrade your plan at any time to get more capacity. Your existing patient data is always accessible even if you hit limits.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border">
              <h3 className="font-semibold text-foreground mb-2">Is my data secure?</h3>
              <p className="text-muted-foreground text-sm">
                Absolutely. We take data security seriously. All data is encrypted in transit and at rest. We're committed to HIPAA compliance and follow industry best practices for healthcare data protection.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border">
              <h3 className="font-semibold text-foreground mb-2">Do you offer discounts for annual billing?</h3>
              <p className="text-muted-foreground text-sm">
                Annual billing is coming soon! Contact us at support@pediascrybe.com if you're interested in annual pricing with discounts.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border">
              <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to transform your practice?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of pediatricians who are saving time and improving patient care with Pediascrybe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => handleSelectPlan('pro')}>
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
