import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { isAuthenticated, fetchAuthQuery } from '@/lib/auth-server';
import { api } from '@/convex/_generated/api';

// Lazy initialization to avoid errors when env vars are not set
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripe = getStripe();

    const body = await request.json();
    const { returnUrl } = body;

    // Look up the customer ID from the authenticated user's own record (never trust client)
    const appUser = await fetchAuthQuery(api.appUsers.getCurrentAppUser);
    if (!appUser?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe first.' },
        { status: 400 }
      );
    }

    // Create a billing portal session using the verified customer ID
    const session = await stripe.billingPortal.sessions.create({
      customer: appUser.stripeCustomerId,
      return_url: returnUrl || `${process.env.SITE_URL}/user/settings/subscription`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
