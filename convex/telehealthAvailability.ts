import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// ==================== Auth Helpers ====================

async function getAuthenticatedDoctor(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const doctor = await ctx.db
    .query("doctors")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
    .first();

  if (!doctor) throw new Error("Doctor not found");
  return doctor;
}

async function verifyTelehealthAccess(ctx: QueryCtx | MutationCtx, doctorId: Id<"doctors">) {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_doctorId", (q) => q.eq("doctorId", doctorId))
    .order("desc")
    .first();

  if (!subscription) throw new Error("No active subscription");

  const activeStatuses = ["trialing", "active"];
  if (!activeStatuses.includes(subscription.status)) {
    throw new Error("Subscription is not active");
  }

  const tierName = subscription.tierName || subscription.metadata?.tierName || "free";
  if (!["professional", "complete", "institution"].includes(tierName)) {
    throw new Error("Telehealth requires a Professional or Complete subscription");
  }
}

// ==================== Helpers ====================

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function slotsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const a0 = timeToMinutes(aStart);
  const a1 = timeToMinutes(aEnd);
  const b0 = timeToMinutes(bStart);
  const b1 = timeToMinutes(bEnd);
  return a0 < b1 && b0 < a1;
}

// ==================== Queries ====================

// Doctor gets own weekly schedule
export const getMyAvailability = query({
  args: {},
  handler: async (ctx) => {
    const doctor = await getAuthenticatedDoctor(ctx);

    return await ctx.db
      .query("telehealthAvailability")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();
  },
});

// Get doctor's exceptions (blocked dates)
export const getMyExceptions = query({
  args: {},
  handler: async (ctx) => {
    const doctor = await getAuthenticatedDoctor(ctx);

    return await ctx.db
      .query("telehealthExceptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();
  },
});

// Public query: for a given date, returns available time slots
export const getAvailableSlots = query({
  args: {
    doctorId: v.id("doctors"),
    date: v.string(), // "2026-03-15"
  },
  handler: async (ctx, args) => {
    // Parse the date to get day of week
    const dateObj = new Date(args.date + "T00:00:00");
    const dayOfWeek = dateObj.getUTCDay();

    // 1. Get ALL active recurring schedules for that day
    const schedules = await ctx.db
      .query("telehealthAvailability")
      .withIndex("by_doctorId_dayOfWeek", (q) =>
        q.eq("doctorId", args.doctorId).eq("dayOfWeek", dayOfWeek)
      )
      .collect();

    const activeSchedules = schedules.filter((s) => s.isActive);
    if (activeSchedules.length === 0) return [];

    // 2. Check if this date is blocked by an exception
    const exceptions = await ctx.db
      .query("telehealthExceptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    const isBlocked = exceptions.some((e) => e.date === args.date);
    if (isBlocked) return [];

    // 3. Get already-booked telehealth appointments for this date
    const booked = await ctx.db
      .query("telehealthAppointments")
      .withIndex("by_doctorId_date", (q) =>
        q.eq("doctorId", args.doctorId).eq("date", args.date)
      )
      .collect();

    const bookedSlots = booked
      .filter((a) => !["cancelled", "no_show"].includes(a.status))
      .map((a) => ({ startTime: a.startTime, endTime: a.endTime }));

    // 4. Generate all possible slots from ALL active schedules
    const slots: { startTime: string; endTime: string }[] = [];

    for (const schedule of activeSchedules) {
      const startMinutes = timeToMinutes(schedule.startTime);
      const endMinutes = timeToMinutes(schedule.endTime);
      const duration = schedule.slotDurationMinutes;

      for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
        const slotStart = minutesToTime(m);
        const slotEnd = minutesToTime(m + duration);

        // Check if slot overlaps with any booked appointment
        const isBooked = bookedSlots.some((b) =>
          slotsOverlap(slotStart, slotEnd, b.startTime, b.endTime)
        );

        if (!isBooked) {
          slots.push({ startTime: slotStart, endTime: slotEnd });
        }
      }
    }

    // Sort by start time
    slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    return slots;
  },
});

// Get dates with available slots for a month (for calendar dots)
export const getAvailableDates = query({
  args: {
    doctorId: v.id("doctors"),
    year: v.number(),
    month: v.number(), // 1-12
  },
  handler: async (ctx, args) => {
    // Get all active schedules for this doctor
    const schedules = await ctx.db
      .query("telehealthAvailability")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    const activeSchedules = schedules.filter((s) => s.isActive);
    if (activeSchedules.length === 0) return [];

    const activeDays = new Set(activeSchedules.map((s) => s.dayOfWeek));

    // Get exceptions for this month
    const exceptions = await ctx.db
      .query("telehealthExceptions")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    const monthPrefix = `${args.year}-${String(args.month).padStart(2, "0")}`;
    const blockedDates = new Set(
      exceptions.filter((e) => e.date.startsWith(monthPrefix)).map((e) => e.date)
    );

    // Generate dates in the month that match active days and aren't blocked
    const dates: string[] = [];
    const daysInMonth = new Date(args.year, args.month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${args.year}-${String(args.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dateObj = new Date(dateStr + "T00:00:00");
      const dow = dateObj.getUTCDay();

      if (activeDays.has(dow) && !blockedDates.has(dateStr)) {
        dates.push(dateStr);
      }
    }

    return dates;
  },
});

// ==================== Mutations ====================

// Add a new availability slot for a day of week (multiple slots per day allowed, no overlaps)
export const addSlot = mutation({
  args: {
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    slotDurationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    await verifyTelehealthAccess(ctx, doctor._id);

    if (args.dayOfWeek < 0 || args.dayOfWeek > 6) {
      throw new Error("Invalid day of week");
    }
    if (args.slotDurationMinutes < 15 || args.slotDurationMinutes > 120) {
      throw new Error("Slot duration must be between 15 and 120 minutes");
    }
    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(args.startTime) || !timeRegex.test(args.endTime)) {
      throw new Error("Invalid time format. Use HH:MM (24-hour)");
    }
    if (timeToMinutes(args.startTime) >= timeToMinutes(args.endTime)) {
      throw new Error("Start time must be before end time");
    }

    // Check for overlap with existing active slots on this day
    const existing = await ctx.db
      .query("telehealthAvailability")
      .withIndex("by_doctorId_dayOfWeek", (q) =>
        q.eq("doctorId", doctor._id).eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();

    const activeSlots = existing.filter((s) => s.isActive);

    for (const slot of activeSlots) {
      if (slotsOverlap(args.startTime, args.endTime, slot.startTime, slot.endTime)) {
        throw new Error(
          `Overlaps with existing slot ${slot.startTime}–${slot.endTime}`
        );
      }
    }

    return await ctx.db.insert("telehealthAvailability", {
      doctorId: doctor._id,
      dayOfWeek: args.dayOfWeek,
      startTime: args.startTime,
      endTime: args.endTime,
      slotDurationMinutes: args.slotDurationMinutes,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Update an existing slot
export const updateSlot = mutation({
  args: {
    slotId: v.id("telehealthAvailability"),
    startTime: v.string(),
    endTime: v.string(),
    slotDurationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    await verifyTelehealthAccess(ctx, doctor._id);

    const slot = await ctx.db.get(args.slotId);
    if (!slot || slot.doctorId !== doctor._id) {
      throw new Error("Slot not found");
    }

    if (args.slotDurationMinutes < 15 || args.slotDurationMinutes > 120) {
      throw new Error("Slot duration must be between 15 and 120 minutes");
    }
    if (timeToMinutes(args.startTime) >= timeToMinutes(args.endTime)) {
      throw new Error("Start time must be before end time");
    }

    // Check for overlap with other active slots on same day (excluding self)
    const existing = await ctx.db
      .query("telehealthAvailability")
      .withIndex("by_doctorId_dayOfWeek", (q) =>
        q.eq("doctorId", doctor._id).eq("dayOfWeek", slot.dayOfWeek)
      )
      .collect();

    const otherActiveSlots = existing.filter((s) => s.isActive && s._id !== args.slotId);

    for (const other of otherActiveSlots) {
      if (slotsOverlap(args.startTime, args.endTime, other.startTime, other.endTime)) {
        throw new Error(
          `Overlaps with existing slot ${other.startTime}–${other.endTime}`
        );
      }
    }

    await ctx.db.patch(args.slotId, {
      startTime: args.startTime,
      endTime: args.endTime,
      slotDurationMinutes: args.slotDurationMinutes,
    });
  },
});

// Remove a specific slot by ID
export const removeSlot = mutation({
  args: { slotId: v.id("telehealthAvailability") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);

    const slot = await ctx.db.get(args.slotId);
    if (!slot || slot.doctorId !== doctor._id) {
      throw new Error("Slot not found");
    }

    await ctx.db.delete(args.slotId);
  },
});

// Remove (deactivate) all slots for a day
export const removeDayAvailability = mutation({
  args: { dayOfWeek: v.number() },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    await verifyTelehealthAccess(ctx, doctor._id);

    const existing = await ctx.db
      .query("telehealthAvailability")
      .withIndex("by_doctorId_dayOfWeek", (q) =>
        q.eq("doctorId", doctor._id).eq("dayOfWeek", args.dayOfWeek)
      )
      .collect();

    for (const slot of existing) {
      if (slot.isActive) {
        await ctx.db.patch(slot._id, { isActive: false });
      }
    }
  },
});

// Block a specific date
export const addException = mutation({
  args: {
    date: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);
    await verifyTelehealthAccess(ctx, doctor._id);

    return await ctx.db.insert("telehealthExceptions", {
      doctorId: doctor._id,
      date: args.date,
      reason: args.reason,
      createdAt: Date.now(),
    });
  },
});

// Unblock a date
export const removeException = mutation({
  args: { exceptionId: v.id("telehealthExceptions") },
  handler: async (ctx, args) => {
    const doctor = await getAuthenticatedDoctor(ctx);

    const exception = await ctx.db.get(args.exceptionId);
    if (!exception || exception.doctorId !== doctor._id) {
      throw new Error("Exception not found");
    }

    await ctx.db.delete(args.exceptionId);
  },
});
