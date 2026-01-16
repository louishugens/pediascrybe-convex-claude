import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed chart reference data
export const seedChart = mutation({
  args: {
    chartId: v.string(),
    p03: v.any(),
    p15: v.any(),
    p50: v.any(),
    p85: v.any(),
    p97: v.any(),
    height: v.optional(v.any()),
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
        name: "starter",
        displayName: "Starter",
        description: "Perfect for new pediatricians and low-volume practices",
        stripePriceId: "price_starter_placeholder", // Replace with real Stripe price ID
        priceAmountCents: 2900, // $29/month
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
        trialPeriodDays: 7,
        sortOrder: 0,
        isPopular: false,
      },
      {
        name: "pro",
        displayName: "Pro",
        description: "For established pediatricians with full AI support",
        stripePriceId: "price_pro_placeholder", // Replace with real Stripe price ID
        priceAmountCents: 4900, // $49/month
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
        trialPeriodDays: 7,
        sortOrder: 1,
        isPopular: true,
      },
      {
        name: "premium",
        displayName: "Premium",
        description: "For high-volume practitioners preparing for growth",
        stripePriceId: "price_premium_placeholder", // Replace with real Stripe price ID
        priceAmountCents: 9900, // $99/month
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
        trialPeriodDays: 7,
        sortOrder: 2,
        isPopular: false,
      },
    ];

    const results: Array<{ name: string; action: string; id: any }> = [];

    for (const tier of tiers) {
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
          limits: tier.limits,
          features: tier.features,
          trialPeriodDays: tier.trialPeriodDays,
          sortOrder: tier.sortOrder,
          isPopular: tier.isPopular,
        });
        results.push({ name: tier.name, action: "updated", id: existing._id });
      } else {
        // Create new tier
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

// Update subscription tier with real Stripe price ID (after running seedStripeProducts)
export const updateTierStripePriceId = mutation({
  args: {
    tierName: v.string(),
    stripePriceId: v.string(),
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
      stripePriceId: args.stripePriceId,
    });

    return { success: true, tierId: tier._id };
  },
});

