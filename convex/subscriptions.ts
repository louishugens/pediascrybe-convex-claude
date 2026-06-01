import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ==================== Feature Access Configuration ====================

// Features that require specific subscription tiers
const ALL_PAID = ["essentials", "professional", "complete", "institution"];
const PROF_UP = ["professional", "complete", "institution"];
const COMPLETE_UP = ["complete", "institution"];

const FEATURE_ACCESS: Record<string, string[]> = {
  emr: ALL_PAID,
  all_growth_charts: ALL_PAID,
  vaccination_management: ALL_PAID,
  billing_receipts: ALL_PAID,
  multi_currency: ALL_PAID,
  scrybegpt: ALL_PAID,
  patient_specific_ai: ALL_PAID,
  ai_diagnostic: ALL_PAID,
  ai_prescription: ALL_PAID,
  ai_lab_exam: ALL_PAID,
  basic_analytics: ALL_PAID,
  pdf_export: ALL_PAID,
  email_support: ALL_PAID,
  whatsapp_scrybegpt: ALL_PAID, // essentials is capped at 10 trial messages/mo

  ai_report: PROF_UP,
  advanced_analytics: PROF_UP,
  email_chat_support: PROF_UP,
  patient_portal: PROF_UP,
  telehealth: PROF_UP,

  priority_support: COMPLETE_UP,
  staff_accounts: COMPLETE_UP,
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
        limits: DEFAULT_LIMITS,
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
      limits: tier?.limits || DEFAULT_LIMITS,
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

// Default limits when no subscription — all zero / disabled
const DEFAULT_LIMITS = {
  patientCount: 0,
  recordCount: 0,
  aiCredits: 0,
  whatsappTrial: 0,
  whatsappMessages: 0,
  fileStorageMB: 0,
  services: 0,
  staffSeats: 0,
  auditRetentionDays: 0,
  telehealthMinutes: 0,
  telehealthOverageRate: 0,
  patientPortal: false,
  telehealth: false,
  dashboardTier: "basic" as const,
  growthCharts: "all" as const,
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
