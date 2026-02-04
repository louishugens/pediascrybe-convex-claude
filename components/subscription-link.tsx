'use client'

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UpgradeModal } from '@/components/upgrade-modal';

interface SubscriptionLinkProps {
  /** Feature key to check access for */
  feature: string;
  /** Feature name for the upgrade modal */
  featureDisplayName?: string;
  /** Navigation target when user has access */
  href: string;
  /** Link content */
  children: ReactNode;
  /** className applied to both link and fallback button */
  className?: string;
}

/**
 * A link that checks subscription access before navigating.
 * If the user doesn't have access, it opens the upgrade modal instead.
 */
export function SubscriptionLink({
  feature,
  featureDisplayName,
  href,
  children,
  className,
}: SubscriptionLinkProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const hasAccess = useQuery(api.subscriptions.hasFeatureAccess, { feature });

  // While loading or if user has access, render a normal link
  if (hasAccess !== false) {
    return (
      <Link href={href as any} className={className}>
        {children}
      </Link>
    );
  }

  // User doesn't have access — show upgrade modal on click
  return (
    <>
      <button type="button" onClick={() => setShowUpgrade(true)} className={className}>
        {children}
      </button>
      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        reason="feature_locked"
        featureName={featureDisplayName || feature.replace(/_/g, ' ')}
      />
    </>
  );
}
