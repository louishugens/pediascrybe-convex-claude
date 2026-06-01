import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed chart reference data
export const seedChart = mutation({
  args: {
    chartId: v.string(),
    p03: v.array(v.number()),
    p15: v.array(v.number()),
    p50: v.array(v.number()),
    p85: v.array(v.number()),
    p97: v.array(v.number()),
    height: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    // Check if chart already exists
    const existing = await ctx.db
      .query("charts")
      .withIndex("by_chartId", (q) => q.eq("chartId", args.chartId))
      .first();

    if (existing) {
      // Update existing chart
      await ctx.db.patch(existing._id, {
        p03: args.p03,
        p15: args.p15,
        p50: args.p50,
        p85: args.p85,
        p97: args.p97,
        height: args.height,
      });
      return existing._id;
    }

    // Insert new chart
    return await ctx.db.insert("charts", args);
  },
});

// Seed vaccine reference with doses
export const seedVaccinReference = mutation({
  args: {
    name: v.string(),
    doses: v.array(
      v.object({
        doseType: v.union(
          v.literal("regular"),
          v.literal("annual"),
          v.literal("booster"),
          v.literal("unique")
        ),
        doseCount: v.optional(v.number()),
        maxAge: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if vaccine reference already exists by name
    const existing = await ctx.db
      .query("vaccinReferences")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      // Delete existing doses
      const existingDoses = await ctx.db
        .query("vaccinReferenceDoses")
        .withIndex("by_vaccinReferenceId", (q) =>
          q.eq("vaccinReferenceId", existing._id)
        )
        .collect();

      for (const dose of existingDoses) {
        await ctx.db.delete(dose._id);
      }

      // Create new doses
      for (const dose of args.doses) {
        await ctx.db.insert("vaccinReferenceDoses", {
          vaccinReferenceId: existing._id,
          doseType: dose.doseType,
          doseCount: dose.doseCount,
          maxAge: dose.maxAge,
        });
      }

      return existing._id;
    }

    // Create new vaccine reference
    const vaccinReferenceId = await ctx.db.insert("vaccinReferences", {
      name: args.name,
    });

    // Create doses
    for (const dose of args.doses) {
      await ctx.db.insert("vaccinReferenceDoses", {
        vaccinReferenceId,
        doseType: dose.doseType,
        doseCount: dose.doseCount,
        maxAge: dose.maxAge,
      });
    }

    return vaccinReferenceId;
  },
});

// Clear all reference data (use with caution)
export const clearReferenceData = mutation({
  args: {
    type: v.union(v.literal("charts"), v.literal("vaccines"), v.literal("all")),
  },
  handler: async (ctx, args) => {
    if (args.type === "charts" || args.type === "all") {
      const charts = await ctx.db.query("charts").collect();
      for (const chart of charts) {
        await ctx.db.delete(chart._id);
      }
    }

    if (args.type === "vaccines" || args.type === "all") {
      const doses = await ctx.db.query("vaccinReferenceDoses").collect();
      for (const dose of doses) {
        await ctx.db.delete(dose._id);
      }

      const vaccines = await ctx.db.query("vaccinReferences").collect();
      for (const vaccine of vaccines) {
        await ctx.db.delete(vaccine._id);
      }
    }
  },
});

// Seed subscription tiers (for development/testing without Stripe)
export const seedSubscriptionTiers = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const tiers = [
      {
        name: "essentials",
        displayName: "Essentials",
        description: "For pediatricians starting their digital practice",
        stripeMonthlyPriceId: "price_essentials_monthly_placeholder",
        stripeAnnualPriceId: "price_essentials_annual_placeholder",
        priceAmountCents: 2900, // $29/month
        annualPriceAmountCents: 28800, // $288/year ($24/mo equiv)
        isCustom: false,
        limits: {
          patientCount: 100,
          recordCount: 50,
          aiCredits: 50,
          whatsappTrial: 10,
          whatsappMessages: 0,
          fileStorageMB: 500,
          services: 5,
          staffSeats: 0,
          auditRetentionDays: 30,
          telehealthMinutes: 0,
          telehealthOverageRate: 0,
          patientPortal: false,
          telehealth: false,
          dashboardTier: "basic" as const,
          growthCharts: "all" as const,
        },
        features: [
          "emr",
          "all_growth_charts",
          "billing_receipts",
          "multi_currency",
          "scrybegpt",
          "ai_diagnostic",
          "ai_prescription",
          "ai_lab_exam",
          "ai_report",
          "patient_specific_ai",
          "basic_analytics",
          "pdf_export",
          "email_support",
          "whatsapp_scrybegpt",
        ],
        trialPeriodDays: 7,
        sortOrder: 0,
        isPopular: false,
      },
      {
        name: "professional",
        displayName: "Professional",
        description: "For established solo practitioners",
        stripeMonthlyPriceId: "price_professional_monthly_placeholder",
        stripeAnnualPriceId: "price_professional_annual_placeholder",
        priceAmountCents: 5900, // $59/month
        annualPriceAmountCents: 58800, // $588/year ($49/mo equiv)
        isCustom: false,
        limits: {
          patientCount: 500,
          recordCount: 250,
          aiCredits: 300,
          whatsappTrial: 0,
          whatsappMessages: 300,
          fileStorageMB: 2048,
          services: 50,
          staffSeats: 0,
          auditRetentionDays: 90,
          telehealthMinutes: 0,
          telehealthOverageRate: 0,
          patientPortal: true,
          telehealth: false,
          dashboardTier: "standard" as const,
          growthCharts: "all" as const,
        },
        features: [
          "emr",
          "all_growth_charts",
          "vaccination_management",
          "billing_receipts",
          "multi_currency",
          "scrybegpt",
          "ai_diagnostic",
          "ai_prescription",
          "ai_lab_exam",
          "ai_report",
          "patient_specific_ai",
          "advanced_analytics",
          "pdf_export",
          "email_chat_support",
          "patient_portal",
          "whatsapp_scrybegpt",
        ],
        trialPeriodDays: 7,
        sortOrder: 1,
        isPopular: true,
      },
      {
        name: "complete",
        displayName: "Complete",
        description: "For high-volume practices and clinics",
        stripeMonthlyPriceId: "price_complete_monthly_placeholder",
        stripeAnnualPriceId: "price_complete_annual_placeholder",
        priceAmountCents: 11900, // $119/month
        annualPriceAmountCents: 118800, // $1,188/year ($99/mo equiv)
        isCustom: false,
        limits: {
          patientCount: 1500,
          recordCount: 750,
          aiCredits: 900,
          whatsappTrial: 0,
          whatsappMessages: 900,
          fileStorageMB: 10240,
          services: 200,
          staffSeats: 3,
          auditRetentionDays: 365,
          telehealthMinutes: 120,
          telehealthOverageRate: 0.08,
          patientPortal: true,
          telehealth: true,
          dashboardTier: "full" as const,
          growthCharts: "all" as const,
        },
        features: [
          "emr",
          "all_growth_charts",
          "vaccination_management",
          "billing_receipts",
          "multi_currency",
          "scrybegpt",
          "ai_diagnostic",
          "ai_prescription",
          "ai_lab_exam",
          "ai_report",
          "patient_specific_ai",
          "advanced_analytics",
          "pdf_export",
          "priority_support",
          "telehealth",
          "staff_accounts",
          "patient_portal",
          "whatsapp_scrybegpt",
        ],
        trialPeriodDays: 7,
        sortOrder: 2,
        isPopular: false,
      },
      {
        name: "institution",
        displayName: "Institution",
        description: "For hospitals, NGOs, and health systems",
        stripeMonthlyPriceId: "", // No checkout — contact sales
        stripeAnnualPriceId: undefined,
        priceAmountCents: 0,
        annualPriceAmountCents: undefined,
        isCustom: true,
        limits: {
          patientCount: 999999,
          recordCount: 999999,
          aiCredits: 999999,
          whatsappTrial: 0,
          whatsappMessages: 999999,
          fileStorageMB: 999999,
          services: 999999,
          staffSeats: 999,
          auditRetentionDays: 3650,
          telehealthMinutes: 999999,
          telehealthOverageRate: 0,
          patientPortal: true,
          telehealth: true,
          dashboardTier: "full" as const,
          growthCharts: "all" as const,
        },
        features: [
          "emr",
          "all_growth_charts",
          "vaccination_management",
          "billing_receipts",
          "multi_currency",
          "scrybegpt",
          "ai_diagnostic",
          "ai_prescription",
          "ai_lab_exam",
          "ai_report",
          "patient_specific_ai",
          "advanced_analytics",
          "pdf_export",
          "priority_support",
          "telehealth",
          "staff_accounts",
          "patient_portal",
          "whatsapp_scrybegpt",
        ],
        trialPeriodDays: 0,
        sortOrder: 3,
        isPopular: false,
      },
    ];

    const results: Array<{ name: string; action: string; id: any }> = [];

    for (const tier of tiers) {
      const existing = await ctx.db
        .query("subscriptionTiers")
        .withIndex("by_name", (q) => q.eq("name", tier.name))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          displayName: tier.displayName,
          description: tier.description,
          stripeMonthlyPriceId: tier.stripeMonthlyPriceId,
          stripeAnnualPriceId: tier.stripeAnnualPriceId,
          priceAmountCents: tier.priceAmountCents,
          annualPriceAmountCents: tier.annualPriceAmountCents,
          isCustom: tier.isCustom,
          limits: tier.limits,
          features: tier.features,
          trialPeriodDays: tier.trialPeriodDays,
          sortOrder: tier.sortOrder,
          isPopular: tier.isPopular,
        });
        results.push({ name: tier.name, action: "updated", id: existing._id });
      } else {
        const id = await ctx.db.insert("subscriptionTiers", {
          ...tier,
          createdAt: now,
        });
        results.push({ name: tier.name, action: "created", id });
      }
    }

    return results;
  },
});

// Update subscription tier with real Stripe price IDs (after running seedStripeProducts)
export const updateTierStripePriceIds = mutation({
  args: {
    tierName: v.string(),
    stripeMonthlyPriceId: v.string(),
    stripeAnnualPriceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_name", (q) => q.eq("name", args.tierName))
      .first();

    if (!tier) {
      throw new Error(`Tier "${args.tierName}" not found`);
    }

    await ctx.db.patch(tier._id, {
      stripeMonthlyPriceId: args.stripeMonthlyPriceId,
      stripeAnnualPriceId: args.stripeAnnualPriceId,
    });

    return { success: true, tierId: tier._id };
  },
});

// Wipe every row from subscription-adjacent tables. Used by the pre-launch
// reset flow in `resetPricing.resetAndSeed` — not safe to run in production
// once real doctors have subscribed.
export const wipeSubscriptionTables = internalMutation({
  args: {},
  handler: async (ctx): Promise<Record<string, number>> => {
    const tables = [
      "subscriptionTiers",
      "subscriptions",
      "usage",
      "patientSubscriptions",
      "patientUsage",
      "prices",
      "products",
    ] as const;

    const counts: Record<string, number> = {};
    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
      counts[table] = rows.length;
    }
    return counts;
  },
});

// Internal version of updateTierStripePriceIds — called by seedStripeProducts action
export const updateTierStripePriceIdsInternal = internalMutation({
  args: {
    tierName: v.string(),
    stripeMonthlyPriceId: v.string(),
    stripeAnnualPriceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_name", (q) => q.eq("name", args.tierName))
      .first();

    if (!tier) {
      throw new Error(`Tier "${args.tierName}" not found`);
    }

    await ctx.db.patch(tier._id, {
      stripeMonthlyPriceId: args.stripeMonthlyPriceId,
      stripeAnnualPriceId: args.stripeAnnualPriceId,
    });

    return { success: true, tierId: tier._id };
  },
});
