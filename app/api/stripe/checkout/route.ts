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
    const { tierName, successUrl, cancelUrl } = body;

    // Look up customerId from the authenticated user (never trust client)
    const appUser = await fetchAuthQuery(api.appUsers.getCurrentAppUser);
    const customerId = appUser?.stripeCustomerId || null;

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

    // Get the price ID
    const priceId = tier.stripePriceId;
    
    if (!priceId || priceId.includes('placeholder')) {
      return NextResponse.json(
        { error: 'Pricing not configured. Please contact support.' },
        { status: 400 }
      );
    }

    // Check if customer already has an active subscription
    if (customerId) {
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
        },
      },
      metadata: {
        tierName: tier.name,
      },
      allow_promotion_codes: true,
    };

    // Add customer if provided
    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      // Allow customer creation during checkout
      sessionParams.customer_creation = 'always';
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
    const pricing = tiers.map((tier: { 
      name: string; 
      displayName: string; 
      description: string; 
      priceAmountCents: number;
      limits: { 
        patientCount: number; 
        recordCount: number; 
        scrybegptMessages: number;
        aiPrescription: number;
        aiLabExam: number;
        aiDiagnostic: number;
        aiReport: number;
      }; 
      features: string[]; 
      isPopular: boolean 
    }) => ({
      name: tier.name,
      displayName: tier.displayName,
      description: tier.description,
      priceAmountCents: tier.priceAmountCents,
      priceDisplay: `$${(tier.priceAmountCents / 100).toFixed(0)}/mo`,
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
