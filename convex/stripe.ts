import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { components, internal } from "./_generated/api";
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
export const createSubscriptionCheckout = action({
  args: { 
    priceId: v.string(),
    tierName: v.optional(v.string()),
  },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const siteUrl = process.env.SITE_URL || "http://localhost:3000";

    // Get or create a Stripe customer
    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: identity.subject,
      email: identity.email,
      name: identity.name,
    });

    // Create checkout session with trial period
    return await stripeClient.createCheckoutSession(ctx, {
      priceId: args.priceId,
      customerId: customer.customerId,
      mode: "subscription",
      successUrl: `${siteUrl}/user?subscription=success`,
      cancelUrl: `${siteUrl}/pricing?subscription=canceled`,
      subscriptionMetadata: { 
        userId: identity.subject,
        tierName: args.tierName || "unknown",
      },
      // Trial is configured on the price in Stripe
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

    console.log("Syncing subscription:", subscription.id, "priceId:", currentPriceId, "resolvedTier:", tierName);

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

    console.log("Syncing subscription:", subscription.id, "priceId:", currentPriceId, "resolvedTier:", tierName);

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

// Get subscription tier by Stripe price ID
export const getTierByPriceId = internalQuery({
  args: { stripePriceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_stripePriceId", (q) => q.eq("stripePriceId", args.stripePriceId))
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
        allTierPriceIds: allTiers.map(t => ({ name: t.name, stripePriceId: t.stripePriceId })),
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
    
    // Find matching tier by stripePriceId
    const matchingTier = subscription?.stripePriceId 
      ? allTiers.find(t => t.stripePriceId === subscription.stripePriceId)
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
        stripePriceId: matchingTier.stripePriceId,
      } : null,
      allTierPriceIds: allTiers.map(t => ({ name: t.name, stripePriceId: t.stripePriceId })),
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

// Seed Stripe products and prices (run once) - USD only
export const seedStripeProducts = internalAction({
  args: {},
  handler: async (ctx) => {
    const stripe = getStripe();

    const products = [
      {
        name: "Starter",
        description: "Perfect for new pediatricians and low-volume practices",
        metadata: { tier: "starter" },
        priceAmountCents: 2900, // $29/month
      },
      {
        name: "Pro",
        description: "For established pediatricians with full AI support",
        metadata: { tier: "pro" },
        priceAmountCents: 4900, // $49/month
      },
      {
        name: "Premium",
        description: "For high-volume practitioners preparing for growth",
        metadata: { tier: "premium" },
        priceAmountCents: 9900, // $99/month
      },
    ];

    const results: Array<{ productId: string; productName: string; priceId: string; priceAmountCents: number }> = [];

    for (const productData of products) {
      // Create product in Stripe
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: productData.metadata,
      });

      // Create single USD price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.priceAmountCents,
        currency: "usd",
        recurring: {
          interval: "month",
          trial_period_days: 7,
        },
        metadata: {
          tier: productData.metadata.tier,
        },
      });

      results.push({
        productId: product.id,
        productName: product.name,
        priceId: price.id,
        priceAmountCents: productData.priceAmountCents,
      });
    }

    // Store tier configurations in Convex
    await ctx.runMutation(internal.stripe.seedSubscriptionTiers, {
      tiers: results.map((r, index) => ({
        name: products[index].metadata.tier,
        displayName: products[index].name,
        description: products[index].description,
        stripePriceId: r.priceId,
        priceAmountCents: r.priceAmountCents,
        sortOrder: index,
      })),
    });

    return results;
  },
});

// Seed subscription tiers in Convex database
export const seedSubscriptionTiers = internalMutation({
  args: {
    tiers: v.array(
      v.object({
        name: v.string(),
        displayName: v.string(),
        description: v.string(),
        stripePriceId: v.string(),
        priceAmountCents: v.number(),
        sortOrder: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const tierConfigs = {
      starter: {
        limits: {
          patientCount: 100,
          recordCount: 200,
          scrybegptMessages: 50,
          aiPrescription: 20,
          aiLabExam: 20,
          aiDiagnostic: 20,
          aiReport: 0, // Not available in Starter
        },
        features: [
          "emr",
          "basic_growth_charts",
          "billing_receipts",
          "multi_currency",
          "scrybegpt",
          "ai_diagnostic",
          "ai_prescription",
          "ai_lab_exam",
          "basic_analytics",
          "pdf_export",
          "email_support",
        ],
        isPopular: false,
      },
      pro: {
        limits: {
          patientCount: 500,
          recordCount: 1000,
          scrybegptMessages: 300,
          aiPrescription: 100,
          aiLabExam: 100,
          aiDiagnostic: 100,
          aiReport: 50,
        },
        features: [
          "emr",
          "basic_growth_charts",
          "all_growth_charts",
          "vaccination_management",
          "billing_receipts",
          "multi_currency",
          "scrybegpt",
          "ai_diagnostic",
          "ai_prescription",
          "ai_lab_exam",
          "ai_report",
          "advanced_analytics",
          "pdf_export",
          "email_chat_support",
        ],
        isPopular: true,
      },
      premium: {
        limits: {
          patientCount: -1, // unlimited
          recordCount: -1, // unlimited
          scrybegptMessages: -1, // unlimited
          aiPrescription: -1, // unlimited
          aiLabExam: -1, // unlimited
          aiDiagnostic: -1, // unlimited
          aiReport: -1, // unlimited
        },
        features: [
          "emr",
          "basic_growth_charts",
          "all_growth_charts",
          "vaccination_management",
          "billing_receipts",
          "multi_currency",
          "scrybegpt",
          "ai_diagnostic",
          "ai_prescription",
          "ai_lab_exam",
          "ai_report",
          "advanced_analytics",
          "pdf_export",
          "priority_support",
          "telehealth", // Coming soon
          "staff_accounts", // Coming soon
        ],
        isPopular: false,
      },
    };

    const now = Date.now();

    for (const tier of args.tiers) {
      const config = tierConfigs[tier.name as keyof typeof tierConfigs];
      if (!config) continue;

      // Check if tier already exists
      const existing = await ctx.db
        .query("subscriptionTiers")
        .withIndex("by_name", (q) => q.eq("name", tier.name))
        .first();

      if (existing) {
        // Update existing tier
        await ctx.db.patch(existing._id, {
          displayName: tier.displayName,
          description: tier.description,
          stripePriceId: tier.stripePriceId,
          priceAmountCents: tier.priceAmountCents,
          limits: config.limits,
          features: config.features,
          sortOrder: tier.sortOrder,
          isPopular: config.isPopular,
        });
      } else {
        // Create new tier
        await ctx.db.insert("subscriptionTiers", {
          name: tier.name,
          displayName: tier.displayName,
          description: tier.description,
          stripePriceId: tier.stripePriceId,
          priceAmountCents: tier.priceAmountCents,
          limits: config.limits,
          features: config.features,
          trialPeriodDays: 7,
          sortOrder: tier.sortOrder,
          isPopular: config.isPopular,
          createdAt: now,
        });
      }
    }
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

// Get tier by Stripe price ID (public query for workflow)
export const getTierByPriceIdPublic = query({
  args: { stripePriceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_stripePriceId", (q) => q.eq("stripePriceId", args.stripePriceId))
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
