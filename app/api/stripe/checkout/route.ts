import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ConvexHttpClient } from 'convex/browser';
import { checkBotId } from 'botid/server';
import { api } from '@/convex/_generated/api';
import { isAuthenticated, fetchAuthQuery } from '@/lib/auth-server';

// Lazy initialization to avoid errors when env vars are not set
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getConvex() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
  }
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
}

export async function POST(request: NextRequest) {
  try {
    // Bot protection check
    const verification = await checkBotId();
    if (verification.isBot) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const stripe = getStripe();
    const convex = getConvex();

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tierName, billingInterval, successUrl, cancelUrl } = body as {
      tierName: string;
      billingInterval?: "month" | "year";
      successUrl?: string;
      cancelUrl?: string;
    };
    const interval: "month" | "year" = billingInterval === "year" ? "year" : "month";

    // Look up customerId from the authenticated user (never trust client)
    const appUser = await fetchAuthQuery(api.appUsers.getCurrentAppUser);
    let customerId = appUser?.stripeCustomerId || null;

    if (!tierName) {
      return NextResponse.json(
        { error: 'Tier name is required' },
        { status: 400 }
      );
    }

    // Get tier from Convex
    const tier = await convex.query(api.stripe.getTierByName, { name: tierName });

    if (!tier) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    if (tier.isCustom) {
      return NextResponse.json(
        { error: 'Institution tier requires contacting sales' },
        { status: 400 }
      );
    }

    // Pick the price for the requested interval
    const priceId = interval === "year" ? tier.stripeAnnualPriceId : tier.stripeMonthlyPriceId;

    if (!priceId || priceId.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Pricing not configured. Please contact support.' },
        { status: 400 }
      );
    }

    // Check if customer already has an active subscription. If the stored
    // customer no longer exists in this Stripe account (e.g. migrated/old data),
    // drop it and fall through to create a fresh one instead of 500ing.
    if (customerId) {
      try {
        const existingSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });

        const trialingSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'trialing',
          limit: 1,
        });

        const hasActiveSubscription = existingSubscriptions.data.length > 0 || trialingSubscriptions.data.length > 0;

        if (hasActiveSubscription) {
          // For existing subscribers, redirect to Customer Portal for upgrades/downgrades
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: successUrl || `${process.env.SITE_URL}/user/settings/subscription`,
          });

          return NextResponse.json({
            url: portalSession.url,
            isPortalRedirect: true,
            message: 'Redirecting to billing portal to manage your subscription',
          });
        }
      } catch (err) {
        if ((err as Stripe.errors.StripeError)?.code === 'resource_missing') {
          console.warn('Stored stripeCustomerId no longer exists in Stripe; creating a new customer:', customerId);
          customerId = null;
        } else {
          throw err;
        }
      }
    }

    // Build checkout session params (only for new subscribers)
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.SITE_URL}/user?subscription=success`,
      cancel_url: cancelUrl || `${process.env.SITE_URL}/pricing?subscription=canceled`,
      subscription_data: {
        trial_period_days: tier.trialPeriodDays,
        metadata: {
          tierName: tier.name,
          billingInterval: interval,
        },
      },
      metadata: {
        tierName: tier.name,
        billingInterval: interval,
      },
      allow_promotion_codes: true,
    };

    // Reuse the existing customer if we have a valid one. In `subscription` mode
    // Stripe creates the customer automatically, so we must NOT set
    // `customer_creation` (that's only valid in `payment` mode and 500s otherwise).
    if (customerId) {
      sessionParams.customer = customerId;
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Get pricing info
export async function GET() {
  try {
    const convex = getConvex();
    
    // Get all tiers from Convex
    const tiers = await convex.query(api.stripe.getSubscriptionTiers);

    // Map to pricing info
    const pricing = tiers.map((tier) => ({
      name: tier.name,
      displayName: tier.displayName,
      description: tier.description,
      priceAmountCents: tier.priceAmountCents,
      annualPriceAmountCents: tier.annualPriceAmountCents,
      priceDisplay: tier.isCustom
        ? "Contact Sales"
        : `$${(tier.priceAmountCents / 100).toFixed(0)}/mo`,
      annualPriceDisplay:
        tier.annualPriceAmountCents && !tier.isCustom
          ? `$${(tier.annualPriceAmountCents / 100).toFixed(0)}/yr`
          : null,
      isCustom: tier.isCustom ?? false,
      limits: tier.limits,
      features: tier.features,
      isPopular: tier.isPopular,
    }));

    return NextResponse.json({ tiers: pricing });
  } catch (error) {
    console.error('Pricing fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}
