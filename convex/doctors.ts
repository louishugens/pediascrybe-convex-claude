import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedDoctor } from "./authHelpers";

// Get doctor by auth user ID
export const getByAuthUserId = query({
  args: { authUserId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .first();
  },
});

// Get doctor by ID
export const getById = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db.get(args.doctorId);
  },
});

// Get current doctor (for authenticated user)
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    return await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();
  },
});

// Create doctor profile
export const create = mutation({
  args: {
    authUserId: v.string(),
    email: v.string(),
    firstname: v.string(),
    lastname: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    spec: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("doctors", {
      ...args,
      isActive: true,
      isCompleted: false,
      isDoctor: true,
      isMedPro: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update doctor profile
export const update = mutation({
  args: {
    doctorId: v.id("doctors"),
    firstname: v.optional(v.string()),
    lastname: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    spec: v.optional(v.string()),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    experience: v.optional(v.number()),
    cost: v.optional(v.number()),
    duration: v.optional(v.number()),
    availability: v.optional(v.array(v.object({
      day: v.number(),
      startTime: v.string(),
      endTime: v.string(),
    }))),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");

    const { doctorId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    return await ctx.db.patch(doctorId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Get doctor with services (for profile page)
export const getDoctorWithDetails = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();
    
    if (!doctor) return null;
    
    const services = await ctx.db
      .query("services")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();
    
    return { ...doctor, services };
  },
});

// Alias functions for API compatibility
export const getDoctor = getCurrent;
export const getDoctorByAuthUserId = getByAuthUserId;
export const updateDoctor = update;
export const createDoctor = create;

