import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * WhatsApp Doctor Preferences
 *
 * Stores and retrieves learned doctor preferences from clinical edits.
 * Used to personalize future clinical proposals.
 */

// ==================== Queries ====================

/**
 * Get top N preferences for a doctor, ordered by confidence.
 */
export const getTopPreferences = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const prefs = await ctx.db
      .query("doctorPreferences")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    // Sort by confidence descending, take top N
    return prefs
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  },
});

/**
 * Get condition-specific preferences for a doctor.
 */
export const getConditionPreferences = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    condition: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("doctorPreferences")
      .withIndex("by_doctorId_condition", (q) =>
        q.eq("doctorId", args.doctorId).eq("condition", args.condition)
      )
      .collect();
  },
});

// ==================== Mutations ====================

/**
 * Add or update a doctor preference rule.
 * If a similar rule exists (same category + condition), update it.
 */
export const upsertPreference = internalMutation({
  args: {
    doctorId: v.id("doctors"),
    category: v.string(),
    condition: v.optional(v.string()),
    rule: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing similar preference
    const existing = await ctx.db
      .query("doctorPreferences")
      .withIndex("by_doctorId_condition", (q) =>
        q.eq("doctorId", args.doctorId).eq("condition", args.condition)
      )
      .filter((q) => q.eq(q.field("category"), args.category))
      .collect();

    // If a matching rule exists, increase confidence
    const match = existing.find(
      (p) => p.rule.toLowerCase().includes(args.rule.toLowerCase().slice(0, 20))
    );

    if (match) {
      await ctx.db.patch(match._id, {
        confidence: Math.min(1, match.confidence + 0.1),
        sourceCount: match.sourceCount + 1,
        lastUsedAt: now,
      });
      return match._id;
    }

    // Check cap (20 per doctor)
    const allPrefs = await ctx.db
      .query("doctorPreferences")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    if (allPrefs.length >= 20) {
      // Evict lowest confidence
      const lowest = allPrefs.sort((a, b) => a.confidence - b.confidence)[0];
      await ctx.db.delete(lowest._id);
    }

    // Insert new preference
    return await ctx.db.insert("doctorPreferences", {
      doctorId: args.doctorId,
      category: args.category,
      condition: args.condition,
      rule: args.rule,
      confidence: 0.3, // Start at moderate confidence
      sourceCount: 1,
      lastUsedAt: now,
      createdAt: now,
    });
  },
});

/**
 * Consolidate duplicate/similar preference rules for all doctors.
 * Merges rules with the same category + condition that have similar text.
 * Called periodically by a cron job.
 */
export const consolidatePreferences = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allPrefs = await ctx.db.query("doctorPreferences").collect();

    // Group by doctorId + category + condition
    const groups = new Map<string, typeof allPrefs>();
    for (const pref of allPrefs) {
      const key = `${pref.doctorId}::${pref.category}::${pref.condition ?? ""}`;
      const group = groups.get(key) || [];
      group.push(pref);
      groups.set(key, group);
    }

    let consolidated = 0;
    for (const [, group] of groups) {
      if (group.length <= 1) continue;

      // Sort by confidence desc — keep the highest, merge sourceCount
      group.sort((a, b) => b.confidence - a.confidence);
      const keep = group[0];
      for (let i = 1; i < group.length; i++) {
        const dup = group[i];
        // Check if rules are similar (first 20 chars match)
        if (keep.rule.toLowerCase().slice(0, 20) === dup.rule.toLowerCase().slice(0, 20)) {
          await ctx.db.patch(keep._id, {
            confidence: Math.min(1, keep.confidence + dup.confidence * 0.5),
            sourceCount: keep.sourceCount + dup.sourceCount,
          });
          await ctx.db.delete(dup._id);
          consolidated++;
        }
      }
    }

    return { consolidated };
  },
});
