import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

// ==================== Helpers ====================

async function getAppointmentContext(ctx: MutationCtx, telehealthAppointmentId: Id<"telehealthAppointments">) {
  const apt = await ctx.db.get(telehealthAppointmentId);
  if (!apt) throw new Error("Appointment not found");

  const patient = await ctx.db.get(apt.patientId);
  const doctor = await ctx.db.get(apt.doctorId);

  const childName = patient ? `${patient.firstname} ${patient.lastname}` : "your child";
  const doctorName = doctor
    ? `${doctor.title ? doctor.title + " " : ""}${doctor.firstname} ${doctor.lastname}`
    : "Your doctor";

  const siteUrl = process.env.SITE_URL || "https://app.pediascrybe.com";

  return { apt, patient, doctor, childName, doctorName, siteUrl };
}

async function notifyPatientParents(
  ctx: MutationCtx,
  {
    telehealthAppointmentId,
    patientId,
    type,
    message,
  }: {
    telehealthAppointmentId: Id<"telehealthAppointments">;
    patientId: Id<"patients">;
    type: "telehealth_confirmed" | "telehealth_rescheduled" | "telehealth_cancelled" | "telehealth_reminder";
    message: string;
  }
) {
  const patient = await ctx.db.get(patientId);
  if (!patient) return;

  // Insert notification
  await ctx.db.insert("portalNotifications", {
    patientId,
    type,
    telehealthAppointmentId,
    message,
    isRead: false,
    createdAt: Date.now(),
  });

  // Get parent accounts
  const parentAccounts = await ctx.db
    .query("patientAccounts")
    .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
    .collect();

  if (parentAccounts.length === 0) return;

  const doctor = await ctx.db.get(patient.doctorId);
  const doctorName = doctor
    ? `${doctor.title ? doctor.title + " " : ""}${doctor.firstname} ${doctor.lastname}`
    : "Your doctor";
  const childName = `${patient.firstname} ${patient.lastname}`;
  const siteUrl = process.env.SITE_URL || "https://app.pediascrybe.com";

  for (const account of parentAccounts) {
    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", account.authUserId))
      .first();

    if (appUser?.email) {
      await ctx.scheduler.runAfter(0, internal.email.sendTelehealthNotificationAction, {
        to: appUser.email,
        parentName: appUser.displayName || appUser.firstName || undefined,
        childName,
        doctorName,
        type,
        message,
        portalUrl: `${siteUrl}/portal/telehealth/appointments`,
      });
    }
  }
}

// ==================== Notification Mutations ====================

// Doctor gets notified of a new booking request
export const notifyDoctorOfBooking = internalMutation({
  args: { telehealthAppointmentId: v.id("telehealthAppointments") },
  handler: async (ctx, args) => {
    const { apt, childName, doctor, siteUrl } = await getAppointmentContext(ctx, args.telehealthAppointmentId);

    if (!doctor) return;

    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", doctor.authUserId))
      .first();

    if (appUser?.email) {
      await ctx.scheduler.runAfter(0, internal.email.sendTelehealthNotificationAction, {
        to: appUser.email,
        doctorName: `${doctor.firstname}`,
        childName,
        type: "telehealth_confirmed" as const,
        message: `New telehealth appointment request for ${childName} on ${apt.date} at ${apt.startTime}. Please confirm or propose an alternative time.`,
        portalUrl: `${siteUrl}/user/telehealth/appointments`,
      });
    }
  },
});

// Patient gets notified of confirmation
export const notifyPatientOfConfirmation = internalMutation({
  args: { telehealthAppointmentId: v.id("telehealthAppointments") },
  handler: async (ctx, args) => {
    const { apt, childName, doctorName } = await getAppointmentContext(ctx, args.telehealthAppointmentId);

    await notifyPatientParents(ctx, {
      telehealthAppointmentId: args.telehealthAppointmentId,
      patientId: apt.patientId,
      type: "telehealth_confirmed",
      message: `Your telehealth appointment for ${childName} with ${doctorName} on ${apt.date} at ${apt.startTime} has been confirmed.`,
    });
  },
});

// Patient gets notified of reschedule proposal
export const notifyPatientOfReschedule = internalMutation({
  args: { telehealthAppointmentId: v.id("telehealthAppointments") },
  handler: async (ctx, args) => {
    const { apt, childName, doctorName } = await getAppointmentContext(ctx, args.telehealthAppointmentId);

    await notifyPatientParents(ctx, {
      telehealthAppointmentId: args.telehealthAppointmentId,
      patientId: apt.patientId,
      type: "telehealth_rescheduled",
      message: `${doctorName} has proposed to reschedule ${childName}'s telehealth appointment to ${apt.proposedDate} at ${apt.proposedStartTime}. Please accept or decline.`,
    });
  },
});

// Doctor gets notified that reschedule was accepted
export const notifyDoctorOfRescheduleAccepted = internalMutation({
  args: { telehealthAppointmentId: v.id("telehealthAppointments") },
  handler: async (ctx, args) => {
    const { apt, childName, doctor, siteUrl } = await getAppointmentContext(ctx, args.telehealthAppointmentId);

    if (!doctor) return;

    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", doctor.authUserId))
      .first();

    if (appUser?.email) {
      await ctx.scheduler.runAfter(0, internal.email.sendTelehealthNotificationAction, {
        to: appUser.email,
        doctorName: `${doctor.firstname}`,
        childName,
        type: "telehealth_confirmed" as const,
        message: `The parent has accepted the rescheduled telehealth appointment for ${childName} on ${apt.date} at ${apt.startTime}.`,
        portalUrl: `${siteUrl}/user/telehealth/appointments`,
      });
    }
  },
});

// Cancellation notification
export const notifyOfCancellation = internalMutation({
  args: {
    telehealthAppointmentId: v.id("telehealthAppointments"),
    cancelledBy: v.union(v.literal("doctor"), v.literal("patient")),
  },
  handler: async (ctx, args) => {
    const { apt, childName, doctor, doctorName, siteUrl } = await getAppointmentContext(ctx, args.telehealthAppointmentId);

    if (args.cancelledBy === "patient") {
      // Notify doctor
      if (doctor) {
        const appUser = await ctx.db
          .query("appUsers")
          .withIndex("by_authUserId", (q) => q.eq("authUserId", doctor.authUserId))
          .first();

        if (appUser?.email) {
          await ctx.scheduler.runAfter(0, internal.email.sendTelehealthNotificationAction, {
            to: appUser.email,
            doctorName: `${doctor.firstname}`,
            childName,
            type: "telehealth_cancelled" as const,
            message: `The telehealth appointment for ${childName} on ${apt.date} at ${apt.startTime} has been cancelled by the parent.`,
            portalUrl: `${siteUrl}/user/telehealth/appointments`,
          });
        }
      }
    } else {
      // Notify patient parents
      await notifyPatientParents(ctx, {
        telehealthAppointmentId: args.telehealthAppointmentId,
        patientId: apt.patientId,
        type: "telehealth_cancelled",
        message: `${doctorName} has cancelled the telehealth appointment for ${childName} on ${apt.date} at ${apt.startTime}.`,
      });
    }
  },
});

// Reminder notification (scheduled)
export const sendReminder = internalMutation({
  args: {
    telehealthAppointmentId: v.id("telehealthAppointments"),
    type: v.union(v.literal("24h"), v.literal("1h")),
  },
  handler: async (ctx, args) => {
    const { apt, childName, doctor, doctorName, siteUrl } = await getAppointmentContext(ctx, args.telehealthAppointmentId);

    // Only send reminder if still confirmed
    if (apt.status !== "confirmed") return;

    const timeLabel = args.type === "24h" ? "tomorrow" : "in 1 hour";

    // Notify patient parents
    await notifyPatientParents(ctx, {
      telehealthAppointmentId: args.telehealthAppointmentId,
      patientId: apt.patientId,
      type: "telehealth_reminder",
      message: `Reminder: Telehealth appointment for ${childName} with ${doctorName} is ${timeLabel} at ${apt.startTime}.`,
    });

    // Notify doctor
    if (doctor) {
      const appUser = await ctx.db
        .query("appUsers")
        .withIndex("by_authUserId", (q) => q.eq("authUserId", doctor.authUserId))
        .first();

      if (appUser?.email) {
        await ctx.scheduler.runAfter(0, internal.email.sendTelehealthNotificationAction, {
          to: appUser.email,
          doctorName: `${doctor.firstname}`,
          childName,
          type: "telehealth_reminder" as const,
          message: `Reminder: Telehealth appointment for ${childName} is ${timeLabel} at ${apt.startTime}.`,
          portalUrl: `${siteUrl}/user/telehealth/appointments`,
        });
      }
    }
  },
});
