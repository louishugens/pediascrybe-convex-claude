import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { StripeSubscriptions } from "@convex-dev/stripe";
import { v } from "convex/values";
import Stripe from "stripe";

const stripeClient = new StripeSubscriptions(components.stripe, {});

// Initialize Stripe SDK for direct API calls
const getStripe = (): Stripe => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
};

// ==================== Internal Actions ====================

// Create Stripe customer (called from auth trigger)
export const createStripeCustomer = internalAction({
  args: {
    authUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const stripe = getStripe();
    
    // Create customer in Stripe
    const customer = await stripe.customers.create({
      email: args.email,
      name: args.name,
      metadata: {
        authUserId: args.authUserId,
      },
    });

    // Store the customer ID in appUsers
    await ctx.runMutation(internal.stripe.updateAppUserStripeCustomer, {
      authUserId: args.authUserId,
      stripeCustomerId: customer.id,
    });

    return { customerId: customer.id };
  },
});

// Update appUser with Stripe customer ID
export const updateAppUserStripeCustomer = internalMutation({
  args: {
    authUserId: v.string(),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();

    if (appUser) {
      await ctx.db.patch(appUser._id, {
        stripeCustomerId: args.stripeCustomerId,
      });
    }
  },
});

// Update appUser plan after subscription change
export const updateAppUserPlan = internalMutation({
  args: {
    authUserId: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();

    if (appUser) {
      await ctx.db.patch(appUser._id, {
        plan: args.plan,
      });
    }
  },
});

// ==================== Public Actions ====================

// Create a checkout session for a subscription with trial
// Resolves the monthly or annual price ID from the tier itself
export const createSubscriptionCheckout = action({
  args: {
    tierName: v.string(),
    billingInterval: v.union(v.literal("month"), v.literal("year")),
  },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args): Promise<{ sessionId: string; url: string | null }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const tier: { stripeMonthlyPriceId: string; stripeAnnualPriceId?: string; isCustom?: boolean } | null =
      await ctx.runQuery(api.stripe.getTierByName, { name: args.tierName });
    if (!tier) throw new Error(`Tier "${args.tierName}" not found`);
    if (tier.isCustom) throw new Error("Institution tier requires contacting sales");

    const priceId = args.billingInterval === "year" ? tier.stripeAnnualPriceId : tier.stripeMonthlyPriceId;
    if (!priceId) throw new Error(`Tier "${args.tierName}" missing ${args.billingInterval}ly price`);

    const siteUrl = process.env.SITE_URL || "http://localhost:3000";

    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: identity.subject,
      email: identity.email,
      name: identity.name,
    });

    return await stripeClient.createCheckoutSession(ctx, {
      priceId,
      customerId: customer.customerId,
      mode: "subscription",
      successUrl: `${siteUrl}/user?subscription=success`,
      cancelUrl: `${siteUrl}/pricing?subscription=canceled`,
      subscriptionMetadata: {
        userId: identity.subject,
        tierName: args.tierName,
        billingInterval: args.billingInterval,
      },
    });
  },
});

// Create a checkout session for a one-time payment
export const createPaymentCheckout = action({
  args: { priceId: v.string() },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const siteUrl = process.env.SITE_URL || "http://localhost:3000";

    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: identity.subject,
      email: identity.email,
      name: identity.name,
    });

    return await stripeClient.createCheckoutSession(ctx, {
      priceId: args.priceId,
      customerId: customer.customerId,
      mode: "payment",
      successUrl: `${siteUrl}/user?payment=success`,
      cancelUrl: `${siteUrl}/pricing?payment=canceled`,
      paymentIntentMetadata: { userId: identity.subject },
    });
  },
});

// Create a customer portal session
export const createPortalSession = action({
  args: {},
  returns: v.object({
    url: v.string(),
  }),
  handler: async (ctx): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const stripe = getStripe();
    const siteUrl = process.env.SITE_URL || "http://localhost:3000";

    // Get the customer from our database
    const appUser: { stripeCustomerId?: string } | null = await ctx.runQuery(internal.stripe.getAppUserByAuthIdInternal, {
      authUserId: identity.subject,
    });

    if (!appUser?.stripeCustomerId) {
      throw new Error("No Stripe customer found for this user");
    }

    // Create portal session
    const portalSession: Stripe.BillingPortal.Session = await stripe.billingPortal.sessions.create({
      customer: appUser.stripeCustomerId,
      return_url: `${siteUrl}/user/settings/subscription`,
    });

    return { url: portalSession.url };
  },
});

// Manually sync subscription from Stripe (for users who already subscribed)
export const syncMySubscription = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; subscriptionId?: string; status?: string; message?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const stripe = getStripe();
    
    // Get app user
    const appUser: { stripeCustomerId?: string; email: string; displayName?: string } | null = await ctx.runQuery(internal.stripe.getAppUserByAuthIdInternal, {
      authUserId: identity.subject,
    });

    if (!appUser) {
      throw new Error("User not found");
    }

    let customerId: string | undefined = appUser.stripeCustomerId;

    // If no customer ID, try to find by email
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: identity.email || appUser.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Update the app user with the customer ID
        await ctx.runMutation(internal.stripe.updateAppUserStripeCustomer, {
          authUserId: identity.subject,
          stripeCustomerId: customerId,
        });
      } else {
        // Create a new customer
        const customer = await stripe.customers.create({
          email: identity.email || appUser.email,
          name: appUser.displayName || undefined,
          metadata: { authUserId: identity.subject },
        });
        customerId = customer.id;
        await ctx.runMutation(internal.stripe.updateAppUserStripeCustomer, {
          authUserId: identity.subject,
          stripeCustomerId: customerId,
        });
      }
    }

    // Get subscriptions for this customer
    const subscriptions: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return { success: false, message: "No subscription found in Stripe" };
    }

    const subscription: Stripe.Subscription = subscriptions.data[0];
    const sub = subscription as any;
    
    // Get the current price ID from the subscription
    const currentPriceId = subscription.items.data[0]?.price?.id;
    
    // ALWAYS look up tier from the current price ID (this handles upgrades/downgrades correctly)
    let tierName: string | null = null;
    if (currentPriceId) {
      const tier = await ctx.runQuery(internal.stripe.getTierByPriceId, { stripePriceId: currentPriceId });
      tierName = tier?.name || null;
    }
    
    // Only fall back to metadata if price lookup fails (shouldn't happen normally)
    if (!tierName) {
      tierName = subscription.metadata?.tierName || null;
    }

    // Subscription sync in progress

    // Sync to our database
    await ctx.runMutation(internal.stripeWebhooks.syncSubscription, {
      stripeId: subscription.id,
      stripeCustomerId: customerId,
      customerEmail: identity.email || appUser.email, // Pass email for fallback
      stripePriceId: currentPriceId || "",
      status: subscription.status,
      quantity: subscription.items.data[0]?.quantity || 1,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      tierName: tierName,
      created: subscription.created,
      currentPeriodStart: sub.current_period_start ?? Math.floor(Date.now() / 1000),
      currentPeriodEnd: sub.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      trialStart: sub.trial_start ?? undefined,
      trialEnd: sub.trial_end ?? undefined,
      cancelAt: sub.cancel_at ?? undefined,
      canceledAt: sub.canceled_at ?? undefined,
      endedAt: sub.ended_at ?? undefined,
    });

    return { success: true, subscriptionId: subscription.id, status: subscription.status, message: `Synced as ${tierName}` };
  },
});

// Manually sync subscription by email (for CLI use)
export const syncSubscriptionByEmail = action({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; subscriptionId?: string; status?: string; message?: string }> => {
    const stripe = getStripe();
    
    // Find customer by email in Stripe
    const customers = await stripe.customers.list({
      email: args.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return { success: false, message: "No Stripe customer found with this email" };
    }

    const customerId = customers.data[0].id;

    // Find app user by email
    const appUser = await ctx.runQuery(internal.stripe.getAppUserByEmail, { email: args.email });
    
    if (!appUser) {
      return { success: false, message: "No app user found with this email" };
    }

    // Update app user with Stripe customer ID if not set
    if (!appUser.stripeCustomerId) {
      await ctx.runMutation(internal.stripe.updateAppUserStripeCustomer, {
        authUserId: appUser.authUserId,
        stripeCustomerId: customerId,
      });
    }

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return { success: false, message: "No subscription found in Stripe for this customer" };
    }

    const subscription = subscriptions.data[0];
    const sub = subscription as any;
    
    // Get the current price ID from the subscription
    const currentPriceId = subscription.items.data[0]?.price?.id;
    
    // Look up tier from the current price ID
    let tierName: string | null = null;
    if (currentPriceId) {
      const tier = await ctx.runQuery(internal.stripe.getTierByPriceId, { stripePriceId: currentPriceId });
      tierName = tier?.name || null;
    }
    
    if (!tierName) {
      tierName = subscription.metadata?.tierName || null;
    }

    // Subscription sync in progress

    // Sync to our database
    await ctx.runMutation(internal.stripeWebhooks.syncSubscription, {
      stripeId: subscription.id,
      stripeCustomerId: customerId,
      customerEmail: args.email, // Pass email for fallback
      stripePriceId: currentPriceId || "",
      status: subscription.status,
      quantity: subscription.items.data[0]?.quantity || 1,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      tierName: tierName,
      created: subscription.created,
      currentPeriodStart: sub.current_period_start ?? Math.floor(Date.now() / 1000),
      currentPeriodEnd: sub.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      trialStart: sub.trial_start ?? undefined,
      trialEnd: sub.trial_end ?? undefined,
      cancelAt: sub.cancel_at ?? undefined,
      canceledAt: sub.canceled_at ?? undefined,
      endedAt: sub.ended_at ?? undefined,
    });

    return { success: true, subscriptionId: subscription.id, status: subscription.status, message: `Synced as ${tierName}` };
  },
});

// Get app user by email (internal)
export const getAppUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// ==================== Queries ====================

// Get app user by auth ID (internal - for use in actions)
export const getAppUserByAuthIdInternal = internalQuery({
  args: { authUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();
  },
});

// Get subscription tier by Stripe price ID — checks both monthly and annual price IDs
export const getTierByPriceId = internalQuery({
  args: { stripePriceId: v.string() },
  handler: async (ctx, args) => {
    const monthly = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_stripeMonthlyPriceId", (q) => q.eq("stripeMonthlyPriceId", args.stripePriceId))
      .first();
    if (monthly) return monthly;
    return await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_stripeAnnualPriceId", (q) => q.eq("stripeAnnualPriceId", args.stripePriceId))
      .first();
  },
});

// Get app user by auth ID (public query)
export const getAppUserByAuthId = query({
  args: { authUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();
  },
});

// Get current user's Stripe customer ID
export const getStripeCustomerId = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    return appUser?.stripeCustomerId ?? null;
  },
});

// Debug: Get all subscription data (pass email to find user)
export const debugSubscriptionData = query({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Try to get from auth first, then fall back to email lookup
    const identity = await ctx.auth.getUserIdentity();
    let authUserId = identity?.subject;
    
    if (!authUserId && args.email) {
      const appUserByEmail = await ctx.db
        .query("appUsers")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();
      authUserId = appUserByEmail?.authUserId;
    }

    if (!authUserId) {
      // Return all tiers anyway for debugging
      const allTiers = await ctx.db.query("subscriptionTiers").collect();
      return {
        error: "Pass your email to debug",
        allTierPriceIds: allTiers.map(t => ({
          name: t.name,
          stripeMonthlyPriceId: t.stripeMonthlyPriceId,
          stripeAnnualPriceId: t.stripeAnnualPriceId,
        })),
      };
    }

    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
      .first();

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
      .first();

    const subscription = doctor ? await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first() : null;

    // Get all subscription tiers to check price ID mapping
    const allTiers = await ctx.db.query("subscriptionTiers").collect();
    
    // Find matching tier by stripePriceId (checks both monthly and annual)
    const subPriceId = subscription?.stripePriceId;
    const matchingTier = subPriceId
      ? allTiers.find(t => t.stripeMonthlyPriceId === subPriceId || t.stripeAnnualPriceId === subPriceId)
      : null;

    return {
      appUser: appUser ? {
        plan: appUser.plan,
        stripeCustomerId: appUser.stripeCustomerId
      } : null,
      subscription: subscription ? {
        stripeId: subscription.stripeId,
        stripePriceId: subscription.stripePriceId,
        tierName: subscription.tierName,
        status: subscription.status,
        metadata: subscription.metadata,
      } : null,
      matchingTier: matchingTier ? {
        name: matchingTier.name,
        stripeMonthlyPriceId: matchingTier.stripeMonthlyPriceId,
        stripeAnnualPriceId: matchingTier.stripeAnnualPriceId,
      } : null,
      allTierPriceIds: allTiers.map(t => ({
        name: t.name,
        stripeMonthlyPriceId: t.stripeMonthlyPriceId,
        stripeAnnualPriceId: t.stripeAnnualPriceId,
      })),
    };
  },
});

// Get current user's subscription
export const getCurrentSubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get the doctor record
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) return null;

    // Get the subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    if (!subscription) return null;

    // Get tier info directly from subscription
    const tierName = subscription.tierName || subscription.metadata?.tierName;
    const tier = tierName ? await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_name", (q) => q.eq("name", tierName))
      .first() : null;

    return {
      ...subscription,
      tier,
    };
  },
});

// Get subscription by doctor ID
export const getSubscriptionByDoctorId = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .first();

    if (!subscription) return null;

    // Get tier info directly from subscription
    const tierName = subscription.tierName || subscription.metadata?.tierName;
    const tier = tierName ? await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_name", (q) => q.eq("name", tierName))
      .first() : null;

    return {
      ...subscription,
      tier,
    };
  },
});

// ==================== Seed Actions ====================

// Seed Stripe products and prices (run once) — creates monthly + annual prices per tier.
// Call after `seed.seedSubscriptionTiers` has seeded the tier rows; this action then
// calls `seed.updateTierStripePriceIds` to write the real Stripe price IDs back.
export const seedStripeProducts = internalAction({
  args: {},
  handler: async (ctx): Promise<Array<{
    name: string;
    productId: string;
    stripeMonthlyPriceId: string;
    stripeAnnualPriceId: string;
  }>> => {
    const stripe = getStripe();

    const products = [
      {
        name: "essentials",
        displayName: "Essentials",
        description: "For pediatricians starting their digital practice",
        monthlyCents: 2900,
        annualCents: 28800,
      },
      {
        name: "professional",
        displayName: "Professional",
        description: "For established solo practitioners",
        monthlyCents: 5900,
        annualCents: 58800,
      },
      {
        name: "complete",
        displayName: "Complete",
        description: "For high-volume practices and clinics",
        monthlyCents: 11900,
        annualCents: 118800,
      },
      // Institution has no checkout — skip
    ];

    const results: Array<{
      name: string;
      productId: string;
      stripeMonthlyPriceId: string;
      stripeAnnualPriceId: string;
    }> = [];

    for (const p of products) {
      const product = await stripe.products.create({
        name: p.displayName,
        description: p.description,
        metadata: { tier: p.name },
      });

      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: p.monthlyCents,
        currency: "usd",
        recurring: { interval: "month", trial_period_days: 7 },
        metadata: { tier: p.name, interval: "month" },
      });

      const annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: p.annualCents,
        currency: "usd",
        recurring: { interval: "year", trial_period_days: 7 },
        metadata: { tier: p.name, interval: "year" },
      });

      await ctx.runMutation(internal.seed.updateTierStripePriceIdsInternal, {
        tierName: p.name,
        stripeMonthlyPriceId: monthlyPrice.id,
        stripeAnnualPriceId: annualPrice.id,
      });

      results.push({
        name: p.name,
        productId: product.id,
        stripeMonthlyPriceId: monthlyPrice.id,
        stripeAnnualPriceId: annualPrice.id,
      });
    }

    return results;
  },
});

// Get all subscription tiers
export const getSubscriptionTiers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_sortOrder")
      .collect();
  },
});

// Get tier by name
export const getTierByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

// ==================== Workflow Helper Functions ====================
// These mutations are called by the Vercel Workflow for durable subscription sync

// Link Stripe customer to appUser by ID or email (for workflow step)
export const linkStripeCustomerByIdOrEmail = mutation({
  args: {
    stripeCustomerId: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ found: boolean; appUserId?: string }> => {
    // Try by customer ID first
    let appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (appUser) {
      console.log(`Found appUser ${appUser._id} by stripeCustomerId`);
      return { found: true, appUserId: appUser._id };
    }

    // Try by email
    if (args.email) {
      const email = args.email; // Capture to avoid type narrowing issues
      appUser = await ctx.db
        .query("appUsers")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();

      if (appUser) {
        // Link the customer ID for future lookups
        await ctx.db.patch(appUser._id, { 
          stripeCustomerId: args.stripeCustomerId 
        });
        console.log(`Linked Stripe customer ${args.stripeCustomerId} to appUser ${appUser._id} via email ${args.email}`);
        return { found: true, appUserId: appUser._id };
      }
    }

    console.log(`No appUser found for stripeCustomerId ${args.stripeCustomerId} or email ${args.email}`);
    return { found: false };
  },
});

// Get tier by Stripe price ID (public query for workflow) — checks both monthly and annual
export const getTierByPriceIdPublic = query({
  args: { stripePriceId: v.string() },
  handler: async (ctx, args) => {
    const monthly = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_stripeMonthlyPriceId", (q) => q.eq("stripeMonthlyPriceId", args.stripePriceId))
      .first();
    if (monthly) return monthly;
    return await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_stripeAnnualPriceId", (q) => q.eq("stripeAnnualPriceId", args.stripePriceId))
      .first();
  },
});

// Sync subscription from workflow (creates or updates subscription record)
export const syncSubscriptionFromWorkflow = mutation({
  args: {
    stripeId: v.string(),
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),
    status: v.string(),
    tierName: v.optional(v.string()),
    quantity: v.number(),
    cancelAtPeriodEnd: v.boolean(),
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
    // Find appUser by stripeCustomerId
    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!appUser) {
      throw new Error(`No appUser found for customer: ${args.stripeCustomerId}`);
    }

    // Find doctor
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", appUser.authUserId))
      .first();

    if (!doctor) {
      throw new Error(`No doctor found for authUser: ${appUser.authUserId}`);
    }

    // Check if subscription exists
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    const subscriptionData = {
      stripeId: args.stripeId,
      doctorId: doctor._id,
      stripePriceId: args.stripePriceId,
      tierName: args.tierName,
      status: args.status as "trialing" | "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "unpaid" | "paused",
      quantity: args.quantity,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      metadata: args.tierName ? { tierName: args.tierName } : undefined,
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
      console.log(`Updated subscription: ${existing._id} (${args.stripeId}) -> tier: ${args.tierName}`);
    } else {
      const newId = await ctx.db.insert("subscriptions", subscriptionData);
      console.log(`Created subscription: ${newId} (${args.stripeId}) -> tier: ${args.tierName}`);
    }
  },
});

// Update appUser plan by customer ID
export const updatePlanByCustomerId = mutation({
  args: {
    stripeCustomerId: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args) => {
    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (appUser) {
      await ctx.db.patch(appUser._id, { plan: args.plan });
      console.log(`Updated appUser ${appUser._id} plan to: ${args.plan}`);
    } else {
      console.log(`No appUser found for stripeCustomerId ${args.stripeCustomerId} when updating plan`);
    }
  },
});

// Mark subscription as canceled
export const markSubscriptionCanceled = mutation({
  args: {
    stripeId: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        status: "canceled",
        canceledAt: Math.floor(Date.now() / 1000),
      });
      console.log(`Marked subscription ${subscription._id} (${args.stripeId}) as canceled`);
    } else {
      console.log(`No subscription found for stripeId ${args.stripeId} when marking canceled`);
    }
  },
});
