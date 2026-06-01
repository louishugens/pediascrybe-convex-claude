import { query, mutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { verifyDoctorOwnsAppointment } from "./authHelpers";
import { Id } from "./_generated/dataModel";

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Apply a positive or negative delta to the doctor's current-period storage usage.
async function adjustStorageBytes(
  ctx: MutationCtx,
  doctorId: Id<"doctors">,
  delta: number,
) {
  if (!delta) return;
  const period = getCurrentPeriod();
  const now = Date.now();
  const usage = await ctx.db
    .query("usage")
    .withIndex("by_doctorId_period", (q) =>
      q.eq("doctorId", doctorId).eq("period", period),
    )
    .first();

  if (usage) {
    await ctx.db.patch(usage._id, {
      storageUsedBytes: Math.max(0, (usage.storageUsedBytes || 0) + delta),
      updatedAt: now,
    });
  } else if (delta > 0) {
    await ctx.db.insert("usage", {
      doctorId,
      period,
      aiCreditsUsed: 0,
      packCreditsRemaining: 0,
      whatsappTrialUsed: 0,
      whatsappMessagesUsed: 0,
      telehealthMinutesUsed: 0,
      storageUsedBytes: delta,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// Get all files for an appointment
export const listByAppointment = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsAppointment(ctx, args.appointmentId);
    return await ctx.db
      .query("files")
      .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
      .collect();
  },
});

// Get file by ID
export const getById = query({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) return null;
    await verifyDoctorOwnsAppointment(ctx, file.appointmentId);
    return file;
  },
});

// Create file record
export const create = mutation({
  args: {
    appointmentId: v.id("appointments"),
    url: v.string(),
    name: v.string(),
    fileType: v.union(v.literal("IMAGE"), v.literal("PDF"), v.literal("VIDEO")),
    sizeBytes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsAppointment(ctx, args.appointmentId);

    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) throw new Error("Appointment not found");

    // Enforce storage cap if we know the size
    if (args.sizeBytes && args.sizeBytes > 0) {
      const subscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_doctorId", (q) => q.eq("doctorId", appointment.doctorId))
        .order("desc")
        .first();

      let capBytes = 0;
      if (subscription && ["trialing", "active"].includes(subscription.status)) {
        const tierName = subscription.tierName || subscription.metadata?.tierName;
        if (tierName) {
          const tier = await ctx.db
            .query("subscriptionTiers")
            .withIndex("by_name", (q) => q.eq("name", tierName))
            .first();
          if (tier) capBytes = tier.limits.fileStorageMB * 1024 * 1024;
        }
      }

      const period = getCurrentPeriod();
      const usage = await ctx.db
        .query("usage")
        .withIndex("by_doctorId_period", (q) =>
          q.eq("doctorId", appointment.doctorId).eq("period", period),
        )
        .first();
      const currentBytes = usage?.storageUsedBytes || 0;

      if (currentBytes + args.sizeBytes > capBytes) {
        throw new Error(
          `STORAGE_LIMIT_REACHED:Uploading this file would exceed your plan's storage cap (${Math.floor(capBytes / (1024 * 1024))} MB). Upgrade or delete files to free space.`,
        );
      }
    }

    const fileId = await ctx.db.insert("files", args);
    if (args.sizeBytes) {
      await adjustStorageBytes(ctx, appointment.doctorId, args.sizeBytes);
    }
    return fileId;
  },
});

// Delete file record
export const remove = mutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");
    await verifyDoctorOwnsAppointment(ctx, file.appointmentId);

    const appointment = await ctx.db.get(file.appointmentId);
    await ctx.db.delete(args.fileId);

    if (appointment && file.sizeBytes) {
      await adjustStorageBytes(ctx, appointment.doctorId, -file.sizeBytes);
    }
  },
});

// Alias functions for API compatibility
export const getFile = getById;
export const createFile = create;
export const deleteFile = remove;

