import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all services for a doctor
export const list = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("services")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();
  },
});

// Get service by ID
export const getById = query({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.serviceId);
  },
});

// Get primary currency for a doctor
export const getPrimaryCurrency = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const service = await ctx.db
      .query("services")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .first();
    
    return service?.currency || "HTG";
  },
});

// Create service
export const create = mutation({
  args: {
    doctorId: v.id("doctors"),
    name: v.string(),
    price: v.number(),
    currency: v.string(),
    type: v.union(v.literal("clinical"), v.literal("documentation")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("services", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update service
export const update = mutation({
  args: {
    serviceId: v.id("services"),
    name: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    type: v.optional(v.union(v.literal("clinical"), v.literal("documentation"))),
  },
  handler: async (ctx, args) => {
    const { serviceId, ...updates } = args;
    
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    return await ctx.db.patch(serviceId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Delete service
export const remove = mutation({
  args: { serviceId: v.id("services") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.serviceId);
  },
});

// ==================== Alias functions ====================
export const getServicesByDoctorId = list;
export const createService = create;
export const updateService = update;
export const deleteService = remove;

