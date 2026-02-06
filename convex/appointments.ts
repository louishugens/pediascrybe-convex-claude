import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Get all appointments for a doctor
export const listByDoctor = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
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
    const appointment = await ctx.db.get(args.appointmentId);
    if (!appointment) return null;
    
    const [patient, service, files] = await Promise.all([
      ctx.db.get(appointment.patientId),
      appointment.serviceId ? ctx.db.get(appointment.serviceId) : null,
      ctx.db
        .query("files")
        .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
        .collect(),
    ]);
    
    return { ...appointment, patient, service, files };
  },
});

// Get today's revenue
export const getTodayRevenue = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
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
    exams: v.optional(v.any()),
    medication: v.optional(v.any()),
    internalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { appointmentId, ...updates } = args;

    // Get current appointment state before update (for notification comparison)
    const currentAppointment = await ctx.db.get(appointmentId);

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    const result = await ctx.db.patch(appointmentId, filteredUpdates);

    // Trigger portal notifications if patient has portal enabled
    if (currentAppointment) {
      const patient = await ctx.db.get(currentAppointment.patientId);
      if (patient?.portalEnabled) {
        const hasMedicationChange = args.medication !== undefined &&
          JSON.stringify(args.medication) !== JSON.stringify(currentAppointment.medication);
        const hasExamsChange = args.exams !== undefined &&
          JSON.stringify(args.exams) !== JSON.stringify(currentAppointment.exams);
        const hasFindingsChange = args.findings !== undefined &&
          args.findings !== currentAppointment.findings;

        if (hasMedicationChange) {
          await ctx.scheduler.runAfter(0, internal.portalNotifications.notifyParentOfPrescription, {
            patientId: currentAppointment.patientId,
            appointmentId,
          });
        }
        if (hasExamsChange) {
          await ctx.scheduler.runAfter(0, internal.portalNotifications.notifyParentOfLabExam, {
            patientId: currentAppointment.patientId,
            appointmentId,
          });
        }
        if (hasFindingsChange) {
          await ctx.scheduler.runAfter(0, internal.portalNotifications.notifyParentOfAppointmentSummary, {
            patientId: currentAppointment.patientId,
            appointmentId,
          });
        }
      }
    }

    return result;
  },
});

// Delete appointment
export const remove = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    // Delete related files first
    const files = await ctx.db
      .query("files")
      .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.appointmentId))
      .collect();
    
    for (const file of files) {
      await ctx.db.delete(file._id);
    }
    
    await ctx.db.delete(args.appointmentId);
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

