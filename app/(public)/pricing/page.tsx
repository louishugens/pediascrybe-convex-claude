'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X, Sparkles, Zap, Crown, ArrowRight, Building2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';

// Feature display configuration
const FEATURE_LABELS: Record<string, { label: string; description?: string }> = {
  emr: { label: 'Patient Management (EMR)', description: 'Full electronic medical records' },
  all_growth_charts: { label: 'WHO Growth Charts (All types)', description: 'Complete WHO growth standards' },
  vaccination_management: { label: 'Vaccination Management', description: 'Immunization schedules & tracking' },
  scrybegpt: { label: 'ScrybeGPT AI Chat', description: 'General pediatric AI assistant' },
  ai_diagnostic: { label: 'AI Diagnostic Suggestions', description: 'Smart differential diagnosis' },
  ai_prescription: { label: 'AI Prescription Recommendations', description: 'Weight-based dosing suggestions' },
  ai_lab_exam: { label: 'AI Lab Exam Proposals', description: 'Pediatric-specific lab recommendations' },
  ai_report: { label: 'AI Report Generation', description: 'Automated clinical documentation' },
  patient_specific_ai: { label: 'Patient-Specific AI Chat', description: 'AI with patient context' },
  whatsapp_scrybegpt: { label: 'WhatsApp AI Assistant', description: 'ScrybeGPT via WhatsApp' },
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
  staff_accounts: { label: 'Staff Accounts', description: 'Add staff members to your practice' },

};

// Features to highlight in the comparison table (aligned with pricing doc)
const COMPARISON_FEATURES = [
  // Quotas
  { key: 'patients', label: 'Patient Count' },
  { key: 'records', label: 'Monthly Records' },
  { key: 'ai_credits', label: 'AI Credits / Month' },
  { key: 'whatsapp', label: 'WhatsApp Messages' },
  { key: 'storage', label: 'File Storage' },
  { key: 'services', label: 'Service Catalog' },
  // Core Features
  { key: 'emr', label: 'Patient Management (EMR)' },
  { key: 'all_growth_charts', label: 'WHO Growth Charts (All 9 types)' },
  { key: 'vaccination_management', label: 'Vaccination Management' },
  { key: 'billing_receipts', label: 'Basic Billing & Receipts' },
  { key: 'multi_currency', label: 'Multi-Currency Support' },
  // AI
  { key: 'ai_diagnostic', label: 'AI Diagnostic / Prescription / Lab (2 credits each)' },
  { key: 'ai_report', label: 'AI Report Generation (5 credits each)' },
  // Portal / Telehealth
  { key: 'patient_portal', label: 'Patient Portal' },
  { key: 'telehealth', label: 'Telehealth Minutes' },
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
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  const tiers = useQuery(api.stripe.getSubscriptionTiers);

  // Check for subscription canceled message
  const subscriptionCanceled = searchParams.get('subscription') === 'canceled';

  const handleSelectPlan = (tierName: string) => {
    router.push(`/signup?plan=${tierName}&interval=${interval}`);
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case 'essentials':
        return <Zap className="w-6 h-6" />;
      case 'professional':
        return <Sparkles className="w-6 h-6" />;
      case 'complete':
        return <Crown className="w-6 h-6" />;
      case 'institution':
        return <Building2 className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  // Resolve displayed price based on selected billing interval
  const getDisplayPrice = (tier: NonNullable<typeof tiers>[number]) => {
    if ((tier as any).isCustom) return { label: 'Custom', sub: 'Contact sales' };
    if (interval === 'year') {
      const annual = (tier as any).annualPriceAmountCents ?? 0;
      const perMonth = annual ? Math.round(annual / 12 / 100) : 0;
      return {
        label: `$${perMonth}`,
        sub: `/month · billed annually ($${Math.round(annual / 100)}/yr)`,
      };
    }
    return {
      label: `$${Math.round(tier.priceAmountCents / 100)}`,
      sub: '/month',
    };
  };

  const getFeatureValue = (
    tier: NonNullable<typeof tiers>[number],
    featureKey: string
  ): string | boolean => {
    if (!tier) return false;

    switch (featureKey) {
      case 'patients':
        return `${tier.limits.patientCount.toLocaleString()}`;
      case 'records':
        return `${tier.limits.recordCount.toLocaleString()}/mo`;
      case 'ai_credits':
        return `${tier.limits.aiCredits}/mo`;
      case 'whatsapp': {
        if (tier.limits.whatsappTrial > 0) return `${tier.limits.whatsappTrial} trial/mo`;
        if (tier.limits.whatsappMessages > 0) return `${tier.limits.whatsappMessages}/mo`;
        return false;
      }
      case 'storage':
        return `${(tier.limits.fileStorageMB / 1024).toFixed(1)} GB`;
      case 'services':
        return `${tier.limits.services}`;
      case 'ai_diagnostic':
      case 'ai_report':
        return tier.features.includes(featureKey) || tier.limits.aiCredits > 0;
      case 'patient_portal':
        return tier.limits.patientPortal;
      case 'telehealth':
        return tier.limits.telehealth ? `${tier.limits.telehealthMinutes} min/mo` : false;
      case 'analytics':
        if (tier.features.includes('advanced_analytics')) return 'Advanced';
        if (tier.limits.dashboardTier === 'full') return 'Full';
        if (tier.limits.dashboardTier === 'standard') return 'Standard';
        return 'Basic';
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

  // Hide institution tier for now (isCustom)
  const activeTiers = tiers.filter(t => !t.isCustom);

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

          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-muted-foreground">
              Start with a 7-day free trial on any plan. No credit card required to get started.
            </p>
          </div>

          {/* Billing interval toggle */}
          <div className="flex items-center justify-center mb-10">
            <div className="inline-flex items-center rounded-full border bg-white p-1 shadow-sm">
              <button
                onClick={() => setInterval('month')}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-full transition-all',
                  interval === 'month'
                    ? 'bg-primary text-white shadow'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval('year')}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-full transition-all',
                  interval === 'year'
                    ? 'bg-primary text-white shadow'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Annual
                <span className={cn(
                  "ml-1.5 text-[10px] font-semibold uppercase tracking-wide",
                  interval === 'year' ? 'text-amber-300' : 'text-amber-600'
                )}>
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {activeTiers.map((tier) => (
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
                      tier.name === 'essentials' && "bg-blue-100 text-blue-600",
                      tier.name === 'professional' && "bg-primary/10 text-primary",
                      tier.name === 'complete' && "bg-amber-100 text-amber-600",
                      tier.name === 'institution' && "bg-purple-100 text-purple-600"
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
                        {getDisplayPrice(tier).label}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {getDisplayPrice(tier).sub}
                      </span>
                    </div>
                    {!(tier as any).isCustom && (
                      <p className="text-sm text-muted-foreground mt-1">
                        7-day free trial included
                      </p>
                    )}
                  </div>

                  {/* Limits Summary */}
                  <div className="space-y-2 mb-6 pb-6 border-b">
                    {(() => {
                      const isCustom = (tier as any).isCustom;
                      const fmt = (n: number) =>
                        isCustom ? 'Custom' : n.toLocaleString();
                      return (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Patients</span>
                            <span className="font-medium">{fmt(tier.limits.patientCount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Monthly Records</span>
                            <span className="font-medium">{fmt(tier.limits.recordCount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">AI Credits / month</span>
                            <span className="font-medium">{fmt(tier.limits.aiCredits)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">File Storage</span>
                            <span className="font-medium">
                              {isCustom ? 'Custom' : `${(tier.limits.fileStorageMB / 1024).toFixed(1)} GB`}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* CTA Button */}
                  {(tier as any).isCustom ? (
                    <Button className="w-full" variant="outline" size="lg" asChild>
                      <Link href="/contact">
                        Contact Sales
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSelectPlan(tier.name)}
                      className="w-full"
                      variant={tier.isPopular ? 'default' : 'outline'}
                      size="lg"
                    >
                      Start Free Trial
                      <ArrowRight className="w-4 h-4 ml-2" />
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
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            Need more AI credits? Top-up packs start at $5 from inside the app.
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
                  {activeTiers.map((tier) => (
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
                    {activeTiers.map((tier) => {
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
                Yes — annual billing saves ~17% across all paid tiers. Switch the toggle above any pricing card to see annual pricing.
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
            <Button size="lg" onClick={() => handleSelectPlan('professional')}>
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
