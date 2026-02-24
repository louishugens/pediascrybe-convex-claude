import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedDoctor, verifyDoctorOwnsPatient } from "./authHelpers";

// Get all patients for a doctor
export const list = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    return await ctx.db
      .query("patients")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .collect();
  },
});

// Get patients with search
export const listWithSearch = query({
  args: { 
    doctorId: v.id("doctors"),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    if (args.search && args.search.length > 0) {
      // Use search index for text search
      const searchResults = await ctx.db
        .query("patients")
        .withSearchIndex("search_patients", (q) => 
          q.search("firstname", args.search!).eq("doctorId", args.doctorId)
        )
        .collect();
      
      // Also search by lastname manually since search index is on firstname
      const allPatients = await ctx.db
        .query("patients")
        .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
        .collect();
      
      const searchLower = args.search.toLowerCase();
      const filteredByLastname = allPatients.filter(p => 
        p.lastname.toLowerCase().includes(searchLower) ||
        p.firstname.toLowerCase().includes(searchLower) ||
        (p.email && p.email.toLowerCase().includes(searchLower))
      );
      
      // Combine and dedupe results
      const seen = new Set<string>();
      const combined = [...searchResults, ...filteredByLastname].filter(p => {
        if (seen.has(p._id)) return false;
        seen.add(p._id);
        return true;
      });
      
      return combined;
    }
    
    return await ctx.db
      .query("patients")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .collect();
  },
});

// Get recent patients (last 30 days)
export const listRecent = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .collect();
    
    return patients.filter(p => p.createdAt >= thirtyDaysAgo);
  },
});

// Get patient by ID
export const getById = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);
    return await ctx.db.get(args.patientId);
  },
});

// Get patient with appointments
export const getWithAppointments = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);
    const patient = await ctx.db.get(args.patientId);
    if (!patient) return null;
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId_startDate", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(10);
    
    return { ...patient, appointments };
  },
});

// Get patient count for doctor
export const count = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();
    return patients.length;
  },
});

// Create patient (with subscription limit check)
export const create = mutation({
  args: {
    doctorId: v.id("doctors"),
    firstname: v.string(),
    lastname: v.string(),
    birthdate: v.number(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    sex: v.optional(v.union(v.literal("male"), v.literal("female"))),
    mothername: v.optional(v.string()),
    profession: v.optional(v.string()),
    religion: v.optional(v.string()),
    allergies: v.optional(v.string()),
    history: v.optional(v.string()),
    bloodtype: v.optional(v.string()),
    electrophoresis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");

    // Validate birthdate is reasonable
    const now = Date.now();
    if (args.birthdate > now) {
      throw new Error("Birthdate cannot be in the future");
    }
    const maxAge = 150 * 365 * 24 * 60 * 60 * 1000; // ~150 years
    if (args.birthdate < now - maxAge) {
      throw new Error("Birthdate is too far in the past");
    }

    // Get current patient count
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();
    const currentCount = patients.length;

    // Get subscription to determine limit
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .first();

    let patientLimit = 10; // Free tier limit

    if (subscription) {
      const activeStatuses = ["trialing", "active"];
      if (activeStatuses.includes(subscription.status)) {
        // Use tierName directly from subscription
        const tierName = subscription.tierName || subscription.metadata?.tierName;
        if (tierName) {
          const tier = await ctx.db
            .query("subscriptionTiers")
            .withIndex("by_name", (q) => q.eq("name", tierName))
            .first();

          if (tier) {
            patientLimit = tier.limits.patientCount;
          }
        }
      }
    }

    // Check limit (-1 means unlimited)
    if (patientLimit !== -1 && currentCount >= patientLimit) {
      throw new Error(
        `Patient limit reached (${patientLimit}). Please upgrade your subscription to add more patients.`
      );
    }

    const createdAt = Date.now();
    return await ctx.db.insert("patients", {
      ...args,
      isCompleted: false,
      createdAt,
      updatedAt: createdAt,
    });
  },
});

// Update patient
export const update = mutation({
  args: {
    patientId: v.id("patients"),
    firstname: v.optional(v.string()),
    lastname: v.optional(v.string()),
    birthdate: v.optional(v.number()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    sex: v.optional(v.union(v.literal("male"), v.literal("female"))),
    mothername: v.optional(v.string()),
    profession: v.optional(v.string()),
    religion: v.optional(v.string()),
    allergies: v.optional(v.string()),
    history: v.optional(v.string()),
    bloodtype: v.optional(v.string()),
    electrophoresis: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);
    const { patientId, ...updates } = args;
    
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    return await ctx.db.patch(patientId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

// Get patients with vaccination records
export const getPatientsWithVaccinationRecords = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    // Get vaccination records for each patient
    const patientsWithRecords = await Promise.all(
      patients.map(async (patient) => {
        const vaccinationRecords = await ctx.db
          .query("vaccinationRecords")
          .withIndex("by_patientId", (q) => q.eq("patientId", patient._id))
          .collect();
        return { ...patient, vaccinationRecords };
      })
    );
    
    return patientsWithRecords;
  },
});

// Delete patient
export const remove = mutation({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);
    // Delete related records first
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();
    
    for (const apt of appointments) {
      // Delete files for each appointment
      const files = await ctx.db
        .query("files")
        .withIndex("by_appointmentId", (q) => q.eq("appointmentId", apt._id))
        .collect();
      for (const file of files) {
        await ctx.db.delete(file._id);
      }
      await ctx.db.delete(apt._id);
    }
    
    // Delete vaccination records
    const vaccRecords = await ctx.db
      .query("vaccinationRecords")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();
    for (const record of vaccRecords) {
      await ctx.db.delete(record._id);
    }
    
    // Delete reports
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();
    for (const report of reports) {
      await ctx.db.delete(report._id);
    }
    
    // Delete receipts
    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();
    for (const receipt of receipts) {
      await ctx.db.delete(receipt._id);
    }
    
    // Finally delete patient
    await ctx.db.delete(args.patientId);
  },
});

// Alias functions for API compatibility
export const getPatient = getById;
export const getPatients = list;
export const getPatientsWithSearch = listWithSearch;
export const getRecentPatients = listRecent;
export const getPatientWithAppointments = getWithAppointments;
export const createPatient = create;
export const updatePatient = update;
export const deletePatient = remove;

