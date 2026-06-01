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
 * Verify the authenticated doctor owns the given prescription.
 */
export async function verifyDoctorOwnsPrescription(
  ctx: QueryCtx | MutationCtx,
  prescriptionId: Id<"prescriptions">
) {
  const doctor = await getAuthenticatedDoctor(ctx);
  const prescription = await ctx.db.get(prescriptionId);
  if (!prescription) throw new Error("Prescription not found");
  if (prescription.doctorId !== doctor._id) {
    throw new Error("Not authorized — prescription does not belong to this doctor");
  }
  return { doctor, prescription };
}

/**
 * Verify the authenticated doctor owns the given lab order.
 */
export async function verifyDoctorOwnsLabOrder(
  ctx: QueryCtx | MutationCtx,
  labOrderId: Id<"labOrders">
) {
  const doctor = await getAuthenticatedDoctor(ctx);
  const labOrder = await ctx.db.get(labOrderId);
  if (!labOrder) throw new Error("Lab order not found");
  if (labOrder.doctorId !== doctor._id) {
    throw new Error("Not authorized — lab order does not belong to this doctor");
  }
  return { doctor, labOrder };
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
