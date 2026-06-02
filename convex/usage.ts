import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ==================== AI Credit Pricing ====================

// Credit cost per AI feature. Source of truth for billable weight.
export const AI_CREDIT_WEIGHTS = {
  scrybegpt: 1,
  patient_chat: 1,
  prescription: 2,
  lab_exam: 2,
  diagnostic: 2,
  report: 5,
  whatsapp: 1,
  classify: 1,
  completion: 1,
} as const;

export type AIFeature = keyof typeof AI_CREDIT_WEIGHTS;

// ==================== Helper Functions ====================

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  remaining: number;
  limit: number;
  usage: number;
}

// ==================== Queries ====================

// Get current usage row for the authenticated doctor
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
      aiCreditsUsed: usage?.aiCreditsUsed || 0,
      packCreditsRemaining: usage?.packCreditsRemaining || 0,
      whatsappTrialUsed: usage?.whatsappTrialUsed || 0,
      whatsappMessagesUsed: usage?.whatsappMessagesUsed || 0,
      telehealthMinutesUsed: usage?.telehealthMinutesUsed || 0,
      storageUsedBytes: usage?.storageUsedBytes || 0,
    };
  },
});

// Get usage with tier limits for dashboard display
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

    // STANDALONE: billing removed — unlimited limits so usage meters sit near 0%.
    const limits = {
      patientCount: 999999, recordCount: 999999, aiCredits: 999999, whatsappTrial: 999999,
      whatsappMessages: 999999, fileStorageMB: 999999, services: 999999, staffSeats: 999,
      auditRetentionDays: 3650, telehealthMinutes: 999999, telehealthOverageRate: 0,
      patientPortal: true, telehealth: true,
      dashboardTier: "full" as "basic" | "standard" | "full",
      growthCharts: "all" as const,
    };

    const currentUsage = {
      patientCount,
      recordCount,
      aiCreditsUsed: usage?.aiCreditsUsed || 0,
      packCreditsRemaining: usage?.packCreditsRemaining || 0,
      whatsappTrialUsed: usage?.whatsappTrialUsed || 0,
      whatsappMessagesUsed: usage?.whatsappMessagesUsed || 0,
      telehealthMinutesUsed: usage?.telehealthMinutesUsed || 0,
      storageUsedBytes: usage?.storageUsedBytes || 0,
    };

    // Every limit is now a concrete number — no -1 sentinel, no Infinity
    const calculateRemaining = (current: number, limit: number) =>
      Math.max(0, limit - current);

    const calculatePercent = (current: number, limit: number) =>
      limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 100;

    return {
      period,
      usage: currentUsage,
      limits,
      remaining: {
        patientCount: calculateRemaining(currentUsage.patientCount, limits.patientCount),
        recordCount: calculateRemaining(currentUsage.recordCount, limits.recordCount),
        aiCredits: calculateRemaining(currentUsage.aiCreditsUsed, limits.aiCredits),
        whatsappTrial: calculateRemaining(currentUsage.whatsappTrialUsed, limits.whatsappTrial),
        whatsappMessages: calculateRemaining(currentUsage.whatsappMessagesUsed, limits.whatsappMessages),
        fileStorageMB: calculateRemaining(
          Math.floor(currentUsage.storageUsedBytes / (1024 * 1024)),
          limits.fileStorageMB,
        ),
        telehealthMinutes: calculateRemaining(
          currentUsage.telehealthMinutesUsed,
          limits.telehealthMinutes,
        ),
      },
      percentUsed: {
        patientCount: calculatePercent(currentUsage.patientCount, limits.patientCount),
        recordCount: calculatePercent(currentUsage.recordCount, limits.recordCount),
        aiCredits: calculatePercent(currentUsage.aiCreditsUsed, limits.aiCredits),
        whatsappTrial: calculatePercent(currentUsage.whatsappTrialUsed, limits.whatsappTrial),
        whatsappMessages: calculatePercent(currentUsage.whatsappMessagesUsed, limits.whatsappMessages),
        fileStorageMB: calculatePercent(
          Math.floor(currentUsage.storageUsedBytes / (1024 * 1024)),
          limits.fileStorageMB,
        ),
        telehealthMinutes: calculatePercent(
          currentUsage.telehealthMinutesUsed,
          limits.telehealthMinutes,
        ),
      },
    };
  },
});

// ==================== Quota Check Queries ====================

// Check patient quota
export const checkPatientQuota = query({
  args: {},
  handler: async (): Promise<QuotaCheckResult> => {
    // STANDALONE: billing removed — unlimited patient quota.
    return { allowed: true, remaining: 999999, limit: 999999, usage: 0 };
  },
});

// Check record/appointment quota
export const checkRecordQuota = query({
  args: {},
  handler: async (): Promise<QuotaCheckResult> => {
    // STANDALONE: billing removed — unlimited record quota.
    return { allowed: true, remaining: 999999, limit: 999999, usage: 0 };
  },
});

// ==================== AI Credit Quota ====================

// Unified AI credit balance check. Returns remaining credits across both the
// included monthly pool and any purchased pack balance. Pass `cost` (default 1)
// to verify the user can afford a specific feature before calling it.
export const checkAICreditQuota = query({
  args: { cost: v.optional(v.number()) },
  handler: async (ctx): Promise<QuotaCheckResult & { packBalance: number }> => {
    // STANDALONE: billing removed — unlimited AI credits.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { allowed: false, reason: "Not authenticated", remaining: 0, limit: 0, usage: 0, packBalance: 0 };
    }
    return { allowed: true, remaining: 999999, limit: 999999, usage: 0, packBalance: 0 };
  },
});

// Legacy: generic AI query check (maps to 1-credit quota)
export const canMakeAIQuery = query({
  args: {},
  handler: async (ctx): Promise<{ allowed: boolean; reason?: string; remaining: number }> => {
    const result = await checkAICreditQuotaInline(ctx, 1);
    return { allowed: result.allowed, reason: result.reason, remaining: result.remaining };
  },
});

// Legacy: document generation check (maps to 5-credit report cost)
export const canGenerateDocument = query({
  args: {},
  handler: async (ctx): Promise<{ allowed: boolean; reason?: string; remaining: number }> => {
    const result = await checkAICreditQuotaInline(ctx, 5);
    return { allowed: result.allowed, reason: result.reason, remaining: result.remaining };
  },
});

// ==================== Mutations ====================

// Deduct AI credits — call BEFORE making the AI request.
// Consumption order: included pool first, then pack balance.
// Throws NO_CREDITS if the user can't afford the cost.
export const deductAICredits = mutation({
  args: {
    feature: v.union(
      v.literal("scrybegpt"),
      v.literal("patient_chat"),
      v.literal("prescription"),
      v.literal("lab_exam"),
      v.literal("diagnostic"),
      v.literal("report"),
      v.literal("whatsapp"),
      v.literal("classify"),
      v.literal("completion"),
    ),
  },
  handler: async (ctx, args): Promise<{ success: boolean; cost: number; remaining: number }> => {
    // STANDALONE: billing removed — AI credits are unlimited; never block or charge.
    const cost = AI_CREDIT_WEIGHTS[args.feature];
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return { success: true, cost, remaining: 999999 };
  },
});

// Refund AI credits — call from an AI route's error handler to undo a deduction
// when the model call actually fails after we've already charged the user.
export const refundAICredits = mutation({
  args: {
    feature: v.union(
      v.literal("scrybegpt"),
      v.literal("patient_chat"),
      v.literal("prescription"),
      v.literal("lab_exam"),
      v.literal("diagnostic"),
      v.literal("report"),
      v.literal("whatsapp"),
      v.literal("classify"),
      v.literal("completion"),
    ),
  },
  handler: async (ctx, args) => {
    const cost = AI_CREDIT_WEIGHTS[args.feature];

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    if (!doctor) return;

    const period = getCurrentPeriod();
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", doctor._id).eq("period", period)
      )
      .first();

    if (!usage) return;

    // Refund from pool counter first — simpler than tracking which bucket paid.
    const currentUsed = usage.aiCreditsUsed || 0;
    await ctx.db.patch(usage._id, {
      aiCreditsUsed: Math.max(0, currentUsed - cost),
      updatedAt: Date.now(),
    });
  },
});

// ==================== Legacy Increment Wrappers ====================
// These map the old per-feature increments onto the unified credit pool so
// existing AI routes keep working until they're migrated to deductAICredits.

async function deductForFeature(ctx: any, feature: AIFeature) {
  const cost = AI_CREDIT_WEIGHTS[feature];
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
      aiCreditsUsed: (usage.aiCreditsUsed || 0) + cost,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("usage", {
      doctorId: doctor._id,
      period,
      aiCreditsUsed: cost,
      packCreditsRemaining: 0,
      whatsappTrialUsed: 0,
      whatsappMessagesUsed: 0,
      telehealthMinutesUsed: 0,
      storageUsedBytes: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export const incrementScrybeGPT = mutation({
  args: {},
  handler: async (ctx) => { await deductForFeature(ctx, "scrybegpt"); },
});

export const incrementAIPrescription = mutation({
  args: {},
  handler: async (ctx) => { await deductForFeature(ctx, "prescription"); },
});

export const incrementAILabExam = mutation({
  args: {},
  handler: async (ctx) => { await deductForFeature(ctx, "lab_exam"); },
});

export const incrementAIDiagnostic = mutation({
  args: {},
  handler: async (ctx) => { await deductForFeature(ctx, "diagnostic"); },
});

export const incrementAIReport = mutation({
  args: {},
  handler: async (ctx) => { await deductForFeature(ctx, "report"); },
});

export const incrementAIQuery = mutation({
  args: {},
  handler: async (ctx) => { await deductForFeature(ctx, "scrybegpt"); },
});

export const incrementDocumentGeneration = mutation({
  args: {},
  handler: async (ctx) => { await deductForFeature(ctx, "report"); },
});

// Legacy per-feature check wrappers (map to unified credit quota).
async function checkAICreditQuotaInline(ctx: any, _cost: number): Promise<QuotaCheckResult> {
  // STANDALONE: billing removed — unlimited AI credits for authenticated users.
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return { allowed: false, reason: "Not authenticated", remaining: 0, limit: 0, usage: 0 };
  }
  return { allowed: true, remaining: 999999, limit: 999999, usage: 0 };
}

export const checkScrybeGPTQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => checkAICreditQuotaInline(ctx, 1),
});

export const checkAIPrescriptionQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => checkAICreditQuotaInline(ctx, 2),
});

export const checkAILabExamQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => checkAICreditQuotaInline(ctx, 2),
});

export const checkAIDiagnosticQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => checkAICreditQuotaInline(ctx, 2),
});

export const checkAIReportQuota = query({
  args: {},
  handler: async (ctx): Promise<QuotaCheckResult> => checkAICreditQuotaInline(ctx, 5),
});

// ==================== Internal Mutations ====================

// Reset the monthly usage row for a specific doctor by zeroing all counters.
// Called from the monthly cron for each active doctor.
export const resetDoctorUsageCounters = internalMutation({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const period = getCurrentPeriod();
    const now = Date.now();

    const existing = await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", args.doctorId).eq("period", period)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        aiCreditsUsed: 0,
        packCreditsRemaining: 0, // packs do NOT roll over
        whatsappTrialUsed: 0,
        whatsappMessagesUsed: 0,
        telehealthMinutesUsed: 0,
        // storageUsedBytes is NOT reset — it's a running total
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("usage", {
        doctorId: args.doctorId,
        period,
        aiCreditsUsed: 0,
        packCreditsRemaining: 0,
        whatsappTrialUsed: 0,
        whatsappMessagesUsed: 0,
        telehealthMinutesUsed: 0,
        storageUsedBytes: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Cron entry point — resolves the current period internally so crons.monthly
// can schedule it without supplying dynamic args.
export const resetCurrentPeriodUsage = internalMutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    await ctx.runMutation(internal.usage.resetUsageForPeriod, {
      period: getCurrentPeriod(),
    });
  },
});

// Monthly cron entry point — resets counters for every doctor.
export const resetUsageForPeriod = internalMutation({
  args: { period: v.string() },
  handler: async (ctx, args) => {
    // Garbage-collect usage rows older than 12 months
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 12);
    const cutoffPeriod = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, "0")}`;

    const oldUsage = await ctx.db
      .query("usage")
      .filter((q) => q.lt(q.field("period"), cutoffPeriod))
      .collect();

    for (const u of oldUsage) {
      await ctx.db.delete(u._id);
    }

    // Zero this month's counters for every doctor
    const doctors = await ctx.db.query("doctors").collect();
    for (const doctor of doctors) {
      const existing = await ctx.db
        .query("usage")
        .withIndex("by_doctorId_period", (q) =>
          q.eq("doctorId", doctor._id).eq("period", args.period)
        )
        .first();

      const now = Date.now();
      if (existing) {
        await ctx.db.patch(existing._id, {
          aiCreditsUsed: 0,
          packCreditsRemaining: 0,
          whatsappTrialUsed: 0,
          whatsappMessagesUsed: 0,
          telehealthMinutesUsed: 0,
          updatedAt: now,
        });
      }
    }
  },
});

// Credit a doctor's pack balance after a successful pack purchase.
// Called from the Stripe webhook (one-time payment mode).
export const creditPackBalance = internalMutation({
  args: {
    doctorId: v.id("doctors"),
    credits: v.number(),
  },
  handler: async (ctx, args) => {
    const period = getCurrentPeriod();
    const now = Date.now();

    const existing = await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", args.doctorId).eq("period", period)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        packCreditsRemaining: (existing.packCreditsRemaining || 0) + args.credits,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("usage", {
        doctorId: args.doctorId,
        period,
        aiCreditsUsed: 0,
        packCreditsRemaining: args.credits,
        whatsappTrialUsed: 0,
        whatsappMessagesUsed: 0,
        telehealthMinutesUsed: 0,
        storageUsedBytes: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Adjust a doctor's running storage total. Positive `deltaBytes` on upload,
// negative on delete. Callers must ensure deltas are signed correctly.
export const adjustStorageUsage = internalMutation({
  args: {
    doctorId: v.id("doctors"),
    deltaBytes: v.number(),
  },
  handler: async (ctx, args) => {
    const period = getCurrentPeriod();
    const now = Date.now();

    const existing = await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", args.doctorId).eq("period", period)
      )
      .first();

    if (existing) {
      const current = existing.storageUsedBytes || 0;
      await ctx.db.patch(existing._id, {
        storageUsedBytes: Math.max(0, current + args.deltaBytes),
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("usage", {
        doctorId: args.doctorId,
        period,
        aiCreditsUsed: 0,
        packCreditsRemaining: 0,
        whatsappTrialUsed: 0,
        whatsappMessagesUsed: 0,
        telehealthMinutesUsed: 0,
        storageUsedBytes: Math.max(0, args.deltaBytes),
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Increment telehealth minutes counter (called on session end).
export const addTelehealthMinutes = internalMutation({
  args: {
    doctorId: v.id("doctors"),
    minutes: v.number(),
  },
  handler: async (ctx, args) => {
    const period = getCurrentPeriod();
    const now = Date.now();

    const existing = await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", args.doctorId).eq("period", period)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        telehealthMinutesUsed: (existing.telehealthMinutesUsed || 0) + args.minutes,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("usage", {
        doctorId: args.doctorId,
        period,
        aiCreditsUsed: 0,
        packCreditsRemaining: 0,
        whatsappTrialUsed: 0,
        whatsappMessagesUsed: 0,
        telehealthMinutesUsed: args.minutes,
        storageUsedBytes: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Increment WhatsApp trial counter (essentials only) or WhatsApp sub-cap
// counter (pro/complete). Called from the WhatsApp webhook handler.
export const incrementWhatsappCounter = internalMutation({
  args: {
    doctorId: v.id("doctors"),
    field: v.union(v.literal("trial"), v.literal("message")),
  },
  handler: async (ctx, args) => {
    const period = getCurrentPeriod();
    const now = Date.now();

    const existing = await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", args.doctorId).eq("period", period)
      )
      .first();

    if (existing) {
      if (args.field === "trial") {
        await ctx.db.patch(existing._id, {
          whatsappTrialUsed: (existing.whatsappTrialUsed || 0) + 1,
          updatedAt: now,
        });
      } else {
        await ctx.db.patch(existing._id, {
          whatsappMessagesUsed: (existing.whatsappMessagesUsed || 0) + 1,
          updatedAt: now,
        });
      }
    } else {
      await ctx.db.insert("usage", {
        doctorId: args.doctorId,
        period,
        aiCreditsUsed: 0,
        packCreditsRemaining: 0,
        whatsappTrialUsed: args.field === "trial" ? 1 : 0,
        whatsappMessagesUsed: args.field === "message" ? 1 : 0,
        telehealthMinutesUsed: 0,
        storageUsedBytes: 0,
        createdAt: now,
        updatedAt: now,
      });
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
