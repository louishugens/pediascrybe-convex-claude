import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getTodayRange, getWeekRange } from "./timezone";

// ==================== Helper ====================

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function calculateAge(birthdate: number): { years: number; months: number; label: string } {
  const now = new Date();
  const birth = new Date(birthdate);
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  const label = years > 0 ? `${years}y` : `${months}m`;
  return { years, months: years * 12 + months, label };
}

/**
 * Get the WHO percentile position for a measurement at a given age.
 * Returns a string like "between 50th and 85th" or "above 97th".
 */
function getPercentilePosition(
  value: number,
  ageInDays: number,
  chart: { p03: number[]; p15: number[]; p50: number[]; p85: number[]; p97: number[] }
): string {
  const p03 = chart.p03[ageInDays];
  const p15 = chart.p15[ageInDays];
  const p50 = chart.p50[ageInDays];
  const p85 = chart.p85[ageInDays];
  const p97 = chart.p97[ageInDays];

  if (p03 === undefined) return "no reference data for this age";

  if (value < p03) return "below 3rd percentile";
  if (value < p15) return "between 3rd and 15th percentile";
  if (value < p50) return "between 15th and 50th percentile";
  if (value < p85) return "between 50th and 85th percentile";
  if (value < p97) return "between 85th and 97th percentile";
  return "above 97th percentile";
}

/**
 * Get WHO chart reference data for a chart type + sex.
 * Used by growth chart PDF generator.
 */
export const getChartReferenceData = internalQuery({
  args: {
    chartId: v.string(),
  },
  handler: async (ctx, args) => {
    const chart = await ctx.db
      .query("charts")
      .withIndex("by_chartId", (q) => q.eq("chartId", args.chartId))
      .first();
    if (!chart) return null;
    return {
      p03: chart.p03,
      p15: chart.p15,
      p50: chart.p50,
      p85: chart.p85,
      p97: chart.p97,
    };
  },
});

// ==================== Utility Queries ====================

/**
 * Get all patients in a given age range (for batch operations).
 */
export const getAllPatientsInAgeRange = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    minAgeMonths: v.number(),
    maxAgeMonths: v.number(),
  },
  handler: async (ctx, args) => {
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    const now = new Date();

    return patients
      .map((p) => {
        const birth = new Date(p.birthdate);
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        if (months < 0) { years--; months += 12; }
        const totalMonths = years * 12 + months;
        const ageLabel = years > 0 ? `${years}y` : `${totalMonths}m`;
        return { ...p, totalMonths, ageLabel };
      })
      .filter((p) => p.totalMonths >= args.minAgeMonths && p.totalMonths <= args.maxAgeMonths);
  },
});

// ==================== Doctor Queries ====================

/**
 * Get doctor by ID (internal).
 */
export const getDoctorById = internalQuery({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.doctorId);
  },
});

// ==================== Patient Queries ====================

/**
 * Search doctor's patients by name (fuzzy search using Convex search index).
 */
export const searchPatients = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    // Use the search index on firstname
    const results = await ctx.db
      .query("patients")
      .withSearchIndex("search_patients", (q) =>
        q.search("firstname", args.query).eq("doctorId", args.doctorId)
      )
      .take(10);

    // Also try matching by lastname (search index is only on firstname)
    const allPatients = await ctx.db
      .query("patients")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    const queryLower = args.query.toLowerCase();
    const lastNameMatches = allPatients.filter(
      (p) =>
        p.lastname.toLowerCase().includes(queryLower) &&
        !results.some((r) => r._id === p._id)
    );

    const combined = [...results, ...lastNameMatches].slice(0, 10);

    return combined.map((p) => ({
      _id: p._id,
      firstname: p.firstname,
      lastname: p.lastname,
      sex: p.sex,
      age: calculateAge(p.birthdate),
      birthdate: p.birthdate,
      allergies: p.allergies,
      phone: p.phone,
    }));
  },
});

/**
 * Get full patient summary: demographics, allergies, history, recent vitals, meds.
 */
export const getPatientSummary = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.doctorId !== args.doctorId) {
      throw new Error("Patient not found or access denied");
    }

    // Get recent appointments (last 5)
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId_startDate", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(5);

    // Get vaccination records
    const vaccinations = await ctx.db
      .query("vaccinationRecords")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();

    const age = calculateAge(patient.birthdate);
    const lastAppt = appointments[0];

    return {
      _id: patient._id,
      firstname: patient.firstname,
      lastname: patient.lastname,
      sex: patient.sex,
      age,
      birthdate: patient.birthdate,
      allergies: patient.allergies,
      history: patient.history,
      bloodtype: patient.bloodtype,
      electrophoresis: patient.electrophoresis,
      phone: patient.phone,
      mothername: patient.mothername,
      lastVitals: lastAppt
        ? {
            date: lastAppt.startDate,
            weight: lastAppt.weight,
            height: lastAppt.height,
            head: lastAppt.head,
            temperature: lastAppt.temperature,
            pulse: lastAppt.pulse,
            sao2: lastAppt.sao2,
          }
        : null,
      lastMedication: lastAppt?.medication || null,
      recentAppointments: appointments.map((a) => ({
        _id: a._id,
        date: a.startDate,
        motif: a.motif,
        findings: a.findings,
        recommendation: a.recommendation,
        medication: a.medication,
        exams: a.exams,
      })),
      vaccinationCount: vaccinations.length,
    };
  },
});

/**
 * Get all appointments for a patient (filterable by date range).
 */
export const getPatientAppointments = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.doctorId !== args.doctorId) {
      throw new Error("Patient not found or access denied");
    }

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId_startDate", (q) =>
        q.eq("patientId", args.patientId)
      )
      .collect();

    return appointments
      .filter((a) => {
        if (args.startDate && a.startDate < args.startDate) return false;
        if (args.endDate && a.startDate > args.endDate) return false;
        return true;
      })
      .map((a) => ({
        _id: a._id,
        date: a.startDate,
        motif: a.motif,
        findings: a.findings,
        recommendation: a.recommendation,
        medication: a.medication,
        exams: a.exams,
        weight: a.weight,
        height: a.height,
        status: a.status,
      }));
  },
});

/**
 * Get vaccination records + what's due next.
 */
export const getVaccinationRecords = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.doctorId !== args.doctorId) {
      throw new Error("Patient not found or access denied");
    }

    const records = await ctx.db
      .query("vaccinationRecords")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();

    // Get vaccine names
    const recordsWithNames = await Promise.all(
      records.map(async (r) => {
        const vaccine = await ctx.db.get(r.vaccinId);
        const dose = await ctx.db.get(r.doseId);
        return {
          vaccineName: vaccine?.name || "Unknown",
          doseType: dose?.doseType,
          date: r.date,
          manufacturer: r.manufacturer,
          notes: r.notes,
        };
      })
    );

    // Get all doctor's vaccines to determine what's due
    const allVaccines = await ctx.db
      .query("vaccins")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    const givenVaccineIds = new Set(records.map((r) => r.vaccinId));
    const age = calculateAge(patient.birthdate);

    // Simple "due" check: vaccines the doctor tracks that patient hasn't received
    const possiblyDue = allVaccines
      .filter((v) => !givenVaccineIds.has(v._id))
      .map((v) => v.name);

    return {
      records: recordsWithNames,
      possiblyDue,
      totalReceived: records.length,
      patientAge: age,
    };
  },
});

/**
 * Get patient growth data over time.
 */
export const getPatientGrowthData = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.doctorId !== args.doctorId) {
      throw new Error("Patient not found or access denied");
    }

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId_startDate", (q) => q.eq("patientId", args.patientId))
      .order("asc")
      .collect();

    const growthData = appointments
      .filter((a) => a.weight || a.height || a.head)
      .map((a) => ({
        date: a.startDate,
        weight: a.weight,
        height: a.height,
        head: a.head,
        arm: a.arm,
      }));

    const age = calculateAge(patient.birthdate);

    // Load WHO reference data for percentile calculation
    const sexPrefix = patient.sex === "female" ? "g" : "b";
    const wfaChart = await ctx.db
      .query("charts")
      .withIndex("by_chartId", (q) => q.eq("chartId", `${sexPrefix}wfa`))
      .first();
    const hfaChart = await ctx.db
      .query("charts")
      .withIndex("by_chartId", (q) => q.eq("chartId", `${sexPrefix}hfa`))
      .first();
    const hcfaChart = await ctx.db
      .query("charts")
      .withIndex("by_chartId", (q) => q.eq("chartId", `${sexPrefix}hcfa`))
      .first();

    // Calculate percentile position for each data point
    const enrichedData = growthData.map((dp) => {
      const ageInDays = Math.round(
        (dp.date - patient.birthdate) / (1000 * 60 * 60 * 24)
      );
      const percentiles: any = {};

      if (dp.weight && wfaChart && ageInDays < wfaChart.p50.length) {
        percentiles.weight = getPercentilePosition(
          dp.weight,
          ageInDays,
          wfaChart
        );
      }
      if (dp.height && hfaChart && ageInDays < hfaChart.p50.length) {
        percentiles.height = getPercentilePosition(
          dp.height,
          ageInDays,
          hfaChart
        );
      }
      if (dp.head && hcfaChart && ageInDays < hcfaChart.p50.length) {
        percentiles.head = getPercentilePosition(
          dp.head,
          ageInDays,
          hcfaChart
        );
      }

      return { ...dp, ageInDays, percentiles };
    });

    return {
      patientName: `${patient.firstname} ${patient.lastname}`,
      sex: patient.sex,
      age,
      birthdate: patient.birthdate,
      dataPoints: enrichedData,
    };
  },
});

// ==================== Schedule Queries ====================

/**
 * Get today's appointments for the doctor.
 */
export const getTodaySchedule = internalQuery({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await ctx.db.get(args.doctorId);
    const { startOfDay, endOfDay } = getTodayRange(doctor?.timezone);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) =>
        q.eq("doctorId", args.doctorId).gte("startDate", startOfDay)
      )
      .collect();

    const todayAppts = appointments.filter((a) => a.startDate < endOfDay);

    // Enrich with patient names
    const enriched = await Promise.all(
      todayAppts.map(async (a) => {
        const patient = await ctx.db.get(a.patientId);
        return {
          _id: a._id,
          time: a.startDate,
          patientName: patient
            ? `${patient.firstname} ${patient.lastname}`
            : "Unknown",
          patientId: a.patientId,
          patientAge: patient ? calculateAge(patient.birthdate) : null,
          patientSex: patient?.sex,
          motif: a.motif,
          status: a.status,
        };
      })
    );

    return enriched.sort((a, b) => a.time - b.time);
  },
});

/**
 * Get this week's appointments for the doctor.
 */
export const getWeekSchedule = internalQuery({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await ctx.db.get(args.doctorId);
    const { startOfWeek, endOfWeek } = getWeekRange(doctor?.timezone);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) =>
        q.eq("doctorId", args.doctorId).gte("startDate", startOfWeek)
      )
      .collect();

    const weekAppts = appointments.filter((a) => a.startDate < endOfWeek);

    const enriched = await Promise.all(
      weekAppts.map(async (a) => {
        const patient = await ctx.db.get(a.patientId);
        return {
          _id: a._id,
          time: a.startDate,
          patientName: patient
            ? `${patient.firstname} ${patient.lastname}`
            : "Unknown",
          patientId: a.patientId,
          motif: a.motif,
          status: a.status,
        };
      })
    );

    return enriched.sort((a, b) => a.time - b.time);
  },
});

/**
 * Get available appointment slots for a given date.
 */
export const getAvailableSlots = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    date: v.string(), // "2026-03-30" ISO date
  },
  handler: async (ctx, args) => {
    const doctor = await ctx.db.get(args.doctorId);
    if (!doctor) throw new Error("Doctor not found");

    const targetDate = new Date(args.date);
    const dayOfWeek = targetDate.getDay();

    // Get doctor's availability for this day
    const availability = doctor.availability?.find((a) => a.day === dayOfWeek);
    if (!availability) return { slots: [], message: "No availability set for this day" };

    // Get existing appointments for this date
    const startOfDay = new Date(args.date).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const existingAppts = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) =>
        q.eq("doctorId", args.doctorId).gte("startDate", startOfDay)
      )
      .collect();

    const dayAppts = existingAppts.filter((a) => a.startDate < endOfDay);
    const bookedTimes = new Set(
      dayAppts.map((a) => {
        const d = new Date(a.startDate);
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      })
    );

    // Generate slots
    const duration = doctor.duration || 30; // minutes
    const slots: string[] = [];
    const [startH, startM] = availability.startTime.split(":").map(Number);
    const [endH, endM] = availability.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      if (!bookedTimes.has(timeStr)) {
        slots.push(timeStr);
      }
    }

    return { slots, date: args.date };
  },
});

// ==================== Analytics Queries ====================

/**
 * Get daily analytics (revenue, patient count, appointment stats).
 */
export const getDailyAnalytics = internalQuery({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doctor = await ctx.db.get(args.doctorId);
    const { startOfDay, endOfDay } = getTodayRange(doctor?.timezone);

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) =>
        q.eq("doctorId", args.doctorId).gte("startDate", startOfDay)
      )
      .collect();

    const todayAppts = appointments.filter((a) => a.startDate < endOfDay);
    const totalRevenue = todayAppts.reduce((sum, a) => sum + (a.cost || 0), 0);
    const paidCount = todayAppts.filter((a) => a.status === "paid").length;

    return {
      date: new Date(startOfDay).toISOString().split("T")[0],
      totalAppointments: todayAppts.length,
      paidAppointments: paidCount,
      totalRevenue,
      patients: todayAppts.length,
    };
  },
});

/**
 * Get monthly analytics for the doctor.
 */
export const getMonthlyAnalytics = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    month: v.optional(v.string()), // "2026-03" format
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const targetMonth = args.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, month] = targetMonth.split("-").map(Number);

    const startOfMonth = new Date(year, month - 1, 1).getTime();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId_startDate", (q) =>
        q.eq("doctorId", args.doctorId).gte("startDate", startOfMonth)
      )
      .collect();

    const monthAppts = appointments.filter((a) => a.startDate <= endOfMonth);
    const totalRevenue = monthAppts.reduce((sum, a) => sum + (a.cost || 0), 0);
    const paidCount = monthAppts.filter((a) => a.status === "paid").length;

    // Unique patients this month
    const uniquePatients = new Set(monthAppts.map((a) => a.patientId)).size;

    // Daily breakdown
    const dailyMap = new Map<string, { count: number; revenue: number }>();
    for (const appt of monthAppts) {
      const day = new Date(appt.startDate).toISOString().split("T")[0];
      const existing = dailyMap.get(day) || { count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += appt.cost || 0;
      dailyMap.set(day, existing);
    }

    return {
      month: targetMonth,
      totalAppointments: monthAppts.length,
      paidAppointments: paidCount,
      totalRevenue,
      uniquePatients,
      averagePerDay: monthAppts.length > 0
        ? +(monthAppts.length / dailyMap.size).toFixed(1)
        : 0,
      workingDays: dailyMap.size,
    };
  },
});

/**
 * Get reports for a patient (medical reports, certificates, reference notes).
 */
export const getPatientReports = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.doctorId !== args.doctorId) {
      throw new Error("Patient not found or access denied");
    }

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();

    return reports.map((r) => ({
      _id: r._id,
      type: r.reportType,
      content: r.content.slice(0, 200) + (r.content.length > 200 ? "..." : ""),
      createdAt: r.createdAt,
    }));
  },
});

/**
 * Get receipts for a patient.
 */
export const getPatientReceipts = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    if (!patient || patient.doctorId !== args.doctorId) {
      throw new Error("Patient not found or access denied");
    }

    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(10);

    return receipts.map((r) => ({
      _id: r._id,
      cost: r.cost,
      currency: r.currency,
      services: r.services,
      date: r.date,
      createdAt: r.createdAt,
    }));
  },
});

// ==================== Message Storage ====================

/**
 * Store a WhatsApp message (user or assistant).
 */
export const storeMessage = internalMutation({
  args: {
    doctorId: v.id("doctors"),
    whatsappMessageId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    toolCalls: v.optional(v.string()),
    patientId: v.optional(v.id("patients")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("whatsappMessages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get recent conversation history for context.
 */
export const getConversationHistory = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20; // 10 message pairs = 20 messages
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    const cutoff = Date.now() - SESSION_TIMEOUT_MS;

    const messages = await ctx.db
      .query("whatsappMessages")
      .withIndex("by_doctorId_createdAt", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .take(limit);

    // Filter to only messages within the session window
    const sessionMessages = messages.filter((m) => m.createdAt > cutoff);

    // Return in chronological order
    return sessionMessages.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  },
});

// ==================== Pending Actions ====================

/**
 * Create a pending action (proposal waiting for doctor review).
 */
export const createPendingAction = internalMutation({
  args: {
    doctorId: v.id("doctors"),
    action: v.string(),
    patientId: v.optional(v.id("patients")),
    appointmentId: v.optional(v.id("appointments")),
    proposedData: v.string(),
    preview: v.string(),
    linkedActionId: v.optional(v.id("whatsappPendingActions")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("whatsappPendingActions", {
      ...args,
      status: "pending",
      expiresAt: now + 10 * 60 * 1000, // 10 min
      createdAt: now,
    });
  },
});

/**
 * Get the latest pending action for a doctor.
 */
export const getLatestPendingAction = internalQuery({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const action = await ctx.db
      .query("whatsappPendingActions")
      .withIndex("by_doctorId_status", (q) =>
        q.eq("doctorId", args.doctorId).eq("status", "pending")
      )
      .order("desc")
      .first();

    if (action && Date.now() > action.expiresAt) {
      // Expired — caller should handle via expirePendingAction mutation
      return null;
    }

    return action;
  },
});

/**
 * Expire a pending action (separate mutation since queries can't write).
 */
export const expirePendingAction = internalMutation({
  args: { actionId: v.id("whatsappPendingActions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.actionId, { status: "expired" });
  },
});

/**
 * Update a pending action status.
 */
export const updatePendingAction = internalMutation({
  args: {
    actionId: v.id("whatsappPendingActions"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("edited"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    proposedData: v.optional(v.string()),
    editHistory: v.optional(v.string()),
    resultEntityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { actionId, ...updates } = args;
    const patch: any = {};
    if (updates.status) patch.status = updates.status;
    if (updates.proposedData) patch.proposedData = updates.proposedData;
    if (updates.editHistory) patch.editHistory = updates.editHistory;
    if (updates.resultEntityId) patch.resultEntityId = updates.resultEntityId;
    await ctx.db.patch(actionId, patch);
  },
});

// ==================== Usage (Internal, by doctorId) ====================

/**
 * Increment ScrybeGPT usage by doctorId (no auth context needed).
 */
export const incrementUsageByDoctorId = internalMutation({
  args: {
    doctorId: v.id("doctors"),
    field: v.union(
      v.literal("scrybegptMessages"),
      v.literal("aiPrescription"),
      v.literal("aiLabExam"),
      v.literal("aiDiagnostic"),
      v.literal("aiReport")
    ),
  },
  handler: async (ctx, args) => {
    const period = getCurrentPeriod();
    const now = Date.now();

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", args.doctorId).eq("period", period)
      )
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        [args.field]: ((usage as any)[args.field] || 0) + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("usage", {
        doctorId: args.doctorId,
        period,
        scrybegptMessages: args.field === "scrybegptMessages" ? 1 : 0,
        aiPrescription: args.field === "aiPrescription" ? 1 : 0,
        aiLabExam: args.field === "aiLabExam" ? 1 : 0,
        aiDiagnostic: args.field === "aiDiagnostic" ? 1 : 0,
        aiReport: args.field === "aiReport" ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Check if doctor has remaining ScrybeGPT quota.
 */
export const checkQuotaByDoctorId = internalQuery({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const period = getCurrentPeriod();

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_doctorId_period", (q) =>
        q.eq("doctorId", args.doctorId).eq("period", period)
      )
      .first();

    const currentUsage = usage?.scrybegptMessages || 0;

    // Get subscription tier limits
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .first();

    if (!subscription || !["trialing", "active"].includes(subscription.status)) {
      return { allowed: false, reason: "No active subscription", remaining: 0 };
    }

    const tierName = subscription.tierName || subscription.metadata?.tierName;
    if (!tierName) {
      return { allowed: false, reason: "No subscription tier", remaining: 0 };
    }

    const tier = await ctx.db
      .query("subscriptionTiers")
      .withIndex("by_name", (q) => q.eq("name", tierName))
      .first();

    if (!tier) {
      return { allowed: false, reason: "Tier not found", remaining: 0 };
    }

    const limit = tier.limits.scrybegptMessages;
    if (limit === -1) return { allowed: true, remaining: -1 }; // Unlimited

    const remaining = Math.max(0, limit - currentUsage);
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: `Monthly ScrybeGPT limit reached (${limit}). Upgrade for more.`,
        remaining: 0,
      };
    }

    return { allowed: true, remaining };
  },
});

/**
 * Check if doctor has access to WhatsApp feature based on subscription tier.
 */
export const checkFeatureAccess = internalQuery({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .first();

    if (!subscription || !["trialing", "active"].includes(subscription.status)) {
      return { hasAccess: false, reason: "No active subscription" };
    }

    // Determine tier name from multiple sources (matching main app logic)
    let tierName = subscription.tierName || subscription.metadata?.tierName;

    // Fallback: check appUser.plan via doctor's authUserId
    if (!tierName) {
      const doctor = await ctx.db.get(args.doctorId);
      if (doctor?.authUserId) {
        const appUser = await ctx.db
          .query("appUsers")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", doctor.authUserId))
          .first();
        if (appUser?.plan && appUser.plan !== "none") {
          tierName = appUser.plan;
        }
      }
    }

    if (!tierName || !["pro", "premium"].includes(tierName.toLowerCase())) {
      return {
        hasAccess: false,
        reason: "WhatsApp ScrybeGPT requires a Pro or Premium subscription. Upgrade at pediascrybe.com/pricing",
      };
    }

    return { hasAccess: true };
  },
});

// ==================== Appointment Detail Query (for PDF) ====================

/**
 * Get a single appointment with full details for PDF generation.
 */
export const getAppointmentForPdf = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const appt = await ctx.db.get(args.appointmentId);
    if (!appt) throw new Error("Appointment not found");

    const patient = await ctx.db.get(appt.patientId);
    if (!patient || patient.doctorId !== args.doctorId) {
      throw new Error("Patient not found or access denied");
    }

    return {
      appointment: {
        _id: appt._id,
        date: appt.startDate,
        motif: appt.motif,
        findings: appt.findings,
        recommendation: appt.recommendation,
        medication: appt.medication || [],
        exams: appt.exams || [],
        weight: appt.weight,
        height: appt.height,
        status: appt.status,
      },
      patient: {
        _id: patient._id,
        firstname: patient.firstname,
        lastname: patient.lastname,
        sex: patient.sex,
        birthdate: patient.birthdate,
        allergies: patient.allergies,
      },
    };
  },
});

/**
 * Get a receipt with patient info for PDF generation.
 */
export const getReceiptForPdf = internalQuery({
  args: {
    doctorId: v.id("doctors"),
    receiptId: v.id("receipts"),
  },
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt) throw new Error("Receipt not found");

    const patient = await ctx.db.get(receipt.patientId);
    if (!patient || patient.doctorId !== args.doctorId) {
      throw new Error("Patient not found or access denied");
    }

    return {
      receipt: {
        _id: receipt._id,
        date: receipt.date || receipt.createdAt,
        services: receipt.services || [],
        currency: receipt.currency || "HTG",
        cost: receipt.cost,
      },
      patient: {
        _id: patient._id,
        firstname: patient.firstname,
        lastname: patient.lastname,
        sex: patient.sex,
        birthdate: patient.birthdate,
        allergies: patient.allergies,
      },
    };
  },
});

// ==================== Write Action Execution ====================

/**
 * Execute a confirmed write action.
 * Called after the doctor confirms a pending action.
 */
export const executeWriteAction = internalMutation({
  args: {
    actionId: v.id("whatsappPendingActions"),
    doctorId: v.id("doctors"),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.actionId);
    if (!action) throw new Error("Pending action not found");
    if (action.doctorId !== args.doctorId) throw new Error("Access denied");
    if (action.status !== "pending") {
      return { success: false, message: `Action is already ${action.status}` };
    }
    if (Date.now() > action.expiresAt) {
      await ctx.db.patch(args.actionId, { status: "expired" });
      return { success: false, message: "Action expired. Please try again." };
    }

    const data = JSON.parse(action.proposedData);
    const now = Date.now();

    switch (action.action) {
      case "createPatient": {
        const patientId = await ctx.db.insert("patients", {
          doctorId: args.doctorId,
          firstname: data.firstname,
          lastname: data.lastname,
          birthdate: data.birthdate,
          sex: data.sex,
          mothername: data.mothername,
          phone: data.phone,
          allergies: data.allergies,
          isCompleted: false,
          createdAt: now,
          updatedAt: now,
        });
        await ctx.db.patch(args.actionId, {
          status: "confirmed",
          resultEntityId: patientId,
        });
        return { success: true, message: `Patient ${data.firstname} ${data.lastname} created.`, entityId: patientId };
      }

      case "createAppointment": {
        const apptId = await ctx.db.insert("appointments", {
          doctorId: args.doctorId,
          patientId: data.patientId as Id<"patients">,
          startDate: data.startDate,
          motif: data.motif,
          cost: data.cost,
          status: "pending",
        });
        await ctx.db.patch(args.actionId, {
          status: "confirmed",
          resultEntityId: apptId,
        });
        return { success: true, message: "Appointment scheduled.", entityId: apptId };
      }

      case "addAppointmentNote": {
        const apptId = data.appointmentId as Id<"appointments">;
        const appt = await ctx.db.get(apptId);
        if (!appt || appt.doctorId !== args.doctorId) throw new Error("Appointment not found");

        const updates: any = {};
        for (const field of ["internalNotes", "findings", "recommendation", "otherRemarks"]) {
          if (data[field]) updates[field] = data[field];
        }
        await ctx.db.patch(apptId, updates);
        await ctx.db.patch(args.actionId, { status: "confirmed", resultEntityId: apptId });
        return { success: true, message: "Notes added to appointment." };
      }

      case "recordVitals": {
        const apptId = data.appointmentId as Id<"appointments">;
        const appt = await ctx.db.get(apptId);
        if (!appt || appt.doctorId !== args.doctorId) throw new Error("Appointment not found");

        const vitalFields = ["weight", "height", "head", "temperature", "pulse", "sao2", "respiratory", "systolic", "diastolic"];
        const updates: any = {};
        for (const field of vitalFields) {
          if (data[field] !== undefined) updates[field] = data[field];
        }
        await ctx.db.patch(apptId, updates);
        await ctx.db.patch(args.actionId, { status: "confirmed", resultEntityId: apptId });
        return { success: true, message: "Vitals recorded." };
      }

      case "logVaccination": {
        // Find the vaccine by name (or create a note)
        const vaccines = await ctx.db
          .query("vaccins")
          .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
          .collect();

        const matchedVaccine = vaccines.find(
          (v) => v.name.toLowerCase() === data.vaccineName.toLowerCase()
        );

        if (!matchedVaccine) {
          await ctx.db.patch(args.actionId, { status: "cancelled" });
          return {
            success: false,
            message: `Vaccine "${data.vaccineName}" not found in your tracked vaccines. Add it in the web app first.`,
          };
        }

        // Get or create a dose record
        const doses = await ctx.db
          .query("doses")
          .withIndex("by_vaccinId", (q) => q.eq("vaccinId", matchedVaccine._id))
          .collect();

        if (doses.length === 0) {
          await ctx.db.patch(args.actionId, { status: "cancelled" });
          return {
            success: false,
            message: `No dose definitions found for ${data.vaccineName}. Set up doses in the web app first.`,
          };
        }

        const doseId = doses[0]._id; // Use first dose definition

        await ctx.db.insert("vaccinationRecords", {
          patientId: data.patientId as Id<"patients">,
          vaccinId: matchedVaccine._id,
          doseId,
          date: data.date || now,
          manufacturer: data.manufacturer,
          lotNumber: data.lotNumber,
          dosage: data.dosage,
          route: data.route,
          site: data.site,
          expiration: now + 365 * 24 * 60 * 60 * 1000, // 1 year default
          notes: `Recorded via WhatsApp ScrybeGPT`,
        });

        await ctx.db.patch(args.actionId, { status: "confirmed" });
        return { success: true, message: `${data.vaccineName} vaccination recorded.` };
      }

      case "diagnostic":
      case "medication":
      case "labExam": {
        // Clinical proposals are saved to the appointment's medical fields
        if (action.appointmentId) {
          const appt = await ctx.db.get(action.appointmentId);
          if (!appt || appt.doctorId !== args.doctorId) throw new Error("Appointment not found");

          if (action.action === "medication" && data.medications) {
            const existingMeds = appt.medication || [];
            const newMeds = data.medications.map((m: any) => ({
              drug: m.drug || m.name,
              count: m.count || 1,
              unit: m.unit || m.dose || "",
              posology: m.posology || `${m.frequency || ""} ${m.duration || ""}`.trim(),
            }));
            await ctx.db.patch(action.appointmentId, {
              medication: [...existingMeds, ...newMeds],
            });
          }

          if (action.action === "labExam" && data.exams) {
            const existingExams = appt.exams || [];
            const newExams = data.exams.map((e: any) => ({
              exam: e.name || e.exam,
            }));
            await ctx.db.patch(action.appointmentId, {
              exams: [...existingExams, ...newExams],
            });
          }

          if (action.action === "diagnostic" && data.diagnoses) {
            const findings = data.diagnoses.map((d: any, i: number) =>
              `${i + 1}. ${d.name}${d.likelihood ? ` (${d.likelihood})` : ""}`
            ).join("\n");
            const existingFindings = appt.findings || "";
            await ctx.db.patch(action.appointmentId, {
              findings: existingFindings
                ? `${existingFindings}\n\n--- ScrybeGPT ---\n${findings}`
                : findings,
            });
          }
        }

        await ctx.db.patch(args.actionId, { status: "confirmed" });
        return { success: true, message: `${action.action} saved to appointment record.` };
      }

      default:
        return { success: false, message: `Unknown action type: ${action.action}` };
    }
  },
});

/**
 * Undo the most recent confirmed write action for a doctor.
 * Only supports undoing actions that created new records (createPatient, createAppointment, logVaccination).
 * For patch-based actions (addAppointmentNote, recordVitals, diagnostic, medication, labExam),
 * undo is not supported since we'd need to store the previous state.
 */
export const undoLastWriteAction = internalMutation({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    // Find the most recent confirmed action with a resultEntityId
    const actions = await ctx.db
      .query("whatsappPendingActions")
      .withIndex("by_doctorId_status", (q) =>
        q.eq("doctorId", args.doctorId).eq("status", "confirmed")
      )
      .order("desc")
      .take(5);

    const lastAction = actions[0];
    if (!lastAction) {
      return { success: false, message: "No recent actions to undo." };
    }

    // Only allow undo within 5 minutes
    if (Date.now() - lastAction.createdAt > 5 * 60 * 1000) {
      return { success: false, message: "Can only undo actions within the last 5 minutes." };
    }

    switch (lastAction.action) {
      case "createPatient": {
        if (lastAction.resultEntityId) {
          const patientId = lastAction.resultEntityId as Id<"patients">;
          const patient = await ctx.db.get(patientId);
          if (patient && patient.doctorId === args.doctorId) {
            await ctx.db.delete(patientId);
            await ctx.db.patch(lastAction._id, { status: "cancelled" });
            return { success: true, message: `Patient record deleted.` };
          }
        }
        return { success: false, message: "Could not find the patient to delete." };
      }

      case "createAppointment": {
        if (lastAction.resultEntityId) {
          const apptId = lastAction.resultEntityId as Id<"appointments">;
          const appt = await ctx.db.get(apptId);
          if (appt && appt.doctorId === args.doctorId) {
            await ctx.db.delete(apptId);
            await ctx.db.patch(lastAction._id, { status: "cancelled" });
            return { success: true, message: `Appointment deleted.` };
          }
        }
        return { success: false, message: "Could not find the appointment to delete." };
      }

      default:
        return {
          success: false,
          message: `Undo is not supported for "${lastAction.action}" actions. Only patient creation and appointment scheduling can be undone.`,
        };
    }
  },
});
