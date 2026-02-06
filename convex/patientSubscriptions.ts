import { query, action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import Stripe from "stripe";

// ==================== Stripe Setup ====================

const getStripe = (): Stripe => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
};

// Scrybe Assist product name (used to look up in DB)
const PATIENT_PRODUCT_NAME = "Scrybe Assist Premium";

// ==================== Queries ====================

// Get current patient's subscription
export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("patientSubscriptions")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();
  },
});

// ==================== Actions ====================

// Create Stripe checkout session for Scrybe Assist Premium
export const createCheckout = action({
  args: {},
  returns: v.object({
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx): Promise<{ url: string | null }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const stripe = getStripe();
    const siteUrl = process.env.SITE_URL || "http://localhost:3000";

    // Look up price from DB (seeded by seedPatientProduct), env var fallback
    const patientProduct = await ctx.runQuery(internal.patientSubscriptions.getPatientProduct);
    const priceId = patientProduct?.stripePriceId || process.env.PATIENT_STRIPE_PRICE_ID || "";

    if (!priceId) {
      throw new Error("Patient Stripe price ID not configured. Run seedPatientProduct first.");
    }

    // Get or create Stripe customer
    const appUser = await ctx.runQuery(internal.stripe.getAppUserByAuthIdInternal, {
      authUserId: identity.subject,
    });

    let customerId = appUser?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: identity.email || appUser?.email || "",
        name: identity.name || undefined,
        metadata: {
          authUserId: identity.subject,
          userType: "patient",
        },
      });
      customerId = customer.id;

      // Store customer ID
      await ctx.runMutation(internal.stripe.updateAppUserStripeCustomer, {
        authUserId: identity.subject,
        stripeCustomerId: customerId,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/portal/settings?subscription=success`,
      cancel_url: `${siteUrl}/portal/settings?subscription=canceled`,
      metadata: {
        authUserId: identity.subject,
        userType: "patient",
      },
      subscription_data: {
        metadata: {
          authUserId: identity.subject,
          userType: "patient",
        },
      },
    });

    return { url: session.url };
  },
});

// Create Stripe customer portal session for managing subscription
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

    const appUser = await ctx.runQuery(internal.stripe.getAppUserByAuthIdInternal, {
      authUserId: identity.subject,
    });

    if (!appUser?.stripeCustomerId) {
      throw new Error("No Stripe customer found");
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: appUser.stripeCustomerId,
      return_url: `${siteUrl}/portal/settings`,
    });

    return { url: portalSession.url };
  },
});

// ==================== Internal Mutations (called by webhooks) ====================

// Sync patient subscription from Stripe webhook
export const syncSubscription = internalMutation({
  args: {
    authUserId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    status: v.string(),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("patientSubscriptions")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();

    const plan = args.status === "active" || args.status === "trialing" ? "premium" : "free";
    const status = args.status as "active" | "trialing" | "canceled" | "incomplete";

    if (existing) {
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        plan,
        status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        trialEnd: args.trialEnd,
      });
    } else {
      await ctx.db.insert("patientSubscriptions", {
        authUserId: args.authUserId,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        plan,
        status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        trialEnd: args.trialEnd,
        createdAt: Date.now(),
      });
    }
  },
});

// Cancel patient subscription
export const cancelSubscription = internalMutation({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("patientSubscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        plan: "free",
        status: "canceled",
      });
    }
  },
});

// ==================== Product Seed & Lookup ====================

// Get the Scrybe Assist product/price from our products table
export const getPatientProduct = internalQuery({
  args: {},
  handler: async (ctx) => {
    const product = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("name"), PATIENT_PRODUCT_NAME))
      .first();
    if (!product) return null;

    const price = await ctx.db
      .query("prices")
      .withIndex("by_productId", (q) => q.eq("productId", product._id))
      .first();

    return price ? { stripePriceId: price.stripeId } : null;
  },
});

// Store the seeded product/price in our local tables
export const storePatientProduct = internalMutation({
  args: {
    stripeProductId: v.string(),
    stripePriceId: v.string(),
    priceAmountCents: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if product already exists
    const existing = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("name"), PATIENT_PRODUCT_NAME))
      .first();

    let productId;
    if (existing) {
      await ctx.db.patch(existing._id, {
        stripeId: args.stripeProductId,
        active: true,
      });
      productId = existing._id;
    } else {
      productId = await ctx.db.insert("products", {
        stripeId: args.stripeProductId,
        name: PATIENT_PRODUCT_NAME,
        description: "AI-powered explanations of your child's medical records",
        active: true,
        metadata: { userType: "patient" },
      });
    }

    // Check if price already exists for this product
    const existingPrice = await ctx.db
      .query("prices")
      .withIndex("by_productId", (q) => q.eq("productId", productId))
      .first();

    if (existingPrice) {
      await ctx.db.patch(existingPrice._id, {
        stripeId: args.stripePriceId,
        active: true,
        unitAmount: args.priceAmountCents,
      });
    } else {
      await ctx.db.insert("prices", {
        stripeId: args.stripePriceId,
        productId,
        active: true,
        currency: "usd",
        unitAmount: args.priceAmountCents,
        pricingType: "recurring",
        interval: "month",
        intervalCount: 1,
      });
    }
  },
});

// Seed the Scrybe Assist product + price in Stripe (run once)
export const seedPatientProduct = internalAction({
  args: {},
  handler: async (ctx) => {
    const stripe = getStripe();

    // Create product in Stripe
    const product = await stripe.products.create({
      name: PATIENT_PRODUCT_NAME,
      description: "Unlimited AI-powered explanations of your child's medications, diagnoses, lab exams, growth data, and vaccinations.",
      metadata: { userType: "patient" },
    });

    // Create $4.99/month price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 499, // $4.99
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { userType: "patient" },
    });

    // Store in our local tables
    await ctx.runMutation(internal.patientSubscriptions.storePatientProduct, {
      stripeProductId: product.id,
      stripePriceId: price.id,
      priceAmountCents: 499,
    });

    console.log(`[seedPatientProduct] Created product: ${product.id}, price: ${price.id}`);
    return { productId: product.id, priceId: price.id };
  },
});
