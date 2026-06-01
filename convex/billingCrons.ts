import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import Stripe from "stripe";

// Runs on the 1st of every month — pushes telehealth overage charges as
// one-time invoice items on each Complete-tier doctor's Stripe subscription.
// Overage is billed at the tier's telehealthOverageRate (e.g. $0.08/min beyond 120).
export const billTelehealthOverages = internalAction({
  args: {},
  handler: async (ctx): Promise<{ invoiced: number; totalCents: number }> => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("[billing] STRIPE_SECRET_KEY missing — skipping overage run");
      return { invoiced: 0, totalCents: 0 };
    }
    const stripe = new Stripe(key);

    // We bill for the period that just ended — previous calendar month.
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevPeriod = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

    const rows: Array<{
      doctorId: string;
      subscriptionId: string;
      stripeCustomerId: string;
      minutesOver: number;
      rateCents: number;
    }> = await ctx.runQuery(internal.billingCrons.listOverageCandidates, {
      period: prevPeriod,
    });

    let invoiced = 0;
    let totalCents = 0;

    for (const row of rows) {
      const amountCents = row.minutesOver * row.rateCents;
      if (amountCents <= 0) continue;

      try {
        await stripe.invoiceItems.create({
          customer: row.stripeCustomerId,
          amount: amountCents,
          currency: "usd",
          description: `Telehealth overage — ${row.minutesOver} min beyond included minutes (${prevPeriod})`,
          subscription: row.subscriptionId,
        });
        invoiced += 1;
        totalCents += amountCents;
      } catch (err) {
        console.error(
          `[billing] Failed to invoice overage for doctor ${row.doctorId}:`,
          err,
        );
      }
    }

    return { invoiced, totalCents };
  },
});

// Look up all doctors whose telehealth minutes exceeded their tier cap
// in the given period, and resolve the Stripe IDs needed to invoice them.
export const listOverageCandidates = internalQuery({
  args: { period: v.string() },
  handler: async (ctx, args) => {
    const usageRows = await ctx.db
      .query("usage")
      .filter((q) => q.eq(q.field("period"), args.period))
      .collect();

    const results: Array<{
      doctorId: string;
      subscriptionId: string;
      stripeCustomerId: string;
      minutesOver: number;
      rateCents: number;
    }> = [];

    for (const row of usageRows) {
      const minutes = row.telehealthMinutesUsed || 0;
      if (minutes <= 0) continue;

      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_doctorId", (q) => q.eq("doctorId", row.doctorId))
        .order("desc")
        .first();
      if (!subscription) continue;
      if (!["trialing", "active"].includes(subscription.status)) continue;

      const tierName = subscription.tierName || subscription.metadata?.tierName;
      if (!tierName) continue;

      const tier = await ctx.db
        .query("subscriptionTiers")
        .withIndex("by_name", (q) => q.eq("name", tierName))
        .first();
      if (!tier) continue;

      const cap = tier.limits.telehealthMinutes;
      if (cap <= 0) continue;

      const over = minutes - cap;
      if (over <= 0) continue;

      const doctor = await ctx.db.get(row.doctorId);
      if (!doctor) continue;

      const appUser = await ctx.db
        .query("appUsers")
        .withIndex("by_authUserId", (q) =>
          q.eq("authUserId", (doctor as any).authUserId),
        )
        .first();
      if (!appUser?.stripeCustomerId) continue;
      if (!subscription.stripeId) continue;

      // telehealthOverageRate is in dollars per minute (e.g. 0.08) — convert to cents.
      const rateCents = Math.round((tier.limits.telehealthOverageRate || 0) * 100);
      if (rateCents <= 0) continue;

      results.push({
        doctorId: row.doctorId,
        subscriptionId: subscription.stripeId,
        stripeCustomerId: appUser.stripeCustomerId,
        minutesOver: over,
        rateCents,
      });
    }

    return results;
  },
});
