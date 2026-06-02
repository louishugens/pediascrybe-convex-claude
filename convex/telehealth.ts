import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
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
  return { doctor, identity };
}

async function getAuthorizedPatientIds(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const appUser = await ctx.db
    .query("appUsers")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
    .first();

  if (!appUser || appUser.role !== "patient") {
    throw new Error("Not authorized — patient role required");
  }

  const patientAccounts = await ctx.db
    .query("patientAccounts")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
    .collect();

  return { patientIds: patientAccounts.map((pa) => pa.patientId), identity };
}

// ==================== Queries ====================

// Get upcoming telehealth appointments (doctor view)
export const getDoctorUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const { doctor } = await getAuthenticatedDoctor(ctx);

    const appointments = await ctx.db
      .query("telehealthAppointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();

    const upcoming = appointments.filter((a) =>
      ["requested", "confirmed", "rescheduled"].includes(a.status)
    );

    // Enrich with patient info
    const enriched = await Promise.all(
      upcoming.map(async (apt) => {
        const patient = await ctx.db.get(apt.patientId);
        return {
          ...apt,
          patientName: patient
            ? `${patient.firstname} ${patient.lastname}`
            : "Unknown",
        };
      })
    );

    // Sort by date + startTime
    return enriched.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  },
});

// Get doctor's past appointments
export const getDoctorHistory = query({
  args: {},
  handler: async (ctx) => {
    const { doctor } = await getAuthenticatedDoctor(ctx);

    const appointments = await ctx.db
      .query("telehealthAppointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", doctor._id))
      .collect();

    const past = appointments.filter((a) =>
      ["completed", "cancelled", "no_show"].includes(a.status)
    );

    const enriched = await Promise.all(
      past.map(async (apt) => {
        const patient = await ctx.db.get(apt.patientId);
        return {
          ...apt,
          patientName: patient
            ? `${patient.firstname} ${patient.lastname}`
            : "Unknown",
        };
      })
    );

    return enriched.sort((a, b) => b.date.localeCompare(a.date));
  },
});

// Get patient's telehealth appointments (portal view)
export const getPatientAppointments = query({
  args: {},
  handler: async (ctx) => {
    const { patientIds } = await getAuthorizedPatientIds(ctx);

    const allAppointments: any[] = [];

    for (const patientId of patientIds) {
      const appointments = await ctx.db
        .query("telehealthAppointments")
        .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
        .collect();

      const patient = await ctx.db.get(patientId);

      for (const apt of appointments) {
        const doctor = await ctx.db.get(apt.doctorId);
        allAppointments.push({
          ...apt,
          patientName: patient
            ? `${patient.firstname} ${patient.lastname}`
            : "Unknown",
          doctorName: doctor
            ? `${doctor.title ? doctor.title + " " : ""}${doctor.firstname} ${doctor.lastname}`
            : "Unknown",
        });
      }
    }

    return allAppointments.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  },
});

// Get a single appointment by ID (auth-checked: doctor or linked parent)
export const getById = query({
  args: { id: v.id("telehealthAppointments") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const apt = await ctx.db.get(args.id);
    if (!apt) throw new Error("Appointment not found");

    // Check if user is the doctor
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    const isDoctor = doctor && doctor._id === apt.doctorId;

    // Check if user is a linked parent
    let isParent = false;
    if (!isDoctor) {
      const appUser = await ctx.db
        .query("appUsers")
        .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
        .first();

      if (appUser?.role === "patient") {
        const link = await ctx.db
          .query("patientAccounts")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
          .collect();

        isParent = link.some((l) => l.patientId === apt.patientId);
      }
    }

    if (!isDoctor && !isParent) {
      throw new Error("Not authorized");
    }

    // Enrich
    const patient = await ctx.db.get(apt.patientId);
    const doctorRecord = doctor || await ctx.db.get(apt.doctorId);

    return {
      ...apt,
      patientName: patient
        ? `${patient.firstname} ${patient.lastname}`
        : "Unknown",
      doctorName: doctorRecord
        ? `${doctorRecord.title ? doctorRecord.title + " " : ""}${doctorRecord.firstname} ${doctorRecord.lastname}`
        : "Unknown",
      role: isDoctor ? "doctor" as const : "patient" as const,
    };
  },
});

// ==================== Mutations ====================

// Patient books a slot
export const book = mutation({
  args: {
    doctorId: v.id("doctors"),
    patientId: v.id("patients"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    motif: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { patientIds, identity } = await getAuthorizedPatientIds(ctx);

    if (!patientIds.includes(args.patientId)) {
      throw new Error("Not authorized to book for this patient");
    }

    // STANDALONE: billing removed — telehealth available to all.

    // Validate the slot is still available
    const existing = await ctx.db
      .query("telehealthAppointments")
      .withIndex("by_doctorId_date", (q) =>
        q.eq("doctorId", args.doctorId).eq("date", args.date)
      )
      .collect();

    const conflict = existing.find(
      (a) =>
        !["cancelled", "no_show"].includes(a.status) &&
        a.startTime === args.startTime &&
        a.endTime === args.endTime
    );

    if (conflict) {
      throw new Error("This time slot is no longer available");
    }

    const now = Date.now();
    const appointmentId = await ctx.db.insert("telehealthAppointments", {
      doctorId: args.doctorId,
      patientId: args.patientId,
      bookedByAuthUserId: identity.subject,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      timezone: "America/New_York", // Default — doctor can configure later
      status: "requested",
      motif: args.motif,
      paymentStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Notify doctor
    await ctx.scheduler.runAfter(
      0,
      internal.telehealthNotifications.notifyDoctorOfBooking,
      { telehealthAppointmentId: appointmentId }
    );

    return appointmentId;
  },
});

// Doctor confirms booking
export const confirm = mutation({
  args: { id: v.id("telehealthAppointments") },
  handler: async (ctx, args) => {
    const { doctor } = await getAuthenticatedDoctor(ctx);

    const apt = await ctx.db.get(args.id);
    if (!apt || apt.doctorId !== doctor._id) {
      throw new Error("Appointment not found");
    }
    if (apt.status !== "requested") {
      throw new Error("Can only confirm requested appointments");
    }

    // Generate unpredictable room name to prevent enumeration
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const randomSuffix = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const roomName = `th-${args.id}-${randomSuffix}`;
    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "confirmed",
      roomName,
      updatedAt: now,
    });

    // Notify patient
    await ctx.scheduler.runAfter(
      0,
      internal.telehealthNotifications.notifyPatientOfConfirmation,
      { telehealthAppointmentId: args.id }
    );

    // Schedule reminders (24h and 1h before)
    const appointmentTime = new Date(`${apt.date}T${apt.startTime}:00`).getTime();
    const twentyFourHoursBefore = appointmentTime - 24 * 60 * 60 * 1000;
    const oneHourBefore = appointmentTime - 60 * 60 * 1000;

    if (twentyFourHoursBefore > now) {
      await ctx.scheduler.runAt(
        twentyFourHoursBefore,
        internal.telehealthNotifications.sendReminder,
        { telehealthAppointmentId: args.id, type: "24h" }
      );
    }
    if (oneHourBefore > now) {
      await ctx.scheduler.runAt(
        oneHourBefore,
        internal.telehealthNotifications.sendReminder,
        { telehealthAppointmentId: args.id, type: "1h" }
      );
    }
  },
});

// Doctor proposes reschedule
export const proposeReschedule = mutation({
  args: {
    id: v.id("telehealthAppointments"),
    proposedDate: v.string(),
    proposedStartTime: v.string(),
    proposedEndTime: v.string(),
  },
  handler: async (ctx, args) => {
    const { doctor } = await getAuthenticatedDoctor(ctx);

    const apt = await ctx.db.get(args.id);
    if (!apt || apt.doctorId !== doctor._id) {
      throw new Error("Appointment not found");
    }
    if (!["requested", "confirmed"].includes(apt.status)) {
      throw new Error("Cannot reschedule this appointment");
    }

    await ctx.db.patch(args.id, {
      status: "rescheduled",
      proposedDate: args.proposedDate,
      proposedStartTime: args.proposedStartTime,
      proposedEndTime: args.proposedEndTime,
      updatedAt: Date.now(),
    });

    // Notify patient
    await ctx.scheduler.runAfter(
      0,
      internal.telehealthNotifications.notifyPatientOfReschedule,
      { telehealthAppointmentId: args.id }
    );
  },
});

// Patient accepts reschedule
export const acceptReschedule = mutation({
  args: { id: v.id("telehealthAppointments") },
  handler: async (ctx, args) => {
    const { patientIds } = await getAuthorizedPatientIds(ctx);

    const apt = await ctx.db.get(args.id);
    if (!apt || !patientIds.includes(apt.patientId)) {
      throw new Error("Appointment not found");
    }
    if (apt.status !== "rescheduled") {
      throw new Error("No reschedule proposal to accept");
    }

    const roomName = apt.roomName || `th-${args.id}`;
    const now = Date.now();

    await ctx.db.patch(args.id, {
      date: apt.proposedDate!,
      startTime: apt.proposedStartTime!,
      endTime: apt.proposedEndTime!,
      status: "confirmed",
      roomName,
      proposedDate: undefined,
      proposedStartTime: undefined,
      proposedEndTime: undefined,
      updatedAt: now,
    });

    // Notify doctor
    await ctx.scheduler.runAfter(
      0,
      internal.telehealthNotifications.notifyDoctorOfRescheduleAccepted,
      { telehealthAppointmentId: args.id }
    );

    // Schedule reminders
    const appointmentTime = new Date(`${apt.proposedDate}T${apt.proposedStartTime}:00`).getTime();
    const twentyFourHoursBefore = appointmentTime - 24 * 60 * 60 * 1000;
    const oneHourBefore = appointmentTime - 60 * 60 * 1000;

    if (twentyFourHoursBefore > now) {
      await ctx.scheduler.runAt(
        twentyFourHoursBefore,
        internal.telehealthNotifications.sendReminder,
        { telehealthAppointmentId: args.id, type: "24h" }
      );
    }
    if (oneHourBefore > now) {
      await ctx.scheduler.runAt(
        oneHourBefore,
        internal.telehealthNotifications.sendReminder,
        { telehealthAppointmentId: args.id, type: "1h" }
      );
    }
  },
});

// Either party cancels
export const cancel = mutation({
  args: {
    id: v.id("telehealthAppointments"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const apt = await ctx.db.get(args.id);
    if (!apt) throw new Error("Appointment not found");

    // Determine who is cancelling
    const doctor = await ctx.db
      .query("doctors")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
      .first();

    let cancelledBy: "doctor" | "patient";

    if (doctor && doctor._id === apt.doctorId) {
      cancelledBy = "doctor";
    } else {
      // Verify patient access
      const link = await ctx.db
        .query("patientAccounts")
        .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
        .collect();

      if (!link.some((l) => l.patientId === apt.patientId)) {
        throw new Error("Not authorized");
      }
      cancelledBy = "patient";
    }

    if (["completed", "cancelled"].includes(apt.status)) {
      throw new Error("Cannot cancel this appointment");
    }

    await ctx.db.patch(args.id, {
      status: "cancelled",
      cancelledBy,
      cancellationReason: args.reason,
      updatedAt: Date.now(),
    });

    // Notify other party
    await ctx.scheduler.runAfter(
      0,
      internal.telehealthNotifications.notifyOfCancellation,
      { telehealthAppointmentId: args.id, cancelledBy }
    );
  },
});

// Doctor marks payment
export const markPayment = mutation({
  args: {
    id: v.id("telehealthAppointments"),
    paymentStatus: v.union(v.literal("paid"), v.literal("waived")),
  },
  handler: async (ctx, args) => {
    const { doctor } = await getAuthenticatedDoctor(ctx);

    const apt = await ctx.db.get(args.id);
    if (!apt || apt.doctorId !== doctor._id) {
      throw new Error("Appointment not found");
    }

    await ctx.db.patch(args.id, {
      paymentStatus: args.paymentStatus,
      paymentMarkedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Doctor marks no-show
export const markNoShow = mutation({
  args: { id: v.id("telehealthAppointments") },
  handler: async (ctx, args) => {
    const { doctor } = await getAuthenticatedDoctor(ctx);

    const apt = await ctx.db.get(args.id);
    if (!apt || apt.doctorId !== doctor._id) {
      throw new Error("Appointment not found");
    }

    await ctx.db.patch(args.id, {
      status: "no_show",
      updatedAt: Date.now(),
    });
  },
});

// Doctor adds post-call notes
export const addNotes = mutation({
  args: {
    id: v.id("telehealthAppointments"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const { doctor } = await getAuthenticatedDoctor(ctx);

    const apt = await ctx.db.get(args.id);
    if (!apt || apt.doctorId !== doctor._id) {
      throw new Error("Appointment not found");
    }

    await ctx.db.patch(args.id, {
      notes: args.notes,
      updatedAt: Date.now(),
    });
  },
});

// ==================== Internal Mutations (for webhooks/schedulers) ====================

export const handleRoomStarted = internalMutation({
  args: { roomName: v.string() },
  handler: async (ctx, args) => {
    const apt = await ctx.db
      .query("telehealthAppointments")
      .withIndex("by_roomName", (q) => q.eq("roomName", args.roomName))
      .first();

    if (apt) {
      await ctx.db.patch(apt._id, {
        sessionStartedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

export const handleParticipantJoined = internalMutation({
  args: {
    roomName: v.string(),
    identity: v.string(),
  },
  handler: async (ctx, args) => {
    const apt = await ctx.db
      .query("telehealthAppointments")
      .withIndex("by_roomName", (q) => q.eq("roomName", args.roomName))
      .first();

    if (!apt) return;

    const now = Date.now();
    if (args.identity.startsWith("doctor-")) {
      await ctx.db.patch(apt._id, { doctorJoinedAt: now, updatedAt: now });
    } else if (args.identity.startsWith("patient-")) {
      await ctx.db.patch(apt._id, { patientJoinedAt: now, updatedAt: now });
    }
  },
});

export const handleRoomFinished = internalMutation({
  args: { roomName: v.string() },
  handler: async (ctx, args) => {
    const apt = await ctx.db
      .query("telehealthAppointments")
      .withIndex("by_roomName", (q) => q.eq("roomName", args.roomName))
      .first();

    if (apt && apt.status === "confirmed") {
      const endedAt = Date.now();
      await ctx.db.patch(apt._id, {
        sessionEndedAt: endedAt,
        status: "completed",
        updatedAt: endedAt,
      });

      // Accumulate minutes into the doctor's current-period usage row.
      // We don't block long calls — overages are invoiced by the monthly cron.
      const startedAt = apt.sessionStartedAt || apt.doctorJoinedAt || apt.patientJoinedAt;
      if (startedAt) {
        const minutes = Math.max(0, Math.ceil((endedAt - startedAt) / 60000));
        if (minutes > 0) {
          const now = new Date(endedAt);
          const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const usage = await ctx.db
            .query("usage")
            .withIndex("by_doctorId_period", (q) =>
              q.eq("doctorId", apt.doctorId).eq("period", period),
            )
            .first();

          if (usage) {
            await ctx.db.patch(usage._id, {
              telehealthMinutesUsed: (usage.telehealthMinutesUsed || 0) + minutes,
              updatedAt: endedAt,
            });
          } else {
            await ctx.db.insert("usage", {
              doctorId: apt.doctorId,
              period,
              aiCreditsUsed: 0,
              packCreditsRemaining: 0,
              whatsappTrialUsed: 0,
              whatsappMessagesUsed: 0,
              telehealthMinutesUsed: minutes,
              storageUsedBytes: 0,
              createdAt: endedAt,
              updatedAt: endedAt,
            });
          }
        }
      }
    }
  },
});
