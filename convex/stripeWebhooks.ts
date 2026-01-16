import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import Stripe from "stripe";

// Initialize Stripe SDK
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

// Helper to extract tier name from metadata (no Stripe API calls)
function getTierFromSubscriptionMetadata(subscription: Stripe.Subscription): string | null {
  // Try to get tier from subscription metadata
  if (subscription.metadata?.tierName) {
    return subscription.metadata.tierName;
  }
  return null;
}

// Helper to fetch customer email from Stripe
async function getCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted) {
      return customer.email || null;
    }
  } catch (e) {
    console.error("Failed to fetch customer email:", e);
  }
  return null;
}

// Handle subscription created event
export const handleSubscriptionCreated = internalAction({
  args: {
    subscription: v.any(),
    customerEmail: v.optional(v.string()), // Can be passed from checkout.session.completed
  },
  handler: async (ctx, args) => {
    const subscription = args.subscription as Stripe.Subscription;
    console.log("[Webhook] Subscription created:", subscription.id);
    
    // Get tier from metadata (no external API call)
    const tierFromMetadata = getTierFromSubscriptionMetadata(subscription);
    
    // Get customer email - use passed email or fetch from Stripe
    let customerEmail = args.customerEmail || null;
    if (!customerEmail) {
      customerEmail = await getCustomerEmail(subscription.customer as string);
    }
    console.log("[Webhook] Customer email:", customerEmail);
    
    // Sync to our subscriptions table
    // Use type assertion to access properties (Stripe types vary by version)
    const sub = subscription as any;
    await ctx.runMutation(internal.stripeWebhooks.syncSubscription, {
      stripeId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      customerEmail: customerEmail, // NEW: Pass email for fallback lookup
      stripePriceId: subscription.items.data[0]?.price?.id || "",
      status: subscription.status,
      quantity: subscription.items.data[0]?.quantity || 1,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? sub.cancelAtPeriodEnd ?? false,
      tierName: tierFromMetadata, // Will be looked up in mutation if null
      created: subscription.created,
      currentPeriodStart: sub.current_period_start ?? sub.currentPeriodStart ?? Math.floor(Date.now() / 1000),
      currentPeriodEnd: sub.current_period_end ?? sub.currentPeriodEnd ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      trialStart: sub.trial_start ?? sub.trialStart ?? undefined,
      trialEnd: sub.trial_end ?? sub.trialEnd ?? undefined,
      cancelAt: sub.cancel_at ?? sub.cancelAt ?? undefined,
      canceledAt: sub.canceled_at ?? sub.canceledAt ?? undefined,
      endedAt: sub.ended_at ?? sub.endedAt ?? undefined,
    });
  },
});

// Handle subscription updated event
export const handleSubscriptionUpdated = internalAction({
  args: {
    subscription: v.any(),
  },
  handler: async (ctx, args) => {
    const subscription = args.subscription as Stripe.Subscription;
    console.log("[Webhook] Subscription updated:", subscription.id);
    
    // Get tier from metadata (no external API call)
    const tierFromMetadata = getTierFromSubscriptionMetadata(subscription);
    
    // Get customer email for fallback lookup
    const customerEmail = await getCustomerEmail(subscription.customer as string);
    
    // Sync to our subscriptions table
    // Use type assertion to access properties (Stripe types vary by version)
    const sub = subscription as any;
    await ctx.runMutation(internal.stripeWebhooks.syncSubscription, {
      stripeId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      customerEmail: customerEmail, // NEW: Pass email for fallback lookup
      stripePriceId: subscription.items.data[0]?.price?.id || "",
      status: subscription.status,
      quantity: subscription.items.data[0]?.quantity || 1,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? sub.cancelAtPeriodEnd ?? false,
      tierName: tierFromMetadata, // Will be looked up in mutation if null
      created: subscription.created,
      currentPeriodStart: sub.current_period_start ?? sub.currentPeriodStart ?? Math.floor(Date.now() / 1000),
      currentPeriodEnd: sub.current_period_end ?? sub.currentPeriodEnd ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      trialStart: sub.trial_start ?? sub.trialStart ?? undefined,
      trialEnd: sub.trial_end ?? sub.trialEnd ?? undefined,
      cancelAt: sub.cancel_at ?? sub.cancelAt ?? undefined,
      canceledAt: sub.canceled_at ?? sub.canceledAt ?? undefined,
      endedAt: sub.ended_at ?? sub.endedAt ?? undefined,
    });
  },
});

// Handle subscription deleted event
export const handleSubscriptionDeleted = internalAction({
  args: {
    subscription: v.any(),
  },
  handler: async (ctx, args) => {
    const subscription = args.subscription as Stripe.Subscription;
    console.log("Subscription deleted:", subscription.id);
    
    // Mark subscription as canceled
    await ctx.runMutation(internal.stripeWebhooks.deleteSubscription, {
      stripeId: subscription.id,
    });
  },
});

// Internal mutation to sync subscription data
import { internalMutation } from "./_generated/server";

export const syncSubscription = internalMutation({
  args: {
    stripeId: v.string(),
    stripeCustomerId: v.string(),
    customerEmail: v.union(v.string(), v.null()), // NEW: For fallback lookup
    stripePriceId: v.string(),
    status: v.string(),
    quantity: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    tierName: v.union(v.string(), v.null()),
    created: v.number(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
    cancelAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find the app user by Stripe customer ID
    let appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    // FALLBACK: If not found by stripeCustomerId, try by email
    if (!appUser && args.customerEmail) {
      console.log("[syncSubscription] Customer not found by ID, trying email:", args.customerEmail);
      appUser = await ctx.db
        .query("appUsers")
        .withIndex("by_email", (q) => q.eq("email", args.customerEmail!))
        .first();
      
      // Link the stripeCustomerId for future lookups
      if (appUser) {
        await ctx.db.patch(appUser._id, { stripeCustomerId: args.stripeCustomerId });
        console.log("[syncSubscription] Linked stripeCustomerId", args.stripeCustomerId, "to appUser", appUser._id);
      }
    }

    if (!appUser) {
      console.error("[syncSubscription] No app user found for Stripe customer:", args.stripeCustomerId, "or email:", args.customerEmail);
      return;
    }

    // Find the doctor
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", appUser.authUserId))
      .first();

    if (!doctor) {
      console.error("[syncSubscription] No doctor found for auth user:", appUser.authUserId);
      return;
    }

    // Try to find price record (optional - subscription can work without it)
    let price = await ctx.db
      .query("prices")
      .withIndex("by_stripeId", (q) => q.eq("stripeId", args.stripePriceId))
      .first();

    // If no price, try to create one from subscription tier
    if (!price && args.stripePriceId) {
      const tier = await ctx.db
        .query("subscriptionTiers")
        .withIndex("by_stripePriceId", (q) => q.eq("stripePriceId", args.stripePriceId))
        .first();

      if (tier) {
        // Find or create product
        let product = await ctx.db
          .query("products")
          .filter((q) => q.eq(q.field("name"), tier.displayName))
          .first();

        if (!product) {
          const productId = await ctx.db.insert("products", {
            stripeId: `prod_${tier.name}`,
            name: tier.displayName,
            description: tier.description,
            active: true,
            metadata: { tier: tier.name },
          });
          product = await ctx.db.get(productId);
        }

        if (product) {
          const priceId = await ctx.db.insert("prices", {
            stripeId: args.stripePriceId,
            productId: product._id,
            active: true,
            currency: "usd",
            unitAmount: tier.priceAmountCents,
            interval: "month",
            intervalCount: 1,
          });
          price = await ctx.db.get(priceId);
        }
      }
    }

    // ALWAYS look up tier from price ID first (handles upgrades/downgrades correctly)
    let resolvedTierName: string | null = null;
    if (args.stripePriceId) {
      const tier = await ctx.db
        .query("subscriptionTiers")
        .withIndex("by_stripePriceId", (q) => q.eq("stripePriceId", args.stripePriceId))
        .first();
      resolvedTierName = tier?.name || null;
    }
    
    // Only fall back to passed tierName if price lookup fails
    if (!resolvedTierName) {
      resolvedTierName = args.tierName;
    }

    console.log("Syncing subscription:", args.stripeId, "priceId:", args.stripePriceId, "resolvedTier:", resolvedTierName);

    // Check if subscription exists
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    const subscriptionData = {
      stripeId: args.stripeId,
      doctorId: doctor._id,
      priceId: price?._id, // Optional - may be undefined
      stripePriceId: args.stripePriceId,
      tierName: resolvedTierName || undefined,
      status: args.status as "trialing" | "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "unpaid" | "paused",
      quantity: args.quantity,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      metadata: resolvedTierName ? { tierName: resolvedTierName } : undefined,
      created: args.created,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      trialStart: args.trialStart,
      trialEnd: args.trialEnd,
      cancelAt: args.cancelAt,
      canceledAt: args.canceledAt,
      endedAt: args.endedAt,
    };

    if (existing) {
      await ctx.db.patch(existing._id, subscriptionData);
      console.log("Updated subscription:", existing._id);
    } else {
      const newId = await ctx.db.insert("subscriptions", subscriptionData);
      console.log("Created subscription:", newId);
    }

    // Update app user's plan
    const planName = resolvedTierName || "starter";
    await ctx.db.patch(appUser._id, { plan: planName });
  },
});

// Internal mutation to delete/cancel subscription
export const deleteSubscription = internalMutation({
  args: {
    stripeId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    if (subscription) {
      // Mark as canceled instead of deleting
      await ctx.db.patch(subscription._id, {
        status: "canceled",
        canceledAt: Math.floor(Date.now() / 1000),
      });

      // Update app user's plan to none
      const doctor = await ctx.db.get(subscription.doctorId);
      if (doctor) {
        const appUser = await ctx.db
          .query("appUsers")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", doctor.authUserId))
          .first();
        if (appUser) {
          await ctx.db.patch(appUser._id, { plan: "none" });
        }
      }
    }
  },
});
