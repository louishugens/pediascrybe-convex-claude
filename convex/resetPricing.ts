"use node";

import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import Stripe from "stripe";

// ==================== Stripe archive ====================
// Archives every Stripe product + price in the account. Safe because archived
// resources stay visible in the dashboard and existing subscriptions keep
// working — only new checkouts can't reference them.
export const archiveAllStripeProducts = internalAction({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<{ archivedProducts: number; archivedPrices: number }> => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(key);

    let archivedProducts = 0;
    let archivedPrices = 0;

    let productCursor: string | undefined = undefined;
    while (true) {
      const page: Stripe.ApiList<Stripe.Product> = await stripe.products.list({
        limit: 100,
        active: true,
        starting_after: productCursor,
      });

      for (const product of page.data) {
        let priceCursor: string | undefined = undefined;
        while (true) {
          const prices: Stripe.ApiList<Stripe.Price> = await stripe.prices.list({
            product: product.id,
            limit: 100,
            active: true,
            starting_after: priceCursor,
          });
          for (const price of prices.data) {
            if (!args.dryRun) {
              await stripe.prices.update(price.id, { active: false });
            }
            archivedPrices += 1;
          }
          if (!prices.has_more) break;
          priceCursor = prices.data[prices.data.length - 1]?.id;
        }

        if (!args.dryRun) {
          await stripe.products.update(product.id, { active: false });
        }
        archivedProducts += 1;
      }

      if (!page.has_more) break;
      productCursor = page.data[page.data.length - 1]?.id;
    }

    return { archivedProducts, archivedPrices };
  },
});

// ==================== Create AI credit pack prices ====================
// Creates one-time-payment Stripe prices for the three AI credit packs
// ($5 / $20 / $35 → 100 / 500 / 1000 credits). Returns the IDs so they can
// be pasted into env vars (STRIPE_PACK_SMALL_PRICE_ID etc).
export const seedStripePackProducts = internalAction({
  args: {},
  handler: async (ctx): Promise<Array<{
    packId: string;
    productId: string;
    priceId: string;
    credits: number;
    amountCents: number;
  }>> => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(key);

    const packs = [
      { packId: "small",  name: "AI Credit Pack — Small",  credits: 100,  amountCents: 500  },
      { packId: "medium", name: "AI Credit Pack — Medium", credits: 500,  amountCents: 2000 },
      { packId: "large",  name: "AI Credit Pack — Large",  credits: 1000, amountCents: 3500 },
    ];

    const results: Array<{
      packId: string;
      productId: string;
      priceId: string;
      credits: number;
      amountCents: number;
    }> = [];

    for (const pack of packs) {
      const product = await stripe.products.create({
        name: pack.name,
        description: `${pack.credits} AI credits — one-time top-up`,
        metadata: { kind: "ai_credit_pack", packId: pack.packId, credits: String(pack.credits) },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.amountCents,
        currency: "usd",
        metadata: { kind: "ai_credit_pack", packId: pack.packId, credits: String(pack.credits) },
      });
      results.push({
        packId: pack.packId,
        productId: product.id,
        priceId: price.id,
        credits: pack.credits,
        amountCents: pack.amountCents,
      });
    }

    return results;
  },
});

// ==================== Create Scrybe Assist subscription product ====================
// Creates the parent-facing Scrybe Assist subscription product ($6.99/mo).
// Returns the price ID — set it on the Convex env var PATIENT_STRIPE_PRICE_ID.
export const seedStripeScrybeAssist = internalAction({
  args: {},
  handler: async (ctx): Promise<{ productId: string; priceId: string }> => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(key);

    const product = await stripe.products.create({
      name: "Scrybe Assist Premium",
      description: "AI assistant for parents — 50 explanations/month",
      metadata: { kind: "scrybe_assist", plan: "premium" },
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 699,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { kind: "scrybe_assist", plan: "premium" },
    });

    return { productId: product.id, priceId: price.id };
  },
});

// ==================== Orchestrator ====================
// One-shot: wipe Convex tables → archive all Stripe products → re-seed tier rows
// → create fresh Stripe subscription products + AI pack products.
// Run from the Convex dashboard: Functions → resetPricing:resetAndSeed.
export const resetAndSeed = internalAction({
  args: { archiveStripe: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<{
    wiped: Record<string, number>;
    archived: { archivedProducts: number; archivedPrices: number } | null;
    seededTiers: unknown;
    seededStripeTiers: unknown;
    seededPackPrices: unknown;
  }> => {
    const wiped = await ctx.runMutation(internal.seed.wipeSubscriptionTables, {});

    const archived = args.archiveStripe
      ? await ctx.runAction(internal.resetPricing.archiveAllStripeProducts, {})
      : null;

    const seededTiers = await ctx.runMutation(api.seed.seedSubscriptionTiers, {});
    const seededStripeTiers = await ctx.runAction(internal.stripe.seedStripeProducts, {});
    const seededPackPrices = await ctx.runAction(internal.resetPricing.seedStripePackProducts, {});

    return { wiped, archived, seededTiers, seededStripeTiers, seededPackPrices };
  },
});
