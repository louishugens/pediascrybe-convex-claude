import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all receipts for a patient
export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("receipts")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

// Get receipt by ID
export const getById = query({
  args: { receiptId: v.id("receipts") },
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) return null;
    
    const patient = await ctx.db.get(receipt.patientId);
    return { ...receipt, patient };
  },
});

// Create receipt
export const create = mutation({
  args: {
    patientId: v.id("patients"),
    services: v.optional(v.any()),
    cost: v.optional(v.number()),
    currency: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("receipts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Update receipt
export const update = mutation({
  args: {
    receiptId: v.id("receipts"),
    services: v.optional(v.any()),
    cost: v.optional(v.number()),
    currency: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { receiptId, ...updates } = args;
    
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    return await ctx.db.patch(receiptId, filteredUpdates);
  },
});

// Delete receipt
export const remove = mutation({
  args: { receiptId: v.id("receipts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.receiptId);
  },
});

// Alias functions for API compatibility
export const getReceipt = getById;
export const createReceipt = create;
export const updateReceipt = update;
export const deleteReceipt = remove;

