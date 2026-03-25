/**
 * Clinical Decision Log — Queries & Mutations
 *
 * Audit log for all clinical proposals (diagnosis, medication, lab exams).
 * Stores the proposed, final (after edits), and outcome for each decision.
 */
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ==================== Mutations ====================

/**
 * Log a clinical decision (after doctor confirms/edits/rejects).
 */
export const logDecision = internalMutation({
  args: {
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
    appointmentId: v.optional(v.id("appointments")),
    decisionType: v.string(),
    proposed: v.string(),
    final: v.string(),
    edits: v.optional(v.string()),
    outcome: v.string(),
    conditionTags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("clinicalDecisionLog", {
      ...args,
      createdAt: Date.now(),
    });

    // Schedule embedding generation in background
    await ctx.scheduler.runAfter(0, internal.whatsappDecisionLogActions.generateDecisionEmbedding, {
      decisionId: id,
    });

    return id;
  },
});

// ==================== Queries ====================

/**
 * Get recent decisions for a doctor (for audit/review).
 */
export const getRecentDecisions = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clinicalDecisionLog")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .take(args.limit || 20);
  },
});

/**
 * Search for similar past decisions by doctor and condition.
 */
export const searchSimilarDecisions = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("clinicalDecisionLog")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .collect();

    return results
      .filter((r) => r.outcome === "approved" || r.outcome === "edited")
      .slice(0, args.limit || 2);
  },
});

export const getDecisionById = internalQuery({
  args: { decisionId: v.id("clinicalDecisionLog") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.decisionId);
  },
});

export const updateDecisionEmbedding = internalMutation({
  args: {
    decisionId: v.id("clinicalDecisionLog"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.decisionId, { embedding: args.embedding });
  },
});
