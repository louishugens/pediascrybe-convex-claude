import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthenticatedDoctor, verifyDoctorOwnsPatient } from "./authHelpers";

// ==================== Vaccins ====================

// Get all vaccines tracked by a doctor
export const listByDoctor = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");

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
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");

    return await ctx.db.insert("vaccins", args);
  },
});

// Delete vaccine
export const removeVaccin = mutation({
  args: { vaccinId: v.id("vaccins") },
  handler: async (ctx, args) => {
    const vaccin = await ctx.db.get(args.vaccinId);
    if (!vaccin) throw new Error("Vaccine not found");
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== vaccin.doctorId) throw new Error("Not authorized");

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
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");

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
    const vaccin = await ctx.db.get(args.vaccinId);
    if (!vaccin) throw new Error("Vaccine not found");
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== vaccin.doctorId) throw new Error("Not authorized");

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
    const vaccin = await ctx.db.get(args.vaccinId);
    if (!vaccin) throw new Error("Vaccine not found");
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== vaccin.doctorId) throw new Error("Not authorized");

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
    const vaccin = await ctx.db.get(args.vaccinId);
    if (!vaccin) throw new Error("Vaccine not found");
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== vaccin.doctorId) throw new Error("Not authorized");

    return await ctx.db.insert("doses", args);
  },
});

// ==================== Vaccination Records ====================

// Get vaccination records for a patient
export const getPatientRecords = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);

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
    await verifyDoctorOwnsPatient(ctx, record.patientId);

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
    await verifyDoctorOwnsPatient(ctx, args.patientId);

    // Input validation
    if (args.manufacturer.length > 100) {
      throw new Error("Manufacturer name too long");
    }
    if (args.lotNumber.length > 50) {
      throw new Error("Lot number too long");
    }
    if (args.expiration < args.date) {
      throw new Error("Vaccine expiration date cannot be before administration date");
    }
    if (args.dosage.length > 100) {
      throw new Error("Dosage too long");
    }

    const recordId = await ctx.db.insert("vaccinationRecords", args);

    // Notify parent if portal is enabled
    const patient = await ctx.db.get(args.patientId);
    if (patient?.portalEnabled) {
      await ctx.scheduler.runAfter(0, internal.portalNotifications.notifyParentOfVaccination, {
        patientId: args.patientId,
      });
    }

    return recordId;
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
    const record = await ctx.db.get(args.recordId);
    if (!record) throw new Error("Record not found");
    await verifyDoctorOwnsPatient(ctx, record.patientId);

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
    const record = await ctx.db.get(args.recordId);
    if (!record) throw new Error("Record not found");
    await verifyDoctorOwnsPatient(ctx, record.patientId);

    await ctx.db.delete(args.recordId);
  },
});

// ==================== Vaccine Compliance ====================

// Get all data needed for patient vaccination compliance calculation
export const getPatientVaccineCompliance = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);

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

