/**
 * One-shot cleanup: remove duplicate doctor rows for a given email, keeping only
 * the canonical one. Run AFTER reparentPatients so no rows still reference the stale ids.
 *
 * Run: npx convex run cleanupDuplicateDoctors:run
 */
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const EMAIL = "louishugens@gmail.com";
const KEEP_DOCTOR = "jn721ajrf2nj3vqad0anhf4v6h83g2fa" as Id<"doctors">;

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("doctors")
      .withIndex("by_email", (q) => q.eq("email", EMAIL))
      .collect();

    const deleted: string[] = [];
    for (const d of all) {
      if (d._id === KEEP_DOCTOR) continue;
      await ctx.db.delete(d._id);
      deleted.push(d._id);
    }
    return { kept: KEEP_DOCTOR, deleted };
  },
});
