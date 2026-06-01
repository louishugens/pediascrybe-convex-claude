import { query, mutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { verifyDoctorOwnsPatient, verifyDoctorOwnsAppointment } from "./authHelpers";
import { Id } from "./_generated/dataModel";

// Essentials tier can only view/print receipts — not manually create or edit.
// Receipts still flow in automatically via appointment sync. Other tiers pass.
async function assertCanManageReceipts(ctx: MutationCtx, patientId: Id<"patients">) {
  const patient = await ctx.db.get(patientId);
  if (!patient) return;

  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_doctorId", (q) => q.eq("doctorId", patient.doctorId))
    .order("desc")
    .first();

  const tierName = subscription?.tierName || subscription?.metadata?.tierName;
  if (tierName === "essentials") {
    throw new Error(
      "RECEIPT_TIER_LOCKED:Manual receipt management is available on Professional and above. Upgrade to create or edit receipts.",
    );
  }
}

// Get all receipts for a patient
export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);
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
    if (receipt) await verifyDoctorOwnsPatient(ctx, receipt.patientId);

    const patient = await ctx.db.get(receipt.patientId);
    return { ...receipt, patient };
  },
});

// Create receipt
export const create = mutation({
  args: {
    patientId: v.id("patients"),
    services: v.optional(v.array(v.object({
      service: v.string(),
      name: v.optional(v.string()),
      quantity: v.optional(v.number()),
      price: v.optional(v.number()),
    }))),
    cost: v.optional(v.number()),
    currency: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);
    await assertCanManageReceipts(ctx, args.patientId);
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
    services: v.optional(v.array(v.object({
      service: v.string(),
      name: v.optional(v.string()),
      quantity: v.optional(v.number()),
      price: v.optional(v.number()),
    }))),
    cost: v.optional(v.number()),
    currency: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { receiptId, ...updates } = args;

    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) throw new Error("Receipt not found");
    await verifyDoctorOwnsPatient(ctx, receipt.patientId);
    await assertCanManageReceipts(ctx, receipt.patientId);

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
    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) throw new Error("Receipt not found");
    await verifyDoctorOwnsPatient(ctx, receipt.patientId);
    await assertCanManageReceipts(ctx, receipt.patientId);
    await ctx.db.delete(args.receiptId);
  },
});

// Alias functions for API compatibility
export const getReceipt = getById;
export const createReceipt = create;
export const updateReceipt = update;
export const deleteReceipt = remove;

