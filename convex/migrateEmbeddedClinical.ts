/**
 * One-shot migration: lift the legacy embedded `medication` and `exams`
 * arrays off appointments into standalone prescriptions and labOrders rows,
 * then strip those fields from appointment documents so the new schema validates.
 *
 * Run once with: npx convex run migrateEmbeddedClinical:run
 * Idempotent — safe to re-run.
 */
import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";

type LegacyAppointment = {
  _id: string;
  doctorId: string;
  patientId: string;
  medication?: Array<{
    drug: string;
    count: number;
    unit: string;
    posology: string;
  }>;
  exams?: Array<{ exam: string }>;
};

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("appointments").collect();

    let prescriptionsInserted = 0;
    let labOrdersInserted = 0;
    let appointmentsTouched = 0;

    for (const apt of all as unknown as LegacyAppointment[]) {
      const meds = apt.medication ?? [];
      const exams = apt.exams ?? [];
      let touched = false;
      const now = Date.now();

      // Insert prescription rows. Mark as "completed" since these are historical
      // doses without lifecycle tracking.
      const existingRx = await ctx.db
        .query("prescriptions")
        .withIndex("by_appointmentId", (q) => q.eq("appointmentId", apt._id as any))
        .collect();
      if (existingRx.length === 0) {
        for (const m of meds) {
          await ctx.db.insert("prescriptions", {
            doctorId: apt.doctorId as any,
            patientId: apt.patientId as any,
            appointmentId: apt._id as any,
            drug: m.drug,
            count: m.count,
            unit: m.unit,
            posology: m.posology,
            status: "completed",
            createdAt: now,
            updatedAt: now,
          });
          prescriptionsInserted++;
        }
      }

      // Insert lab order rows.
      const existingLabs = await ctx.db
        .query("labOrders")
        .withIndex("by_appointmentId", (q) => q.eq("appointmentId", apt._id as any))
        .collect();
      if (existingLabs.length === 0) {
        for (const e of exams) {
          await ctx.db.insert("labOrders", {
            doctorId: apt.doctorId as any,
            patientId: apt.patientId as any,
            appointmentId: apt._id as any,
            examName: e.exam,
            status: "ordered",
            orderedAt: now,
            createdAt: now,
            updatedAt: now,
          });
          labOrdersInserted++;
        }
      }

      // Strip the legacy fields off the appointment document so the new schema validates.
      if (apt.medication !== undefined || apt.exams !== undefined) {
        await ctx.db.patch(apt._id as any, {
          medication: undefined,
          exams: undefined,
        } as any);
        touched = true;
      }
      if (touched) appointmentsTouched++;
    }

    return {
      appointmentsScanned: all.length,
      appointmentsTouched,
      prescriptionsInserted,
      labOrdersInserted,
    };
  },
});
