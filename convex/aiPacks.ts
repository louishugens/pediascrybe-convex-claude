import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { StripeSubscriptions } from "@convex-dev/stripe";

const stripeClient = new StripeSubscriptions(components.stripe, {});

// Credit pack catalog. Price IDs come from env so we can swap test/live cleanly.
export const AI_PACKS = {
  small: {
    id: "small",
    credits: 100,
    priceCents: 500, // $5
    label: "Small pack",
    description: "100 AI credits",
    envKey: "STRIPE_PACK_SMALL_PRICE_ID",
  },
  medium: {
    id: "medium",
    credits: 500,
    priceCents: 2000, // $20
    label: "Medium pack",
    description: "500 AI credits",
    envKey: "STRIPE_PACK_MEDIUM_PRICE_ID",
  },
  large: {
    id: "large",
    credits: 1000,
    priceCents: 3500, // $35
    label: "Large pack",
    description: "1,000 AI credits",
    envKey: "STRIPE_PACK_LARGE_PRICE_ID",
  },
} as const;

export type PackId = keyof typeof AI_PACKS;

function getPackPriceId(packId: PackId): string {
  const pack = AI_PACKS[packId];
  const priceId = process.env[pack.envKey];
  if (!priceId) {
    throw new Error(
      `Missing ${pack.envKey} env var — create the Stripe price and set it.`,
    );
  }
  return priceId;
}

// Kick off a one-time Stripe Checkout session for a credit pack.
// Metadata is the contract the webhook uses to credit the right doctor.
export const createPackCheckout = action({
  args: {
    packId: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
  },
  returns: v.object({
    sessionId: v.string(),
    url: v.union(v.string(), v.null()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ sessionId: string; url: string | null }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const pack = AI_PACKS[args.packId];
    const priceId = getPackPriceId(args.packId);
    const siteUrl = process.env.SITE_URL || "http://localhost:3000";

    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: identity.subject,
      email: identity.email,
      name: identity.name,
    });

    return await stripeClient.createCheckoutSession(ctx, {
      priceId,
      customerId: customer.customerId,
      mode: "payment",
      successUrl: `${siteUrl}/user/settings/subscription?pack=success`,
      cancelUrl: `${siteUrl}/user/settings/subscription?pack=canceled`,
      paymentIntentMetadata: {
        authUserId: identity.subject,
        packId: pack.id,
        credits: String(pack.credits),
        kind: "ai_credit_pack",
      },
    });
  },
});

// Webhook handler — called from the Stripe http route when a pack checkout
// session completes. Credits the doctor's pack balance.
export const applyPackCredits = internalMutation({
  args: {
    authUserId: v.string(),
    credits: v.number(),
  },
  handler: async (ctx, args) => {
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();

    if (!doctor) {
      console.error(
        `[aiPacks] applyPackCredits: no doctor for authUserId ${args.authUserId}`,
      );
      return;
    }

    const now = Date.now();
    const period = `${new Date(now).getFullYear()}-${String(new Date(now).getMonth() + 1).padStart(2, "0")}`;

    const existing = await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", doctor._id).eq("period", period),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        packCreditsRemaining: (existing.packCreditsRemaining || 0) + args.credits,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("usage", {
        doctorId: doctor._id,
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
