import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

// Helper: get parent emails for a patient and send notification + email
async function notifyParents(
  ctx: MutationCtx,
  {
    patientId,
    type,
    message,
    appointmentId,
  }: {
    patientId: Id<"patients">;
    type: "new_prescription" | "new_lab_exam" | "appointment_summary" | "new_vaccine_record" | "new_report";
    message: string;
    appointmentId?: Id<"appointments">;
  }
) {
  const patient = await ctx.db.get(patientId);
  if (!patient || !patient.portalEnabled) return;

  // Insert notification
  await ctx.db.insert("portalNotifications", {
    patientId,
    type,
    appointmentId,
    message,
    isRead: false,
    createdAt: Date.now(),
  });

  // Get parent accounts linked to this patient
  const parentAccounts = await ctx.db
    .query("patientAccounts")
    .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
    .collect();

  if (parentAccounts.length === 0) return;

  // Get doctor info
  const doctor = await ctx.db.get(patient.doctorId);
  const doctorName = doctor
    ? `${doctor.title ? doctor.title + " " : ""}${doctor.firstname} ${doctor.lastname}`
    : "Your doctor";
  const childName = `${patient.firstname} ${patient.lastname}`;
  const siteUrl = process.env.SITE_URL || "https://app.pediascrybe.com";

  // Send email to each parent
  for (const account of parentAccounts) {
    const appUser = await ctx.db
      .query("appUsers")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", account.authUserId))
      .first();

    if (appUser?.email) {
      await ctx.scheduler.runAfter(0, internal.email.sendPortalNotificationAction, {
        to: appUser.email,
        parentName: appUser.displayName || appUser.firstName || undefined,
        childName,
        doctorName,
        notificationType: type,
        message,
        portalUrl: `${siteUrl}/portal/children/${patientId}`,
      });
    }
  }
}

// Called when doctor adds/updates prescription
export const notifyParentOfPrescription = internalMutation({
  args: {
    patientId: v.id("patients"),
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    const childName = patient ? `${patient.firstname} ${patient.lastname}` : "your child";

    await notifyParents(ctx, {
      patientId: args.patientId,
      type: "new_prescription",
      message: `A new prescription has been added for ${childName}. You can view and print it from the Parent Portal.`,
      appointmentId: args.appointmentId,
    });
  },
});

// Called when doctor adds/updates lab exams
export const notifyParentOfLabExam = internalMutation({
  args: {
    patientId: v.id("patients"),
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    const childName = patient ? `${patient.firstname} ${patient.lastname}` : "your child";

    await notifyParents(ctx, {
      patientId: args.patientId,
      type: "new_lab_exam",
      message: `A new lab exam has been requested for ${childName}. You can view and print the lab request from the Parent Portal.`,
      appointmentId: args.appointmentId,
    });
  },
});

// Called when appointment is completed (findings added)
export const notifyParentOfAppointmentSummary = internalMutation({
  args: {
    patientId: v.id("patients"),
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    const childName = patient ? `${patient.firstname} ${patient.lastname}` : "your child";

    await notifyParents(ctx, {
      patientId: args.patientId,
      type: "appointment_summary",
      message: `The appointment summary for ${childName} is now available. View the details in the Parent Portal.`,
      appointmentId: args.appointmentId,
    });
  },
});

// Called when vaccination record is created
export const notifyParentOfVaccination = internalMutation({
  args: {
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db.get(args.patientId);
    const childName = patient ? `${patient.firstname} ${patient.lastname}` : "your child";

    await notifyParents(ctx, {
      patientId: args.patientId,
      type: "new_vaccine_record",
      message: `A new vaccination has been recorded for ${childName}. View the updated vaccination records in the Parent Portal.`,
    });
  },
});
