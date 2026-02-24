import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ==================== Feature Access Configuration ====================

// Features that require specific subscription tiers
const FEATURE_ACCESS: Record<string, string[]> = {
  // All tiers (Starter+)
  emr: ["starter", "pro", "premium"],
  basic_growth_charts: ["starter", "pro", "premium"],
  billing_receipts: ["starter", "pro", "premium"],
  multi_currency: ["starter", "pro", "premium"],
  scrybegpt: ["starter", "pro", "premium"],
  ai_diagnostic: ["starter", "pro", "premium"],
  ai_prescription: ["starter", "pro", "premium"],
  ai_lab_exam: ["starter", "pro", "premium"],
  basic_analytics: ["starter", "pro", "premium"],
  pdf_export: ["starter", "pro", "premium"],
  email_support: ["starter", "pro", "premium"],

  // Pro+ features
  vaccination_management: ["pro", "premium"],
  all_growth_charts: ["pro", "premium"],
  ai_report: ["pro", "premium"],
  advanced_analytics: ["pro", "premium"],
  email_chat_support: ["pro", "premium"],

  // Pro+ portal features
  patient_portal: ["pro", "premium"],

  // Premium only features (some coming soon)
  priority_support: ["premium"],
  telehealth: ["premium"], // Coming soon
  staff_accounts: ["premium"], // Coming soon
};

// ==================== Queries ====================

// Get current user's subscription tier name
export const getCurrentTier = query({
  args: {},
  handler: async (ctx): Promise<string | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get the app user to check their plan
    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!appUser) return null;

    // Get the doctor record
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) return null;

    // Get the active subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    if (!subscription) return null;

    // Check if subscription is active
    const activeStatuses = ["trialing", "active"];
    if (!activeStatuses.includes(subscription.status)) return null;

    // Get tier name directly from subscription
    const tierName = subscription.tierName || subscription.metadata?.tierName;
    return tierName || null;
  },
});

// Check if current user has an active subscription
export const hasActiveSubscription = query({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) return false;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    if (!subscription) return false;

    const activeStatuses = ["trialing", "active"];
    return activeStatuses.includes(subscription.status);
  },
});

// Get current user's full subscription details
export const getCurrentSubscriptionDetails = query({
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

    // Get the active subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    if (!subscription) {
      // Return no subscription state
      return {
        tier: "none",
        tierDisplayName: "No Subscription",
        status: "none",
        limits: {
          patientCount: 0,
          recordCount: 0,
          scrybegptMessages: 0,
          aiPrescription: 0,
          aiLabExam: 0,
          aiDiagnostic: 0,
          aiReport: 0,
        },
        features: [],
        currentPeriodEnd: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    // Try to get tier name from multiple sources
    let tierName: string = "unknown";

    // First try from subscription tierName field (new approach)
    if (subscription.tierName) {
      tierName = subscription.tierName;
    }
    // Then try from subscription metadata
    else if (subscription.metadata?.tierName) {
      tierName = subscription.metadata.tierName;
    } 
    // Then try from price/product
    else if (subscription.priceId) {
      const price = await ctx.db.get(subscription.priceId);
      if (price) {
        const product = await ctx.db.get(price.productId);
        if (product?.metadata?.tier) {
          tierName = product.metadata.tier;
        }
      }
    }

    // Get the tier configuration
    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_name", (q) => q.eq("name", tierName))
      .first();

    // If we still don't have tier info, check appUser plan
    if (!tier) {
      const appUser = await ctx.db
        .query("appUsers")
        .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
        .first();
      
      if (appUser?.plan && appUser.plan !== "none") {
        tierName = appUser.plan;
        const tierFromPlan = await ctx.db
          .query("subscriptionTiers")
          .withIndex("by_name", (q) => q.eq("name", tierName))
          .first();
        
        if (tierFromPlan) {
          return {
            tier: tierName,
            tierDisplayName: tierFromPlan.displayName,
            status: subscription.status,
            limits: tierFromPlan.limits,
            features: tierFromPlan.features,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            trialStart: subscription.trialStart,
            trialEnd: subscription.trialEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          };
        }
      }
    }

    return {
      tier: tierName,
      tierDisplayName: tier?.displayName || tierName,
      status: subscription.status,
      limits: tier?.limits || {
        aiQueriesMonthly: 50,
        activePatients: 500,
        documentGenerationMonthly: 20,
        apiCallsMonthly: 0,
      },
      features: tier?.features || [],
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialStart: subscription.trialStart,
      trialEnd: subscription.trialEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  },
});

// Check if current user has access to a specific feature
export const hasFeatureAccess = query({
  args: { feature: v.string() },
  handler: async (ctx, args): Promise<boolean> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    // Get the doctor record
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) return false;

    // Get the active subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    // If no subscription, check if feature is available to free tier
    if (!subscription) {
      return false; // No features for free tier except basic EMR
    }

    // Check if subscription is active
    const activeStatuses = ["trialing", "active"];
    if (!activeStatuses.includes(subscription.status)) return false;

    // Get tier name directly from subscription
    const tierName = subscription.tierName || subscription.metadata?.tierName || "free";

    // Check if the feature is available for this tier
    const allowedTiers = FEATURE_ACCESS[args.feature];
    if (!allowedTiers) return false;

    return allowedTiers.includes(tierName);
  },
});

// Default limits when no subscription
const DEFAULT_LIMITS = {
  patientCount: 0,
  recordCount: 0,
  scrybegptMessages: 0,
  aiPrescription: 0,
  aiLabExam: 0,
  aiDiagnostic: 0,
  aiReport: 0,
};

// Get current user's subscription limits
export const getSubscriptionLimits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return DEFAULT_LIMITS;
    }

    // Get the doctor record
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) {
      return DEFAULT_LIMITS;
    }

    // Get the active subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    if (!subscription) {
      return DEFAULT_LIMITS;
    }

    // Check if subscription is active
    const activeStatuses = ["trialing", "active"];
    if (!activeStatuses.includes(subscription.status)) {
      return DEFAULT_LIMITS;
    }

    // Get tier name directly from subscription
    const tierName = subscription.tierName || subscription.metadata?.tierName;
    if (!tierName) {
      return DEFAULT_LIMITS;
    }

    // Get the tier configuration
    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_name", (q) => q.eq("name", tierName))
      .first();

    if (!tier) {
      return DEFAULT_LIMITS;
    }

    return tier.limits;
  },
});

// Check if user can add more patients (based on limit)
export const canAddPatient = query({
  args: {},
  handler: async (ctx): Promise<{ allowed: boolean; reason?: string; currentCount: number; limit: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { allowed: false, reason: "Not authenticated", currentCount: 0, limit: 0 };
    }

    // Get the doctor record
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) {
      return { allowed: false, reason: "Doctor profile not found", currentCount: 0, limit: 0 };
    }

    // Get current patient count
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();
    const currentCount = patients.length;

    // Get subscription limits
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    let patientLimit = 0; // No subscription = no patients

    if (subscription) {
      const activeStatuses = ["trialing", "active"];
      if (activeStatuses.includes(subscription.status)) {
        // Get tier name directly from subscription
        const tierName = subscription.tierName || subscription.metadata?.tierName;
        if (tierName) {
          const tier = await ctx.db
            .query("subscriptionTiers")
            .withIndex("by_name", (q) => q.eq("name", tierName))
            .first();

          if (tier) {
            patientLimit = tier.limits.patientCount;
          }
        }
      }
    }

    // -1 means unlimited
    if (patientLimit === -1) {
      return { allowed: true, currentCount, limit: -1 };
    }

    if (currentCount >= patientLimit) {
      return {
        allowed: false,
        reason: `You have reached your patient limit (${patientLimit}). Please upgrade your plan to add more patients.`,
        currentCount,
        limit: patientLimit,
      };
    }

    return { allowed: true, currentCount, limit: patientLimit };
  },
});

// ==================== Internal Mutations ====================

// Create or update subscription from webhook
export const upsertSubscription = internalMutation({
  args: {
    stripeId: v.string(),
    stripeCustomerId: v.string(),
    stripePriceId: v.string(),
    status: v.string(),
    quantity: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    metadata: v.optional(v.record(v.string(), v.string())),
    created: v.number(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    endedAt: v.optional(v.number()),
    cancelAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find the doctor by Stripe customer ID
    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!appUser) {
      console.error("No app user found for Stripe customer");
      return;
    }

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", appUser.authUserId))
      .first();

    if (!doctor) {
      console.error("No doctor found for auth user");
      return;
    }

    // Find or create the price record
    let price = await ctx.db
      .query("prices")
      .withIndex("by_stripeId", (q) => q.eq("stripeId", args.stripePriceId))
      .first();

    if (!price) {
      console.error("No price found for Stripe price:", args.stripePriceId);
      return;
    }

    // Check if subscription already exists
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    const subscriptionData = {
      stripeId: args.stripeId,
      doctorId: doctor._id,
      priceId: price._id,
      status: args.status as "trialing" | "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "unpaid" | "paused",
      quantity: args.quantity,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      metadata: args.metadata,
      created: args.created,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      endedAt: args.endedAt,
      cancelAt: args.cancelAt,
      canceledAt: args.canceledAt,
      trialStart: args.trialStart,
      trialEnd: args.trialEnd,
    };

    if (existing) {
      await ctx.db.patch(existing._id, subscriptionData);
    } else {
      await ctx.db.insert("subscriptions", subscriptionData);
    }

    // Update app user plan
    const product = await ctx.db.get(price.productId);
    const tierName = product?.metadata?.tier as string || "free";
    
    await ctx.db.patch(appUser._id, {
      plan: tierName,
    });
  },
});

// Delete subscription
export const deleteSubscription = internalMutation({
  args: { stripeId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeId", (q) => q.eq("stripeId", args.stripeId))
      .first();

    if (subscription) {
      // Update the associated app user's plan to free
      const doctor = await ctx.db.get(subscription.doctorId);
      if (doctor) {
        const appUser = await ctx.db
          .query("appUsers")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", doctor.authUserId))
          .first();
        
        if (appUser) {
          await ctx.db.patch(appUser._id, { plan: "free" });
        }
      }

      await ctx.db.delete(subscription._id);
    }
  },
});
