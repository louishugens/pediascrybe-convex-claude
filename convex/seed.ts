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

