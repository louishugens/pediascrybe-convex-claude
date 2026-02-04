import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ==================== Vaccins ====================

// Get all vaccines tracked by a doctor
export const listByDoctor = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const vaccins = await ctx.db
      .query("vaccins")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();
    
    // Get doses for each vaccine
    const vaccinsWithDoses = await Promise.all(
      vaccins.map(async (vaccin) => {
        const doses = await ctx.db
          .query("doses")
          .withIndex("by_vaccinId", (q) => q.eq("vaccinId", vaccin._id))
          .collect();
        return { ...vaccin, doses };
      })
    );
    
    return vaccinsWithDoses;
  },
});

// Create vaccine
export const createVaccin = mutation({
  args: {
    doctorId: v.id("doctors"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vaccins", args);
  },
});

// Delete vaccine
export const removeVaccin = mutation({
  args: { vaccinId: v.id("vaccins") },
  handler: async (ctx, args) => {
    // Delete associated doses
    const doses = await ctx.db
      .query("doses")
      .withIndex("by_vaccinId", (q) => q.eq("vaccinId", args.vaccinId))
      .collect();
    
    for (const dose of doses) {
      await ctx.db.delete(dose._id);
    }
    
    await ctx.db.delete(args.vaccinId);
  },
});

// Create vaccine with doses
export const createVaccine = mutation({
  args: {
    doctorId: v.id("doctors"),
    name: v.string(),
    doses: v.array(v.object({
      doseType: v.union(v.literal("regular"), v.literal("annual"), v.literal("booster"), v.literal("unique")),
      doseCount: v.optional(v.number()),
      maxAge: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Create the vaccine
    const vaccinId = await ctx.db.insert("vaccins", {
      doctorId: args.doctorId,
      name: args.name,
    });
    
    // Create associated doses
    for (const dose of args.doses) {
      await ctx.db.insert("doses", {
        vaccinId,
        doseType: dose.doseType,
        doseCount: dose.doseCount,
        maxAge: dose.maxAge,
      });
    }
    
    return vaccinId;
  },
});

// Update vaccine with doses
export const updateVaccine = mutation({
  args: {
    vaccinId: v.id("vaccins"),
    name: v.string(),
    doses: v.array(v.object({
      doseType: v.union(v.literal("regular"), v.literal("annual"), v.literal("booster"), v.literal("unique")),
      doseCount: v.optional(v.number()),
      maxAge: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Update the vaccine name
    await ctx.db.patch(args.vaccinId, { name: args.name });
    
    // Delete existing doses
    const existingDoses = await ctx.db
      .query("doses")
      .withIndex("by_vaccinId", (q) => q.eq("vaccinId", args.vaccinId))
      .collect();
    
    for (const dose of existingDoses) {
      await ctx.db.delete(dose._id);
    }
    
    // Create new doses
    for (const dose of args.doses) {
      await ctx.db.insert("doses", {
        vaccinId: args.vaccinId,
        doseType: dose.doseType,
        doseCount: dose.doseCount,
        maxAge: dose.maxAge,
      });
    }
    
    return args.vaccinId;
  },
});

// Delete vaccine (alias that checks for vaccination records)
export const deleteVaccine = mutation({
  args: { vaccinId: v.id("vaccins") },
  handler: async (ctx, args) => {
    // Check if there are any vaccination records using this vaccine
    const records = await ctx.db
      .query("vaccinationRecords")
      .withIndex("by_vaccinId", (q) => q.eq("vaccinId", args.vaccinId))
      .first();
    
    if (records) {
      throw new Error("Cannot delete this vaccine as it has associated vaccination records.");
    }
    
    // Delete associated doses
    const doses = await ctx.db
      .query("doses")
      .withIndex("by_vaccinId", (q) => q.eq("vaccinId", args.vaccinId))
      .collect();
    
    for (const dose of doses) {
      await ctx.db.delete(dose._id);
    }
    
    await ctx.db.delete(args.vaccinId);
  },
});

// ==================== Doses ====================

// Create dose for a vaccine
export const createDose = mutation({
  args: {
    vaccinId: v.id("vaccins"),
    doseType: v.union(v.literal("regular"), v.literal("annual"), v.literal("booster"), v.literal("unique")),
    doseCount: v.optional(v.number()),
    maxAge: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("doses", args);
  },
});

// ==================== Vaccination Records ====================

// Get vaccination records for a patient
export const getPatientRecords = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("vaccinationRecords")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
    
    // Enrich with vaccine and dose data
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const [vaccin, dose] = await Promise.all([
          ctx.db.get(record.vaccinId),
          ctx.db.get(record.doseId),
        ]);
        return { ...record, vaccin, dose };
      })
    );
    
    return enrichedRecords;
  },
});

// Get a single vaccination record
export const getRecord = query({
  args: { recordId: v.id("vaccinationRecords") },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.recordId);
    if (!record) return null;
    
    const [vaccin, dose] = await Promise.all([
      ctx.db.get(record.vaccinId),
      ctx.db.get(record.doseId),
    ]);
    
    return { ...record, vaccin, dose };
  },
});

// Create vaccination record
export const createRecord = mutation({
  args: {
    patientId: v.id("patients"),
    vaccinId: v.id("vaccins"),
    doseId: v.id("doses"),
    date: v.number(),
    notes: v.optional(v.string()),
    manufacturer: v.string(),
    lotNumber: v.string(),
    expiration: v.number(),
    dosage: v.string(),
    route: v.string(),
    site: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vaccinationRecords", args);
  },
});

// Update vaccination record
export const updateRecord = mutation({
  args: {
    recordId: v.id("vaccinationRecords"),
    date: v.optional(v.number()),
    notes: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    lotNumber: v.optional(v.string()),
    expiration: v.optional(v.number()),
    dosage: v.optional(v.string()),
    route: v.optional(v.string()),
    site: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { recordId, ...updates } = args;
    
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    return await ctx.db.patch(recordId, filteredUpdates);
  },
});

// Delete vaccination record
export const removeRecord = mutation({
  args: { recordId: v.id("vaccinationRecords") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.recordId);
  },
});

// ==================== Vaccine Compliance ====================

// Get all data needed for patient vaccination compliance calculation
export const getPatientVaccineCompliance = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    if (!patient) throw new Error("Patient not found");

    // Get doctor's tracked vaccines with doses
    const vaccins = await ctx.db
      .query("vaccins")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", patient.doctorId))
      .collect();

    const vaccinesWithDoses = await Promise.all(
      vaccins.map(async (vaccin) => {
        const doses = await ctx.db
          .query("doses")
          .withIndex("by_vaccinId", (q) => q.eq("vaccinId", vaccin._id))
          .collect();
        return { ...vaccin, doses };
      })
    );

    // Get patient's vaccination records
    const records = await ctx.db
      .query("vaccinationRecords")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();

    return {
      patient: {
        _id: patient._id,
        birthdate: patient.birthdate,
        firstname: patient.firstname,
        lastname: patient.lastname,
      },
      vaccines: vaccinesWithDoses,
      records,
    };
  },
});

// ==================== Vaccine References ====================

// Get all vaccine references
export const listReferences = query({
  args: {},
  handler: async (ctx) => {
    const references = await ctx.db.query("vaccinReferences").collect();
    
    const referencesWithDoses = await Promise.all(
      references.map(async (ref) => {
        const doses = await ctx.db
          .query("vaccinReferenceDoses")
          .withIndex("by_vaccinReferenceId", (q) => q.eq("vaccinReferenceId", ref._id))
          .collect();
        return { ...ref, doses };
      })
    );
    
    return referencesWithDoses;
  },
});

// ==================== Alias functions ====================
export const getPatientVaccineRecords = getPatientRecords;
export const getDoctorTrackedVaccines = listByDoctor;
export const getVaccinationRecord = getRecord;
export const getReferenceVaccines = listReferences;
export const getVaccineReferences = listReferences;
export const createVaccinationRecord = createRecord;
export const deleteVaccinationRecord = removeRecord;
export const updateVaccinationRecord = updateRecord;

