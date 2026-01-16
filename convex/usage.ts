import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ==================== Helper Functions ====================

// Get current period string (YYYY-MM format)
function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Type for quota check result
interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  remaining: number;
  limit: number;
  usage: number;
}

// ==================== Queries ====================

// Get current usage for the authenticated doctor
export const getCurrentUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) return null;

    const period = getCurrentPeriod();

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", doctor._id).eq("period", period)
      )
      .first();

    return {
      period,
      scrybegptMessages: usage?.scrybegptMessages || 0,
      aiPrescription: usage?.aiPrescription || 0,
      aiLabExam: usage?.aiLabExam || 0,
      aiDiagnostic: usage?.aiDiagnostic || 0,
      aiReport: usage?.aiReport || 0,
    };
  },
});

// Get usage with limits for display
export const getUsageWithLimits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) return null;

    const period = getCurrentPeriod();

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", doctor._id).eq("period", period)
      )
      .first();

    // Get patient and record counts
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();
    const patientCount = patients.length;

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();
    const recordCount = appointments.length;

    // Get subscription to determine limits
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    // Default limits (no subscription)
    let limits = {
      patientCount: 0,
      recordCount: 0,
      scrybegptMessages: 0,
      aiPrescription: 0,
      aiLabExam: 0,
      aiDiagnostic: 0,
      aiReport: 0,
    };

    if (subscription) {
      const activeStatuses = ["trialing", "active"];
      if (activeStatuses.includes(subscription.status)) {
        const tierName = subscription.tierName || subscription.metadata?.tierName;
        if (tierName) {
          const tier = await ctx.db
            .query("subscriptionTiers")
            .withIndex("by_name", (q) => q.eq("name", tierName))
            .first();

          if (tier) {
            limits = tier.limits;
          }
        }
      }
    }

    const currentUsage = {
      patientCount,
      recordCount,
      scrybegptMessages: usage?.scrybegptMessages || 0,
      aiPrescription: usage?.aiPrescription || 0,
      aiLabExam: usage?.aiLabExam || 0,
      aiDiagnostic: usage?.aiDiagnostic || 0,
      aiReport: usage?.aiReport || 0,
    };

    // Calculate remaining and percentage for each quota
    const calculateRemaining = (current: number, limit: number) => 
      limit === -1 ? -1 : Math.max(0, limit - current);
    
    const calculatePercent = (current: number, limit: number) =>
      limit === -1 ? 0 : limit > 0 ? Math.round((current / limit) * 100) : 100;

    return {
      period,
      usage: currentUsage,
      limits,
      remaining: {
        patientCount: calculateRemaining(currentUsage.patientCount, limits.patientCount),
        recordCount: calculateRemaining(currentUsage.recordCount, limits.recordCount),
        scrybegptMessages: calculateRemaining(currentUsage.scrybegptMessages, limits.scrybegptMessages),
        aiPrescription: calculateRemaining(currentUsage.aiPrescription, limits.aiPrescription),
        aiLabExam: calculateRemaining(currentUsage.aiLabExam, limits.aiLabExam),
        aiDiagnostic: calculateRemaining(currentUsage.aiDiagnostic, limits.aiDiagnostic),
        aiReport: calculateRemaining(currentUsage.aiReport, limits.aiReport),
      },
      percentUsed: {
        patientCount: calculatePercent(currentUsage.patientCount, limits.patientCount),
        recordCount: calculatePercent(currentUsage.recordCount, limits.recordCount),
        scrybegptMessages: calculatePercent(currentUsage.scrybegptMessages, limits.scrybegptMessages),
        aiPrescription: calculatePercent(currentUsage.aiPrescription, limits.aiPrescription),
        aiLabExam: calculatePercent(currentUsage.aiLabExam, limits.aiLabExam),
        aiDiagnostic: calculatePercent(currentUsage.aiDiagnostic, limits.aiDiagnostic),
        aiReport: calculatePercent(currentUsage.aiReport, limits.aiReport),
      },
    };
  },
});

// ==================== Quota Check Queries ====================

// Check patient quota
export const checkPatientQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { allowed: false, reason: "Not authenticated", remaining: 0, limit: 0, usage: 0 };
    }

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) {
      return { allowed: false, reason: "Doctor profile not found", remaining: 0, limit: 0, usage: 0 };
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    let limit = 0;

    if (subscription) {
      const activeStatuses = ["trialing", "active"];
      if (activeStatuses.includes(subscription.status)) {
        const tierName = subscription.tierName || subscription.metadata?.tierName;
        if (tierName) {
          const tier = await ctx.db
            .query("subscriptionTiers")
            .withIndex("by_name", (q) => q.eq("name", tierName))
            .first();
          if (tier) {
            limit = tier.limits.patientCount;
          }
        }
      }
    }

    // Unlimited
    if (limit === -1) {
      return { allowed: true, remaining: -1, limit: -1, usage: 0 };
    }

    if (limit === 0) {
      return {
        allowed: false,
        reason: "You need an active subscription to add patients.",
        remaining: 0,
        limit: 0,
        usage: 0,
      };
    }

    // Get current patient count
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();
    const usage = patients.length;
    const remaining = limit - usage;

    if (remaining <= 0) {
      return {
        allowed: false,
        reason: `You have reached your patient limit (${limit}). Please upgrade your plan.`,
        remaining: 0,
        limit,
        usage,
      };
    }

    return { allowed: true, remaining, limit, usage };
  },
});

// Check record/appointment quota
export const checkRecordQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { allowed: false, reason: "Not authenticated", remaining: 0, limit: 0, usage: 0 };
    }

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) {
      return { allowed: false, reason: "Doctor profile not found", remaining: 0, limit: 0, usage: 0 };
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .order("desc")
      .first();

    let limit = 0;

    if (subscription) {
      const activeStatuses = ["trialing", "active"];
      if (activeStatuses.includes(subscription.status)) {
        const tierName = subscription.tierName || subscription.metadata?.tierName;
        if (tierName) {
          const tier = await ctx.db
            .query("subscriptionTiers")
            .withIndex("by_name", (q) => q.eq("name", tierName))
            .first();
          if (tier) {
            limit = tier.limits.recordCount;
          }
        }
      }
    }

    if (limit === -1) {
      return { allowed: true, remaining: -1, limit: -1, usage: 0 };
    }

    if (limit === 0) {
      return {
        allowed: false,
        reason: "You need an active subscription to add records.",
        remaining: 0,
        limit: 0,
        usage: 0,
      };
    }

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();
    const usage = appointments.length;
    const remaining = limit - usage;

    if (remaining <= 0) {
      return {
        allowed: false,
        reason: `You have reached your record limit (${limit}). Please upgrade your plan.`,
        remaining: 0,
        limit,
        usage,
      };
    }

    return { allowed: true, remaining, limit, usage };
  },
});

// Generic helper for monthly usage quota checks
async function checkMonthlyQuota(
  ctx: any,
  quotaField: "scrybegptMessages" | "aiPrescription" | "aiLabExam" | "aiDiagnostic" | "aiReport",
  limitField: "scrybegptMessages" | "aiPrescription" | "aiLabExam" | "aiDiagnostic" | "aiReport",
  featureName: string
): Promise<QuotaCheckResult> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return { allowed: false, reason: "Not authenticated", remaining: 0, limit: 0, usage: 0 };
  }

  const doctor = await ctx.db
    .query("doctors")
    .withIndex("by_authUserId", (q: any) => q.eq("authUserId", identity.subject))
    .first();

  if (!doctor) {
    return { allowed: false, reason: "Doctor profile not found", remaining: 0, limit: 0, usage: 0 };
  }

  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_doctorId", (q: any) => q.eq("doctorId", doctor._id))
    .order("desc")
    .first();

  let limit = 0;

  if (subscription) {
    const activeStatuses = ["trialing", "active"];
    if (activeStatuses.includes(subscription.status)) {
      const tierName = subscription.tierName || subscription.metadata?.tierName;
      if (tierName) {
        const tier = await ctx.db
          .query("subscriptionTiers")
          .withIndex("by_name", (q: any) => q.eq("name", tierName))
          .first();
        if (tier) {
          limit = tier.limits[limitField];
        }
      }
    }
  }

  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1, usage: 0 };
  }

  if (limit === 0) {
    return {
      allowed: false,
      reason: `${featureName} is not available on your current plan. Please upgrade.`,
      remaining: 0,
      limit: 0,
      usage: 0,
    };
  }

  const period = getCurrentPeriod();
  const usageRecord = await ctx.db
    .query("usage")
    .withIndex("by_doctorId_period", (q: any) =>
      q.eq("doctorId", doctor._id).eq("period", period)
    )
    .first();

  const usage = usageRecord?.[quotaField] || 0;
  const remaining = limit - usage;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `You have reached your monthly ${featureName.toLowerCase()} limit (${limit}). Please upgrade your plan.`,
      remaining: 0,
      limit,
      usage,
    };
  }

  return { allowed: true, remaining, limit, usage };
}

// Check ScrybeGPT quota
export const checkScrybeGPTQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => {
    return checkMonthlyQuota(ctx, "scrybegptMessages", "scrybegptMessages", "ScrybeGPT messages");
  },
});

// Check AI Prescription quota
export const checkAIPrescriptionQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => {
    return checkMonthlyQuota(ctx, "aiPrescription", "aiPrescription", "AI prescription generation");
  },
});

// Check AI Lab Exam quota
export const checkAILabExamQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => {
    return checkMonthlyQuota(ctx, "aiLabExam", "aiLabExam", "AI lab exam generation");
  },
});

// Check AI Diagnostic quota
export const checkAIDiagnosticQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => {
    return checkMonthlyQuota(ctx, "aiDiagnostic", "aiDiagnostic", "AI diagnostic generation");
  },
});

// Check AI Report quota
export const checkAIReportQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => {
    return checkMonthlyQuota(ctx, "aiReport", "aiReport", "AI report generation");
  },
});

// Legacy: Check if user can make an AI query (maps to ScrybeGPT)
export const canMakeAIQuery = query({
  args: {},
  handler: async (ctx): Promise<{ allowed: boolean; reason?: string; remaining: number }> => {
    const result = await checkMonthlyQuota(ctx, "scrybegptMessages", "scrybegptMessages", "AI queries");
    return { allowed: result.allowed, reason: result.reason, remaining: result.remaining };
  },
});

// Legacy: Check if user can generate a document (maps to AI Report)
export const canGenerateDocument = query({
  args: {},
  handler: async (ctx): Promise<{ allowed: boolean; reason?: string; remaining: number }> => {
    const result = await checkMonthlyQuota(ctx, "aiReport", "aiReport", "Document generation");
    return { allowed: result.allowed, reason: result.reason, remaining: result.remaining };
  },
});

// ==================== Mutations ====================

// Generic increment mutation helper
async function incrementUsageField(
  ctx: any,
  field: "scrybegptMessages" | "aiPrescription" | "aiLabExam" | "aiDiagnostic" | "aiReport"
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const doctor = await ctx.db
    .query("doctors")
    .withIndex("by_authUserId", (q: any) => q.eq("authUserId", identity.subject))
    .first();

  if (!doctor) throw new Error("Doctor profile not found");

  const period = getCurrentPeriod();
  const now = Date.now();

  const usage = await ctx.db
    .query("usage")
    .withIndex("by_doctorId_period", (q: any) =>
      q.eq("doctorId", doctor._id).eq("period", period)
    )
    .first();

  if (usage) {
    await ctx.db.patch(usage._id, {
      [field]: (usage[field] || 0) + 1,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("usage", {
      doctorId: doctor._id,
      period,
      scrybegptMessages: field === "scrybegptMessages" ? 1 : 0,
      aiPrescription: field === "aiPrescription" ? 1 : 0,
      aiLabExam: field === "aiLabExam" ? 1 : 0,
      aiDiagnostic: field === "aiDiagnostic" ? 1 : 0,
      aiReport: field === "aiReport" ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// Increment ScrybeGPT message count
export const incrementScrybeGPT = mutation({
  args: {},
  handler: async (ctx) => {
    await incrementUsageField(ctx, "scrybegptMessages");
  },
});

// Increment AI Prescription count
export const incrementAIPrescription = mutation({
  args: {},
  handler: async (ctx) => {
    await incrementUsageField(ctx, "aiPrescription");
  },
});

// Increment AI Lab Exam count
export const incrementAILabExam = mutation({
  args: {},
  handler: async (ctx) => {
    await incrementUsageField(ctx, "aiLabExam");
  },
});

// Increment AI Diagnostic count
export const incrementAIDiagnostic = mutation({
  args: {},
  handler: async (ctx) => {
    await incrementUsageField(ctx, "aiDiagnostic");
  },
});

// Increment AI Report count
export const incrementAIReport = mutation({
  args: {},
  handler: async (ctx) => {
    await incrementUsageField(ctx, "aiReport");
  },
});

// Legacy: Increment AI query count (maps to ScrybeGPT)
export const incrementAIQuery = mutation({
  args: {},
  handler: async (ctx) => {
    await incrementUsageField(ctx, "scrybegptMessages");
  },
});

// Legacy: Increment document generation count (maps to AI Report)
export const incrementDocumentGeneration = mutation({
  args: {},
  handler: async (ctx) => {
    await incrementUsageField(ctx, "aiReport");
  },
});

// ==================== Internal Mutations ====================

// Reset usage for a new period (can be called by a cron job)
export const resetUsageForPeriod = internalMutation({
  args: { period: v.string() },
  handler: async (ctx, args) => {
    const oldUsage = await ctx.db
      .query("usage")
      .filter((q) => q.lt(q.field("period"), args.period))
      .collect();

    // Keep last 12 months of usage data
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 12);
    const cutoffPeriod = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, "0")}`;

    for (const usage of oldUsage) {
      if (usage.period < cutoffPeriod) {
        await ctx.db.delete(usage._id);
      }
    }
  },
});

// Get usage by doctor ID (internal)
export const getUsageByDoctorId = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const period = getCurrentPeriod();
    return await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", args.doctorId).eq("period", period)
      )
      .first();
  },
});
