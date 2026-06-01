'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Sparkles, 
  Zap, 
  ArrowRight, 
  Lock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

type UpgradeReason = 
  | 'feature_locked'
  | 'patient_limit'
  | 'ai_query_limit'
  | 'document_limit';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: UpgradeReason;
  featureName?: string;
  currentCount?: number;
  limit?: number;
}

const REASON_CONFIG: Record<UpgradeReason, {
  icon: React.ReactNode;
  title: string;
  description: (featureName?: string, currentCount?: number, limit?: number) => string;
  recommendedTier: string;
}> = {
  feature_locked: {
    icon: <Lock className="w-6 h-6" />,
    title: 'Feature Locked',
    description: (featureName) => `${featureName || 'This feature'} is not available on your current plan. Upgrade to unlock it.`,
    recommendedTier: 'professional',
  },
  patient_limit: {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: 'Patient Limit Reached',
    description: (_, currentCount, limit) => `You've reached your limit of ${limit} active patients. Upgrade to add more patients to your practice.`,
    recommendedTier: 'professional',
  },
  ai_query_limit: {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'AI Query Limit Reached',
    description: (_, currentCount, limit) => `You've used all ${limit} AI queries for this month. Upgrade for more queries or wait until next month.`,
    recommendedTier: 'professional',
  },
  document_limit: {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Document Limit Reached',
    description: (_, currentCount, limit) => `You've reached your monthly document generation limit of ${limit}. Upgrade for more capacity.`,
    recommendedTier: 'professional',
  },
};

export function UpgradeModal({
  open,
  onOpenChange,
  reason,
  featureName,
  currentCount,
  limit,
}: UpgradeModalProps) {
  const tiers = useQuery(api.stripe.getSubscriptionTiers);
  const currentSubscription = useQuery(api.subscriptions.getCurrentSubscriptionDetails);

  const config = REASON_CONFIG[reason];
  const currentTierName = currentSubscription?.tier || 'free';

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
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'professional':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'complete':
        return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'institution':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  // Filter tiers that are higher than current (exclude institution — contact sales only)
  const availableUpgrades = tiers?.filter((tier) => {
    if (tier.name === 'institution') return false;
    const tierOrder = ['free', 'essentials', 'professional', 'complete'];
    return tierOrder.indexOf(tier.name) > tierOrder.indexOf(currentTierName);
  }) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mb-2",
            reason === 'feature_locked' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
          )}>
            {config.icon}
          </div>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {config.description(featureName, currentCount, limit)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Upgrade Options */}
          {availableUpgrades.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Upgrade options:</p>
              {availableUpgrades.map((tier) => (
                <div
                  key={tier._id}
                  className={cn(
                    "p-4 rounded-xl border transition-colors",
                    tier.isPopular 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        getTierColor(tier.name)
                      )}>
                        {getTierIcon(tier.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{tier.displayName}</h4>
                          {tier.isPopular && (
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{tier.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>
                            {tier.limits.patientCount.toLocaleString()} patients
                          </span>
                          <span>•</span>
                          <span>
                            {(tier.limits as any).aiCredits} AI credits/mo
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        ${(tier.priceAmountCents / 100).toFixed(0)}/mo
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You're already on the highest plan available.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Maybe Later
            </Button>
            <Button asChild className="flex-1">
              <Link href="/user/pricing">
                View All Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to use the upgrade modal
export function useUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState<Omit<UpgradeModalProps, 'open' | 'onOpenChange'>>({
    reason: 'feature_locked',
  });

  const showUpgradeModal = (props: Omit<UpgradeModalProps, 'open' | 'onOpenChange'>) => {
    setModalProps(props);
    setIsOpen(true);
  };

  const UpgradeModalComponent = () => (
    <UpgradeModal
      open={isOpen}
      onOpenChange={setIsOpen}
      {...modalProps}
    />
  );

  return {
    showUpgradeModal,
    UpgradeModal: UpgradeModalComponent,
  };
}

// Standalone component for feature-locked features
interface FeatureLockedProps {
  featureName: string;
  requiredTier: string;
  children?: React.ReactNode;
}

export function FeatureLocked({ featureName, requiredTier, children }: FeatureLockedProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div 
        className="relative cursor-pointer group"
        onClick={() => setShowModal(true)}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="text-center p-4">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">{featureName}</p>
            <p className="text-xs text-muted-foreground">
              Upgrade to {requiredTier} to unlock
            </p>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
      </div>

      <UpgradeModal
        open={showModal}
        onOpenChange={setShowModal}
        reason="feature_locked"
        featureName={featureName}
      />
    </>
  );
}
