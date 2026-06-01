/**
 * One-shot fix: re-parent all rows owned by a stale doctor record onto a
 * canonical one (when a single user accidentally accumulated multiple doctor
 * rows over multiple signups).
 *
 * Run: npx convex run reparentPatients:run
 * Idempotent — re-running after a successful pass is a no-op.
 */
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const FROM_DOCTOR = "jn7f2y7dyd9eterrakxyy5tys17zaz97" as Id<"doctors">;
const TO_DOCTOR = "jn721ajrf2nj3vqad0anhf4v6h83g2fa" as Id<"doctors">;

// Tables that carry a `doctorId` field. Tables scoped via patientId/appointmentId/labOrderId
// (labResults, vaccinationRecords, files, reports, receipts) ride along automatically since
// their parent moves with the patient/appointment.
const TABLES_WITH_DOCTOR_ID = [
  "patients",
  "services",
  "appointments",
  "prescriptions",
  "labOrders",
  "doctorImages",
  "vaccins",
  "subscriptions",
  "patientInvitations",
  "usage",
  "telehealthAvailability",
  "telehealthExceptions",
  "telehealthAppointments",
  "whatsappLinks",
  "whatsappMessages",
  "whatsappPendingActions",
  "doctorPreferences",
  "clinicalDecisionLog",
] as const;

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const counts: Record<string, number> = {};

    for (const table of TABLES_WITH_DOCTOR_ID) {
      const rows = await ctx.db
        .query(table as any)
        .filter((q) => q.eq(q.field("doctorId"), FROM_DOCTOR))
        .collect();
      for (const r of rows) {
        await ctx.db.patch(r._id, { doctorId: TO_DOCTOR } as any);
      }
      counts[table] = rows.length;
    }

    return { from: FROM_DOCTOR, to: TO_DOCTOR, counts };
  },
});
