import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get the authenticated doctor for the current user.
 * Throws if not authenticated or not a doctor.
 */
export async function getAuthenticatedDoctor(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const appUser = await ctx.db
    .query("appUsers")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
    .first();

  if (!appUser || appUser.role !== "doctor") {
    throw new Error("Not authorized — doctor role required");
  }

  const doctor = await ctx.db
    .query("doctors")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
    .first();

  if (!doctor) throw new Error("Doctor profile not found");

  return doctor;
}

/**
 * Verify the authenticated doctor owns the given patient.
 * Returns both doctor and patient records.
 */
export async function verifyDoctorOwnsPatient(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patients">
) {
  const doctor = await getAuthenticatedDoctor(ctx);
  const patient = await ctx.db.get(patientId);

  if (!patient || patient.doctorId !== doctor._id) {
    throw new Error("Not authorized — patient does not belong to this doctor");
  }

  return { doctor, patient };
}

/**
 * Verify the authenticated doctor owns the given appointment.
 * Returns doctor, appointment, and patient records.
 */
export async function verifyDoctorOwnsAppointment(
  ctx: QueryCtx | MutationCtx,
  appointmentId: Id<"appointments">
) {
  const doctor = await getAuthenticatedDoctor(ctx);
  const appointment = await ctx.db.get(appointmentId);

  if (!appointment) throw new Error("Appointment not found");

  const patient = await ctx.db.get(appointment.patientId);
  if (!patient || patient.doctorId !== doctor._id) {
    throw new Error("Not authorized — appointment does not belong to this doctor");
  }

  return { doctor, appointment, patient };
}

/**
 * Verify the authenticated doctor owns a resource linked to a patient.
 * Used for reports, receipts, etc.
 */
export async function verifyDoctorOwnsPatientResource(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patients">
) {
  return verifyDoctorOwnsPatient(ctx, patientId);
}
