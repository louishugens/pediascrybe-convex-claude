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

// ==================== STANDALONE DEPLOYMENT ====================
// Billing and subscription gating are removed for the single-client deployment.
// Every authenticated user gets the full, unlimited "institution" feature set.
const ALL_FEATURES = [
  "emr", "all_growth_charts", "vaccination_management", "billing_receipts", "multi_currency",
  "scrybegpt", "patient_specific_ai", "ai_diagnostic", "ai_prescription", "ai_lab_exam",
  "ai_report", "basic_analytics", "advanced_analytics", "pdf_export", "email_support",
  "email_chat_support", "priority_support", "staff_accounts", "patient_portal", "telehealth",
  "whatsapp_scrybegpt",
];
const UNLIMITED_LIMITS = {
  patientCount: 999999, recordCount: 999999, aiCredits: 999999, whatsappTrial: 999999,
  whatsappMessages: 999999, fileStorageMB: 999999, services: 999999, staffSeats: 999,
  auditRetentionDays: 3650, telehealthMinutes: 999999, telehealthOverageRate: 0,
  patientPortal: true, telehealth: true, dashboardTier: "full" as const, growthCharts: "all" as const,
};

// ==================== Queries ====================

// Get current user's subscription tier name
export const getCurrentTier = query({
  args: {},
  handler: async (ctx): Promise<string | null> => {
    // STANDALONE: billing removed — everyone is on the unlimited "institution" tier.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return "institution";
  },
});

// Check if current user has an active subscription
export const hasActiveSubscription = query({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    // STANDALONE: billing removed — always active for authenticated users.
    const identity = await ctx.auth.getUserIdentity();
    return !!identity;
  },
});

// Get current user's full subscription details
export const getCurrentSubscriptionDetails = query({
  args: {},
  handler: async (ctx) => {
    // STANDALONE: billing removed — report full, unlimited access for any authenticated user.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      tier: "institution",
      tierDisplayName: "Full Access",
      status: "active",
      limits: UNLIMITED_LIMITS,
      features: ALL_FEATURES,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      trialStart: null,
      trialEnd: null,
      cancelAtPeriodEnd: false,
    };
  },
});

// Check if current user has access to a specific feature
export const hasFeatureAccess = query({
  args: { feature: v.string() },
  handler: async (ctx): Promise<boolean> => {
    // STANDALONE: billing removed — all features unlocked for authenticated users.
    const identity = await ctx.auth.getUserIdentity();
    return !!identity;
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
  handler: async () => {
    // STANDALONE: billing removed — unlimited limits.
    return UNLIMITED_LIMITS;
  },
});

// Check if user can add more patients (based on limit)
export const canAddPatient = query({
  args: {},
  handler: async (ctx): Promise<{ allowed: boolean; reason?: string; currentCount: number; limit: number }> => {
    // STANDALONE: billing removed — always allowed (currentCount kept for display).
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { allowed: false, reason: "Not authenticated", currentCount: 0, limit: 0 };
    }
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();
    const currentCount = doctor
      ? (await ctx.db.query("patients").withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id)).collect()).length
      : 0;
    return { allowed: true, currentCount, limit: 999999 };
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
