import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { verifyDoctorOwnsAppointment } from "./authHelpers";

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
  },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsAppointment(ctx, args.appointmentId);
    return await ctx.db.insert("files", args);
  },
});

// Delete file record
export const remove = mutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");
    await verifyDoctorOwnsAppointment(ctx, file.appointmentId);
    await ctx.db.delete(args.fileId);
  },
});

// Alias functions for API compatibility
export const getFile = getById;
export const createFile = create;
export const deleteFile = remove;

