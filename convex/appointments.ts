import { query, mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  getAuthenticatedDoctor,
  verifyDoctorOwnsAppointment,
  verifyDoctorOwnsPatient,
  verifyDoctorOwnsPrescription,
  verifyDoctorOwnsLabOrder,
} from "./authHelpers";

// Input shape for prescriptions submitted from the consultation form.
const prescriptionInput = v.object({
  drug: v.string(),
  count: v.number(),
  unit: v.string(),
  posology: v.string(),
  dose: v.optional(v.string()),
  route: v.optional(v.string()),
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  refillsRemaining: v.optional(v.number()),
  notes: v.optional(v.string()),
});

// Input shape for lab orders submitted from the consultation form.
const labOrderInput = v.object({
  examName: v.string(),
  clinicalContext: v.optional(v.string()),
  urgency: v.optional(v.union(
    v.literal("routine"),
    v.literal("urgent"),
    v.literal("stat"),
  )),
  notes: v.optional(v.string()),
});

// Hydrate prescriptions for an appointment, sorted oldest-first to preserve form order.
async function loadPrescriptionsForAppointment(
  ctx: QueryCtx,
  appointmentId: Id<"appointments">,
) {
  const rows = await ctx.db
    .query("prescriptions")
    .withIndex("by_appointmentId", (q) => q.eq("appointmentId", appointmentId))
    .collect();
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

// Hydrate lab orders for an appointment, sorted oldest-first.
async function loadLabOrdersForAppointment(
  ctx: QueryCtx,
  appointmentId: Id<"appointments">,
) {
  const rows = await ctx.db
    .query("labOrders")
    .withIndex("by_appointmentId", (q) => q.eq("appointmentId", appointmentId))
    .collect();
  return rows.sort((a, b) => a.createdAt - b.createdAt);
}

// Reconcile child rows for an appointment: replace-all semantics.
// Returns whether the set of rows changed (used to decide on portal notifications).
async function reconcilePrescriptions(
  ctx: MutationCtx,
  args: {
    appointmentId: Id<"appointments">;
    doctorId: Id<"doctors">;
    patientId: Id<"patients">;
    items: Array<{
      drug: string;
      count: number;
      unit: string;
      posology: string;
      dose?: string;
      route?: string;
      startDate?: number;
      endDate?: number;
      refillsRemaining?: number;
      notes?: string;
    }>;
  },
): Promise<{ changed: boolean }> {
  const existing = await ctx.db
    .query("prescriptions")
    .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
    .collect();

  // No-op fast path: same number of rows and same content.
  const sameLength = existing.length === args.items.length;
  if (sameLength) {
    const sortedExisting = [...existing].sort((a, b) => a.createdAt - b.createdAt);
    const allMatch = sortedExisting.every((row, i) => {
      const incoming = args.items[i];
      return (
        row.drug === incoming.drug &&
        row.count === incoming.count &&
        row.unit === incoming.unit &&
        row.posology === incoming.posology &&
        (row.dose ?? undefined) === (incoming.dose ?? undefined) &&
        (row.route ?? undefined) === (incoming.route ?? undefined)
      );
    });
    if (allMatch) return { changed: false };
  }

  for (const row of existing) {
    await ctx.db.delete(row._id);
  }
  const now = Date.now();
  for (const item of args.items) {
    await ctx.db.insert("prescriptions", {
      doctorId: args.doctorId,
      patientId: args.patientId,
      appointmentId: args.appointmentId,
      drug: item.drug,
      count: item.count,
      unit: item.unit,
      posology: item.posology,
      dose: item.dose,
      route: item.route,
      startDate: item.startDate,
      endDate: item.endDate,
      refillsRemaining: item.refillsRemaining,
      status: "active",
      notes: item.notes,
      createdAt: now,
      updatedAt: now,
    });
  }
  return { changed: true };
}

async function reconcileLabOrders(
  ctx: MutationCtx,
  args: {
    appointmentId: Id<"appointments">;
    doctorId: Id<"doctors">;
    patientId: Id<"patients">;
    items: Array<{
      examName: string;
      clinicalContext?: string;
      urgency?: "routine" | "urgent" | "stat";
      notes?: string;
    }>;
  },
): Promise<{ changed: boolean }> {
  const existing = await ctx.db
    .query("labOrders")
    .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
    .collect();

  const sameLength = existing.length === args.items.length;
  if (sameLength) {
    const sortedExisting = [...existing].sort((a, b) => a.createdAt - b.createdAt);
    const allMatch = sortedExisting.every((row, i) => {
      const incoming = args.items[i];
      return (
        row.examName === incoming.examName &&
        (row.clinicalContext ?? undefined) === (incoming.clinicalContext ?? undefined) &&
        (row.urgency ?? undefined) === (incoming.urgency ?? undefined)
      );
    });
    if (allMatch) return { changed: false };
  }

  for (const row of existing) {
    await ctx.db.delete(row._id);
  }
  const now = Date.now();
  for (const item of args.items) {
    await ctx.db.insert("labOrders", {
      doctorId: args.doctorId,
      patientId: args.patientId,
      appointmentId: args.appointmentId,
      examName: item.examName,
      clinicalContext: item.clinicalContext,
      urgency: item.urgency,
      status: "ordered",
      orderedAt: now,
      notes: item.notes,
      createdAt: now,
      updatedAt: now,
    });
  }
  return { changed: true };
}

// Standalone lab order creation — inserts rows for a patient without an
// appointment, or attaches them to an existing appointment without the
// replace-all reconcile semantics (i.e., they're additive).
export const createLabOrdersForPatient = mutation({
  args: {
    patientId: v.id("patients"),
    appointmentId: v.optional(v.id("appointments")),
    items: v.array(labOrderInput),
  },
  handler: async (ctx, args) => {
    const { doctor } = await verifyDoctorOwnsPatient(ctx, args.patientId);

    // If attaching to an appointment, sanity-check ownership.
    if (args.appointmentId) {
      const appt = await ctx.db.get(args.appointmentId);
      if (!appt || appt.patientId !== args.patientId || appt.doctorId !== doctor._id) {
        throw new Error("Not authorized");
      }
    }

    const now = Date.now();
    const ids: Id<"labOrders">[] = [];
    for (const item of args.items) {
      const id = await ctx.db.insert("labOrders", {
        doctorId: doctor._id,
        patientId: args.patientId,
        appointmentId: args.appointmentId,
        examName: item.examName,
        clinicalContext: item.clinicalContext,
        urgency: item.urgency,
        status: "ordered",
        orderedAt: now,
        notes: item.notes,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }
    return { ids, patientId: args.patientId };
  },
});

// Standalone prescription creation — same semantics as above for prescriptions.
export const createPrescriptionsForPatient = mutation({
  args: {
    patientId: v.id("patients"),
    appointmentId: v.optional(v.id("appointments")),
    items: v.array(prescriptionInput),
  },
  handler: async (ctx, args) => {
    const { doctor } = await verifyDoctorOwnsPatient(ctx, args.patientId);

    if (args.appointmentId) {
      const appt = await ctx.db.get(args.appointmentId);
      if (!appt || appt.patientId !== args.patientId || appt.doctorId !== doctor._id) {
        throw new Error("Not authorized");
      }
    }

    const now = Date.now();
    const ids: Id<"prescriptions">[] = [];
    for (const item of args.items) {
      const id = await ctx.db.insert("prescriptions", {
        doctorId: doctor._id,
        patientId: args.patientId,
        appointmentId: args.appointmentId,
        drug: item.drug,
        count: item.count,
        unit: item.unit,
        posology: item.posology,
        dose: item.dose,
        route: item.route,
        startDate: item.startDate,
        endDate: item.endDate,
        refillsRemaining: item.refillsRemaining,
        status: "active",
        notes: item.notes,
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }
    return { ids, patientId: args.patientId };
  },
});

// Get all appointments for a doctor
export const listByDoctor = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    return await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .collect();
  },
});

// Get appointments for a patient
export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);
    return await ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

// Get recent appointments (last 30 days)
export const listRecent = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .collect();
    
    return appointments.filter(apt => apt.startDate >= thirtyDaysAgo);
  },
});

// Get today's appointments
export const listToday = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1;
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) => q.eq("doctorId", args.doctorId))
      .collect();
    
    return appointments.filter(apt => 
      apt.startDate >= startOfDay && apt.startDate <= endOfDay
    );
  },
});

// Get appointment by ID with related data
export const getById = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsAppointment(ctx, args.appointmentId);
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) return null;

    const [patient, service, files, prescriptions, labOrders] = await Promise.all([
      ctx.db.get(appointment.patientId),
      appointment.serviceId ? ctx.db.get(appointment.serviceId) : null,
      ctx.db
        .query("files")
        .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
        .collect(),
      loadPrescriptionsForAppointment(ctx, args.appointmentId),
      loadLabOrdersForAppointment(ctx, args.appointmentId),
    ]);

    return { ...appointment, patient, service, files, prescriptions, labOrders };
  },
});

// Get today's revenue
export const getTodayRevenue = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1;

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) => q.eq("doctorId", args.doctorId))
      .collect();
    
    const todayAppointments = appointments.filter(apt => 
      apt.startDate >= startOfDay && apt.startDate <= endOfDay && apt.cost
    );
    
    const revenue = todayAppointments.reduce((sum, apt) => sum + (apt.cost || 0), 0);
    
    // Get primary currency from first service
    const services = await ctx.db
      .query("services")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .first();
    
    return { revenue, currency: services?.currency || "HTG" };
  },
});

// Get monthly revenue
export const getMonthlyRevenue = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) => q.eq("doctorId", args.doctorId))
      .collect();
    
    const monthAppointments = appointments.filter(apt => 
      apt.startDate >= startOfMonth && apt.cost
    );
    
    const revenue = monthAppointments.reduce((sum, apt) => sum + (apt.cost || 0), 0);
    
    const services = await ctx.db
      .query("services")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .first();
    
    return { revenue, currency: services?.currency || "HTG" };
  },
});

// Get today's patient count
export const getTodayPatientCount = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1;

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) => q.eq("doctorId", args.doctorId))
      .collect();
    
    const todayAppointments = appointments.filter(apt => 
      apt.startDate >= startOfDay && apt.startDate <= endOfDay
    );
    
    const uniquePatients = new Set(todayAppointments.map(apt => apt.patientId));
    return uniquePatients.size;
  },
});

// Get daily transactions for a specific date
export const getDailyTransactions = query({
  args: {
    doctorId: v.id("doctors"),
    date: v.number(), // Unix timestamp for the date
  },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    const dateObj = new Date(args.date);
    const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
    const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1;
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .collect();
    
    const dayAppointments = appointments.filter(apt => 
      apt.startDate >= startOfDay && apt.startDate <= endOfDay
    );
    
    // Enrich with patient and service data
    const transactions = await Promise.all(
      dayAppointments.map(async (apt) => {
        const [patient, service] = await Promise.all([
          ctx.db.get(apt.patientId),
          apt.serviceId ? ctx.db.get(apt.serviceId) : null,
        ]);
        
        return {
          id: apt._id,
          date: apt.startDate,
          patientName: patient ? `${patient.firstname} ${patient.lastname}` : "Unknown",
          serviceName: service?.name || "No service assigned",
          price: apt.cost || 0,
          currency: service?.currency || "USD",
        };
      })
    );
    
    return transactions.filter(t => t.patientName !== "Unknown");
  },
});

// Get daily revenue data for charts
export const getDailyRevenueData = query({
  args: {
    doctorId: v.id("doctors"),
    yearToDate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    const now = new Date();
    const startDate = args.yearToDate !== false
      ? new Date(now.getFullYear(), 0, 1).getTime()
      : 0;
    
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .collect();
    
    const filteredAppointments = appointments.filter(apt => 
      apt.startDate >= startDate && apt.cost !== undefined && apt.cost > 0
    );
    
    // Group by date
    const dailyData = new Map<string, { revenue: number; currency: string }>();
    
    for (const apt of filteredAppointments) {
      const dateKey = new Date(apt.startDate).toISOString().split("T")[0];
      const current = dailyData.get(dateKey) || { revenue: 0, currency: "HTG" };
      
      if (apt.serviceId) {
        const service = await ctx.db.get(apt.serviceId);
        dailyData.set(dateKey, {
          revenue: current.revenue + (apt.cost || 0),
          currency: service?.currency || "HTG",
        });
      } else {
        dailyData.set(dateKey, {
          revenue: current.revenue + (apt.cost || 0),
          currency: "HTG",
        });
      }
    }
    
    // Get primary currency
    const services = await ctx.db
      .query("services")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .first();
    
    const primaryCurrency = services?.currency || "HTG";
    
    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        revenue: Number(data.revenue.toFixed(2)),
        currency: data.currency || primaryCurrency,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Create appointment
export const create = mutation({
  args: {
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
    serviceId: v.optional(v.id("services")),
    cost: v.optional(v.number()),
    motif: v.optional(v.string()),
    findings: v.optional(v.string()),
    recommendation: v.optional(v.string()),
    otherRemarks: v.optional(v.string()),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    head: v.optional(v.number()),
    arm: v.optional(v.number()),
    sao2: v.optional(v.number()),
    temperature: v.optional(v.number()),
    pulse: v.optional(v.number()),
    respiratory: v.optional(v.number()),
    systolic: v.optional(v.number()),
    diastolic: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");

    // Validate cost is non-negative
    if (args.cost !== undefined && args.cost < 0) {
      throw new Error("Cost cannot be negative");
    }
    // Validate vital signs ranges
    if (args.temperature !== undefined && (args.temperature < 30 || args.temperature > 45)) {
      throw new Error("Temperature out of valid range (30-45°C)");
    }
    if (args.pulse !== undefined && (args.pulse < 20 || args.pulse > 300)) {
      throw new Error("Pulse out of valid range");
    }
    if (args.sao2 !== undefined && (args.sao2 < 0 || args.sao2 > 100)) {
      throw new Error("SpO2 out of valid range (0-100%)");
    }
    if (args.systolic !== undefined && (args.systolic < 30 || args.systolic > 300)) {
      throw new Error("Systolic blood pressure out of valid range");
    }
    if (args.diastolic !== undefined && (args.diastolic < 20 || args.diastolic > 200)) {
      throw new Error("Diastolic blood pressure out of valid range");
    }
    if (args.respiratory !== undefined && (args.respiratory < 5 || args.respiratory > 80)) {
      throw new Error("Respiratory rate out of valid range");
    }

    return await ctx.db.insert("appointments", {
      ...args,
      startDate: Date.now(),
      status: "offline",
    });
  },
});

// Update appointment
export const update = mutation({
  args: {
    appointmentId: v.id("appointments"),
    serviceId: v.optional(v.id("services")),
    cost: v.optional(v.number()),
    status: v.optional(v.union(v.literal("pending"), v.literal("paid"), v.literal("offline"))),
    motif: v.optional(v.string()),
    findings: v.optional(v.string()),
    recommendation: v.optional(v.string()),
    otherRemarks: v.optional(v.string()),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    head: v.optional(v.number()),
    arm: v.optional(v.number()),
    sao2: v.optional(v.number()),
    temperature: v.optional(v.number()),
    pulse: v.optional(v.number()),
    respiratory: v.optional(v.number()),
    systolic: v.optional(v.number()),
    diastolic: v.optional(v.number()),
    prescriptions: v.optional(v.array(prescriptionInput)),
    labOrders: v.optional(v.array(labOrderInput)),
    internalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { doctor, appointment, patient } = await verifyDoctorOwnsAppointment(ctx, args.appointmentId);

    // Validate cost is non-negative
    if (args.cost !== undefined && args.cost < 0) {
      throw new Error("Cost cannot be negative");
    }
    // Validate vital signs ranges
    if (args.temperature !== undefined && (args.temperature < 30 || args.temperature > 45)) {
      throw new Error("Temperature out of valid range (30-45°C)");
    }
    if (args.pulse !== undefined && (args.pulse < 20 || args.pulse > 300)) {
      throw new Error("Pulse out of valid range");
    }
    if (args.sao2 !== undefined && (args.sao2 < 0 || args.sao2 > 100)) {
      throw new Error("SpO2 out of valid range (0-100%)");
    }
    if (args.systolic !== undefined && (args.systolic < 30 || args.systolic > 300)) {
      throw new Error("Systolic blood pressure out of valid range");
    }
    if (args.diastolic !== undefined && (args.diastolic < 20 || args.diastolic > 200)) {
      throw new Error("Diastolic blood pressure out of valid range");
    }
    if (args.respiratory !== undefined && (args.respiratory < 5 || args.respiratory > 80)) {
      throw new Error("Respiratory rate out of valid range");
    }

    const { appointmentId, prescriptions, labOrders, ...rest } = args;

    // Patch the appointment row itself (medical-data arrays no longer live here).
    const filteredUpdates = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined)
    );
    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(appointmentId, filteredUpdates);
    }

    // Reconcile child tables when the caller passed them.
    let prescriptionsChanged = false;
    let labOrdersChanged = false;
    if (prescriptions !== undefined) {
      const result = await reconcilePrescriptions(ctx, {
        appointmentId,
        doctorId: doctor._id,
        patientId: appointment.patientId,
        items: prescriptions,
      });
      prescriptionsChanged = result.changed;
    }
    if (labOrders !== undefined) {
      const result = await reconcileLabOrders(ctx, {
        appointmentId,
        doctorId: doctor._id,
        patientId: appointment.patientId,
        items: labOrders,
      });
      labOrdersChanged = result.changed;
    }

    // Trigger portal notifications if patient has portal enabled.
    if (patient.portalEnabled) {
      const hasFindingsChange = args.findings !== undefined &&
        args.findings !== appointment.findings;

      if (prescriptionsChanged) {
        await ctx.scheduler.runAfter(0, internal.portalNotifications.notifyParentOfPrescription, {
          patientId: appointment.patientId,
          appointmentId,
        });
      }
      if (labOrdersChanged) {
        await ctx.scheduler.runAfter(0, internal.portalNotifications.notifyParentOfLabExam, {
          patientId: appointment.patientId,
          appointmentId,
        });
      }
      if (hasFindingsChange) {
        await ctx.scheduler.runAfter(0, internal.portalNotifications.notifyParentOfAppointmentSummary, {
          patientId: appointment.patientId,
          appointmentId,
        });
      }
    }

    return appointmentId;
  },
});

// Delete appointment
export const remove = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsAppointment(ctx, args.appointmentId);

    const [files, prescriptions, labOrders] = await Promise.all([
      ctx.db
        .query("files")
        .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
        .collect(),
      ctx.db
        .query("prescriptions")
        .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
        .collect(),
      ctx.db
        .query("labOrders")
        .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
        .collect(),
    ]);

    for (const file of files) await ctx.db.delete(file._id);

    for (const order of labOrders) {
      const results = await ctx.db
        .query("labResults")
        .withIndex("by_labOrderId", (q) => q.eq("labOrderId", order._id))
        .collect();
      for (const result of results) await ctx.db.delete(result._id);
      await ctx.db.delete(order._id);
    }

    for (const rx of prescriptions) await ctx.db.delete(rx._id);

    await ctx.db.delete(args.appointmentId);
  },
});

// ==================== Prescriptions ====================

// List active prescriptions for a patient (across all visits).
export const listActivePrescriptionsByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);
    return await ctx.db
      .query("prescriptions")
      .withIndex("by_patientId_status", (q) =>
        q.eq("patientId", args.patientId).eq("status", "active"),
      )
      .order("desc")
      .collect();
  },
});

// List all prescriptions for a patient (history).
export const listPrescriptionsByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);
    return await ctx.db
      .query("prescriptions")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

// Discontinue a prescription.
export const discontinuePrescription = mutation({
  args: {
    prescriptionId: v.id("prescriptions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { prescription } = await verifyDoctorOwnsPrescription(ctx, args.prescriptionId);

    await ctx.db.patch(args.prescriptionId, {
      status: "discontinued",
      discontinuedReason: args.reason,
      updatedAt: Date.now(),
    });

    const patient = await ctx.db.get(prescription.patientId);
    if (patient?.portalEnabled) {
      await ctx.scheduler.runAfter(0, internal.portalNotifications.notifyParentOfPrescriptionDiscontinued, {
        patientId: prescription.patientId,
        prescriptionId: args.prescriptionId,
      });
    }

    return args.prescriptionId;
  },
});

// Renew a prescription (clone an existing one with optional overrides).
export const renewPrescription = mutation({
  args: {
    sourcePrescriptionId: v.id("prescriptions"),
    appointmentId: v.optional(v.id("appointments")),
    posology: v.optional(v.string()),
    count: v.optional(v.number()),
    unit: v.optional(v.string()),
    refillsRemaining: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { prescription } = await verifyDoctorOwnsPrescription(ctx, args.sourcePrescriptionId);
    const now = Date.now();

    const newId = await ctx.db.insert("prescriptions", {
      doctorId: prescription.doctorId,
      patientId: prescription.patientId,
      appointmentId: args.appointmentId,
      drug: prescription.drug,
      count: args.count ?? prescription.count,
      unit: args.unit ?? prescription.unit,
      posology: args.posology ?? prescription.posology,
      dose: prescription.dose,
      route: prescription.route,
      startDate: args.startDate ?? now,
      endDate: args.endDate,
      refillsRemaining: args.refillsRemaining ?? prescription.refillsRemaining,
      status: "active",
      renewedFromId: args.sourcePrescriptionId,
      notes: args.notes ?? prescription.notes,
      createdAt: now,
      updatedAt: now,
    });

    const patient = await ctx.db.get(prescription.patientId);
    if (patient?.portalEnabled) {
      await ctx.scheduler.runAfter(0, internal.portalNotifications.notifyParentOfPrescription, {
        patientId: prescription.patientId,
        appointmentId: args.appointmentId,
        prescriptionId: newId,
      });
    }

    return newId;
  },
});

// ==================== Lab Orders ====================

// Per-patient prescriptions view: all prescriptions for one patient, grouped
// by visit. Active scripts first, then completed/discontinued/cancelled.
export const getPatientPrescriptions = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);

    const all = await ctx.db
      .query("prescriptions")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();

    type Script = (typeof all)[number];
    type VisitGroup = {
      key: string;
      appointmentId?: string;
      visitDate?: number;
      motif?: string;
      scripts: Script[];
    };

    const visitCache = new Map<string, any>();
    const visits: VisitGroup[] = [];
    let activeCount = 0;

    for (const p of all) {
      if (p.status === "active") activeCount++;

      const visitKey = p.appointmentId
        ? String(p.appointmentId)
        : `standalone:${String(args.patientId)}`;
      let visit = visits.find((v) => v.key === visitKey);
      if (!visit) {
        let visitDate: number | undefined;
        let motif: string | undefined;
        if (p.appointmentId) {
          const aptKey = String(p.appointmentId);
          if (!visitCache.has(aptKey)) {
            visitCache.set(aptKey, await ctx.db.get(p.appointmentId));
          }
          const apt = visitCache.get(aptKey);
          visitDate = apt?.startDate;
          motif = apt?.motif;
        }
        visit = {
          key: visitKey,
          appointmentId: p.appointmentId ? String(p.appointmentId) : undefined,
          visitDate,
          motif,
          scripts: [],
        };
        visits.push(visit);
      }
      visit.scripts.push(p);
    }

    visits.sort((a, b) => {
      const aDate =
        a.visitDate ??
        Math.max(...a.scripts.map((s) => s.createdAt));
      const bDate =
        b.visitDate ??
        Math.max(...b.scripts.map((s) => s.createdAt));
      return bDate - aDate;
    });

    return { visits, activeCount };
  },
});

// Per-patient labs view: active + recently-reviewed lab orders for one patient,
// grouped by visit. Same shape as one entry from getLabWorklist, minus the
// patient-grouping wrapper.
export const getPatientLabs = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);

    const all = await ctx.db
      .query("labOrders")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();

    const active = all.filter((o) => o.status !== "cancelled");

    type Order = (typeof active)[number];
    type VisitGroup = {
      key: string;
      appointmentId?: string;
      visitDate?: number;
      motif?: string;
      orders: Order[];
    };

    const visitCache = new Map<string, any>();
    const visits: VisitGroup[] = [];
    let pendingCount = 0;
    let awaitingReviewCount = 0;
    let hasStat = false;

    for (const o of active) {
      if (o.urgency === "stat" && o.status !== "reviewed") hasStat = true;
      if (o.status === "ordered" || o.status === "collected") pendingCount++;
      if (o.status === "resulted") awaitingReviewCount++;

      const visitKey = o.appointmentId
        ? String(o.appointmentId)
        : `standalone:${String(args.patientId)}`;
      let visit = visits.find((v) => v.key === visitKey);
      if (!visit) {
        let visitDate: number | undefined;
        let motif: string | undefined;
        if (o.appointmentId) {
          const aptKey = String(o.appointmentId);
          if (!visitCache.has(aptKey)) {
            visitCache.set(aptKey, await ctx.db.get(o.appointmentId));
          }
          const apt = visitCache.get(aptKey);
          visitDate = apt?.startDate;
          motif = apt?.motif;
        }
        visit = {
          key: visitKey,
          appointmentId: o.appointmentId ? String(o.appointmentId) : undefined,
          visitDate,
          motif,
          orders: [],
        };
        visits.push(visit);
      }
      visit.orders.push(o);
    }

    visits.sort((a, b) => {
      const aDate =
        a.visitDate ??
        Math.max(...a.orders.map((o) => o.orderedAt ?? o.createdAt));
      const bDate =
        b.visitDate ??
        Math.max(...b.orders.map((o) => o.orderedAt ?? o.createdAt));
      return bDate - aDate;
    });

    return { visits, pendingCount, awaitingReviewCount, hasStat };
  },
});

// Lightweight cross-patient inbox for the dashboard widget. Returns a small
// list of stat + awaiting-review items with patient name baked in.
export const getLabAttention = query({
  args: { doctorId: v.id("doctors"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");

    const all = await ctx.db
      .query("labOrders")
      .withIndex("by_doctorId_status", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    const attention = all.filter(
      (o) =>
        (o.status === "resulted") ||
        (o.urgency === "stat" && o.status !== "reviewed" && o.status !== "cancelled"),
    );

    let statCount = 0;
    let awaitingReviewCount = 0;
    for (const o of attention) {
      if (o.urgency === "stat" && o.status !== "reviewed") statCount++;
      if (o.status === "resulted") awaitingReviewCount++;
    }

    // Priority sort: stat first, then by oldest orderedAt.
    attention.sort((a, b) => {
      const aStat = a.urgency === "stat" ? 0 : 1;
      const bStat = b.urgency === "stat" ? 0 : 1;
      if (aStat !== bStat) return aStat - bStat;
      const aAt = a.orderedAt ?? a.createdAt;
      const bAt = b.orderedAt ?? b.createdAt;
      return aAt - bAt;
    });

    const limit = args.limit ?? 5;
    const sliced = attention.slice(0, limit);

    const patientCache = new Map<string, any>();
    const items = await Promise.all(
      sliced.map(async (o) => {
        const pid = String(o.patientId);
        if (!patientCache.has(pid)) {
          patientCache.set(pid, await ctx.db.get(o.patientId));
        }
        const p = patientCache.get(pid);
        return {
          labOrderId: String(o._id),
          patientId: pid,
          patientName: p ? `${p.firstname} ${p.lastname}` : "Unknown",
          examName: o.examName,
          status: o.status,
          urgency: o.urgency,
        };
      }),
    );

    return {
      statCount,
      awaitingReviewCount,
      totalAttention: attention.length,
      items,
    };
  },
});

// List pending lab orders for a doctor (across all patients).
export const listPendingLabOrdersByDoctor = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");
    const all = await ctx.db
      .query("labOrders")
      .withIndex("by_doctorId_status", (q) => q.eq("doctorId", args.doctorId))
      .collect();
    return all.filter((o) => o.status !== "cancelled" && o.status !== "reviewed");
  },
});

// Worklist view: pending lab orders grouped by patient, then by visit (or "standalone"
// when no appointmentId). Hydrates with patient + visit summary so the UI doesn't have
// to fan out per-row queries. Returns one entry per patient with active orders.
export const getLabWorklist = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    if (doctor._id !== args.doctorId) throw new Error("Not authorized");

    const all = await ctx.db
      .query("labOrders")
      .withIndex("by_doctorId_status", (q) => q.eq("doctorId", args.doctorId))
      .collect();
    const active = all.filter((o) => o.status !== "cancelled" && o.status !== "reviewed");

    // Cache patient + appointment lookups so we don't re-fetch per row.
    const patientCache = new Map<string, any>();
    const visitCache = new Map<string, any>();

    type Order = (typeof active)[number];
    type VisitGroup = {
      key: string; // appointmentId or `standalone:<oldest orderedAt>`
      appointmentId?: string;
      visitDate?: number;
      motif?: string;
      orders: Order[];
    };
    type PatientGroup = {
      patientId: string;
      patient: {
        firstname: string;
        lastname: string;
        birthdate?: number;
        sex?: string;
      } | null;
      visits: VisitGroup[];
      pendingCount: number; // ordered + collected
      awaitingReviewCount: number; // resulted (waiting for doctor review)
      hasStat: boolean;
      oldestOrderedAt: number; // for sort
    };

    const byPatient = new Map<string, PatientGroup>();

    for (const o of active) {
      const pid = String(o.patientId);
      if (!patientCache.has(pid)) {
        patientCache.set(pid, await ctx.db.get(o.patientId));
      }
      const patient = patientCache.get(pid);

      let group = byPatient.get(pid);
      if (!group) {
        group = {
          patientId: pid,
          patient: patient
            ? {
                firstname: patient.firstname,
                lastname: patient.lastname,
                birthdate: patient.birthdate,
                sex: patient.sex,
              }
            : null,
          visits: [],
          pendingCount: 0,
          awaitingReviewCount: 0,
          hasStat: false,
          oldestOrderedAt: Number.POSITIVE_INFINITY,
        };
        byPatient.set(pid, group);
      }

      if (o.urgency === "stat") group.hasStat = true;
      if (o.status === "ordered" || o.status === "collected") group.pendingCount++;
      if (o.status === "resulted") group.awaitingReviewCount++;

      const at = o.orderedAt ?? o.createdAt;
      if (at < group.oldestOrderedAt) group.oldestOrderedAt = at;

      // Bucket into a visit group.
      const visitKey = o.appointmentId
        ? String(o.appointmentId)
        : `standalone:${pid}`;
      let visit = group.visits.find((v) => v.key === visitKey);
      if (!visit) {
        let visitDate: number | undefined;
        let motif: string | undefined;
        if (o.appointmentId) {
          const aptKey = String(o.appointmentId);
          if (!visitCache.has(aptKey)) {
            visitCache.set(aptKey, await ctx.db.get(o.appointmentId));
          }
          const apt = visitCache.get(aptKey);
          visitDate = apt?.startDate;
          motif = apt?.motif;
        }
        visit = {
          key: visitKey,
          appointmentId: o.appointmentId ? String(o.appointmentId) : undefined,
          visitDate,
          motif,
          orders: [],
        };
        group.visits.push(visit);
      }
      visit.orders.push(o);
    }

    // Sort visits inside each patient: newest first; standalones use most-recent order date.
    for (const g of byPatient.values()) {
      g.visits.sort((a, b) => {
        const aDate =
          a.visitDate ??
          Math.max(...a.orders.map((o) => o.orderedAt ?? o.createdAt));
        const bDate =
          b.visitDate ??
          Math.max(...b.orders.map((o) => o.orderedAt ?? o.createdAt));
        return bDate - aDate;
      });
    }

    return Array.from(byPatient.values());
  },
});

// List lab orders for a patient (with optional status filter).
export const listLabOrdersByPatient = query({
  args: {
    patientId: v.id("patients"),
    status: v.optional(v.union(
      v.literal("ordered"),
      v.literal("collected"),
      v.literal("resulted"),
      v.literal("reviewed"),
      v.literal("cancelled"),
    )),
  },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsPatient(ctx, args.patientId);
    if (args.status) {
      return await ctx.db
        .query("labOrders")
        .withIndex("by_patientId_status", (q) =>
          q.eq("patientId", args.patientId).eq("status", args.status!),
        )
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("labOrders")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

// Update a lab order's status (collected → resulted → reviewed → cancelled).
export const updateLabOrderStatus = mutation({
  args: {
    labOrderId: v.id("labOrders"),
    status: v.union(
      v.literal("ordered"),
      v.literal("collected"),
      v.literal("resulted"),
      v.literal("reviewed"),
      v.literal("cancelled"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsLabOrder(ctx, args.labOrderId);
    const now = Date.now();
    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };
    if (args.notes !== undefined) patch.notes = args.notes;
    if (args.status === "collected") patch.collectedAt = now;
    if (args.status === "resulted") patch.resultedAt = now;
    if (args.status === "reviewed") patch.reviewedAt = now;

    await ctx.db.patch(args.labOrderId, patch);
    return args.labOrderId;
  },
});

// ==================== Lab Results ====================

// Create a lab result tied to an order (and auto-advance the order to "resulted").
export const createLabResult = mutation({
  args: {
    labOrderId: v.id("labOrders"),
    value: v.string(),
    unit: v.optional(v.string()),
    referenceRange: v.optional(v.string()),
    abnormalFlag: v.optional(v.union(
      v.literal("normal"),
      v.literal("low"),
      v.literal("high"),
      v.literal("critical"),
    )),
    fileId: v.optional(v.id("files")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { labOrder } = await verifyDoctorOwnsLabOrder(ctx, args.labOrderId);
    const now = Date.now();

    const resultId = await ctx.db.insert("labResults", {
      labOrderId: args.labOrderId,
      patientId: labOrder.patientId,
      value: args.value,
      unit: args.unit,
      referenceRange: args.referenceRange,
      abnormalFlag: args.abnormalFlag,
      fileId: args.fileId,
      enteredBy: "doctor",
      enteredAt: now,
      notes: args.notes,
    });

    if (labOrder.status === "ordered" || labOrder.status === "collected") {
      await ctx.db.patch(args.labOrderId, {
        status: "resulted",
        resultedAt: now,
        updatedAt: now,
      });
    }

    const patient = await ctx.db.get(labOrder.patientId);
    if (patient?.portalEnabled) {
      await ctx.scheduler.runAfter(0, internal.portalNotifications.notifyParentOfLabResult, {
        patientId: labOrder.patientId,
        labOrderId: args.labOrderId,
      });
    }

    return resultId;
  },
});

// Commit a batch of lab results extracted from an uploaded report.
// Items either reference an existing labOrderId (matched against ordered exams)
// or carry an examName + appointmentId/patientId so a new "resulted" labOrder
// is auto-created. All resulting labResults rows can share a single fileId
// (the originally uploaded PDF/image, persisted via the files table).
export const commitLabResultsBatch = mutation({
  args: {
    items: v.array(
      v.object({
        // EITHER an existing order…
        labOrderId: v.optional(v.id("labOrders")),
        // …OR fields to create a new one
        examName: v.optional(v.string()),
        patientId: v.optional(v.id("patients")),
        appointmentId: v.optional(v.id("appointments")),
        // result fields
        value: v.string(),
        unit: v.optional(v.string()),
        referenceRange: v.optional(v.string()),
        abnormalFlag: v.optional(
          v.union(
            v.literal("normal"),
            v.literal("low"),
            v.literal("high"),
            v.literal("critical"),
          ),
        ),
        notes: v.optional(v.string()),
      }),
    ),
    fileId: v.optional(v.id("files")),
    enteredBy: v.optional(
      v.union(
        v.literal("doctor"),
        v.literal("lab_import"),
        v.literal("portal_upload"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    const now = Date.now();

    let resultsCreated = 0;
    let ordersCreated = 0;
    const touchedOrders = new Set<string>();
    const touchedPatients = new Set<string>();

    for (const item of args.items) {
      let labOrderId = item.labOrderId;
      let patientId: Id<"patients"> | undefined;

      if (labOrderId) {
        const { labOrder } = await verifyDoctorOwnsLabOrder(ctx, labOrderId);
        patientId = labOrder.patientId;
      } else {
        if (!item.examName || !item.patientId) {
          throw new Error(
            "Items without labOrderId must include examName and patientId",
          );
        }
        await verifyDoctorOwnsPatient(ctx, item.patientId);
        patientId = item.patientId;

        labOrderId = await ctx.db.insert("labOrders", {
          doctorId: doctor._id,
          patientId: item.patientId,
          appointmentId: item.appointmentId,
          examName: item.examName,
          status: "resulted",
          orderedAt: now,
          resultedAt: now,
          createdAt: now,
          updatedAt: now,
        });
        ordersCreated++;
      }

      await ctx.db.insert("labResults", {
        labOrderId: labOrderId!,
        patientId: patientId!,
        value: item.value,
        unit: item.unit,
        referenceRange: item.referenceRange,
        abnormalFlag: item.abnormalFlag,
        fileId: args.fileId,
        enteredBy: args.enteredBy ?? "doctor",
        enteredAt: now,
        notes: item.notes,
      });
      resultsCreated++;
      touchedOrders.add(String(labOrderId));
      touchedPatients.add(String(patientId));
    }

    // Auto-advance any matched-existing orders that were still ordered/collected.
    for (const orderIdStr of touchedOrders) {
      const orderId = orderIdStr as Id<"labOrders">;
      const order = await ctx.db.get(orderId);
      if (!order) continue;
      if (order.status === "ordered" || order.status === "collected") {
        await ctx.db.patch(orderId, {
          status: "resulted",
          resultedAt: now,
          updatedAt: now,
        });
      }
    }

    // One notification per affected patient (covers the whole batch).
    for (const patientIdStr of touchedPatients) {
      const patientId = patientIdStr as Id<"patients">;
      const patient = await ctx.db.get(patientId);
      if (patient?.portalEnabled) {
        // Pick any one of the touched orders for this patient as the notification anchor.
        // (Notification helper expects a single labOrderId.)
        let anchor: Id<"labOrders"> | null = null;
        for (const orderIdStr of touchedOrders) {
          const order = await ctx.db.get(orderIdStr as Id<"labOrders">);
          if (order && order.patientId === patientId) {
            anchor = order._id;
            break;
          }
        }
        if (anchor) {
          await ctx.scheduler.runAfter(
            0,
            internal.portalNotifications.notifyParentOfLabResult,
            { patientId, labOrderId: anchor },
          );
        }
      }
    }

    return { resultsCreated, ordersCreated };
  },
});

// List lab results tied to an order (most recent first).
export const listLabResultsByOrder = query({
  args: { labOrderId: v.id("labOrders") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsLabOrder(ctx, args.labOrderId);
    return await ctx.db
      .query("labResults")
      .withIndex("by_labOrderId", (q) => q.eq("labOrderId", args.labOrderId))
      .order("desc")
      .collect();
  },
});

// Get version info for conflict detection (offline sync)
export const getVersionInfo = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    await verifyDoctorOwnsAppointment(ctx, args.appointmentId);
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) return null;

    // Create a hash of the current state for conflict detection
    const { _id, _creationTime, ...fields } = appointment;
    const versionHash = JSON.stringify(fields);

    return {
      _id: appointment._id,
      versionHash,
      fields,
    };
  },
});

// Alias functions for API compatibility
export const getAppointment = getById;
export const getAppointments = listByDoctor;
export const getPatientAppointments = listByPatient;
export const getAppointmentWithDetails = getById;
export const getAppointmentWithFiles = getById;
export const createAppointment = create;
export const updateAppointment = update;
export const deleteAppointment = remove;

