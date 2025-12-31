import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all reports for a patient
export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

// Get report by ID
export const getById = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) return null;
    
    const patient = await ctx.db.get(report.patientId);
    return { ...report, patient };
  },
});

// Create report
export const create = mutation({
  args: {
    patientId: v.id("patients"),
    reportType: v.union(v.literal("Report"), v.literal("Certificate"), v.literal("ReferenceNote")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reports", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Update report
export const update = mutation({
  args: {
    reportId: v.id("reports"),
    reportType: v.optional(v.union(v.literal("Report"), v.literal("Certificate"), v.literal("ReferenceNote"))),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { reportId, ...updates } = args;
    
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    return await ctx.db.patch(reportId, filteredUpdates);
  },
});

// Delete report
export const remove = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.reportId);
  },
});

// Alias functions for API compatibility
export const getReport = getById;
export const createReport = create;
export const updateReport = update;
export const deleteReport = remove;

