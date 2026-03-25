/**
 * Write Tools — Tools that modify patient/appointment data.
 *
 * All write operations require explicit confirmation from the doctor.
 * The tool creates a preview, the agent asks "Reply YES to confirm",
 * and confirmWriteAction executes on confirmation.
 */
import { tool } from "ai";
import { z } from "zod";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

type ToolContext = {
  ctx: ActionCtx;
  doctorId: Id<"doctors">;
};

export function createWriteTools({ ctx, doctorId }: ToolContext) {
  return {
    createPatient: tool({
      description:
        "Create a new patient record. Always confirm with the doctor before executing. Use when the doctor says 'new patient' or wants to add a patient.",
      inputSchema: z.object({
        firstname: z.string().describe("Patient's first name"),
        lastname: z.string().describe("Patient's last name"),
        birthdate: z.string().describe("Date of birth in YYYY-MM-DD format"),
        sex: z.enum(["male", "female"]).describe("Patient's sex"),
        mothername: z.string().optional().describe("Mother's name"),
        phone: z.string().optional().describe("Contact phone number"),
        allergies: z.string().optional().describe("Known allergies"),
      }),
      execute: async ({ firstname, lastname, birthdate, sex, mothername, phone, allergies }) => {
        const birthdateTs = new Date(birthdate).getTime();
        const proposedData = JSON.stringify({
          firstname, lastname, birthdate: birthdateTs, sex,
          mothername, phone, allergies,
        });

        const age = getAgeLabel(birthdateTs);
        const preview = [
          `*New Patient:* ${firstname} ${lastname}`,
          `DOB: ${birthdate} (${age})`,
          `Sex: ${sex === "male" ? "Male" : "Female"}`,
          mothername ? `Mother: ${mothername}` : null,
          allergies ? `Allergies: ${allergies}` : null,
        ].filter(Boolean).join("\n");

        const actionId = await ctx.runMutation(
          internal.whatsappData.createPendingAction,
          {
            doctorId,
            action: "createPatient",
            proposedData,
            preview,
          }
        );

        return {
          type: "write_confirmation_needed",
          actionId,
          preview,
          message: "I've prepared this patient record. Ask the doctor to confirm.",
        };
      },
    }),

    createAppointment: tool({
      description:
        "Schedule a new appointment. Always confirm with the doctor before executing. Use when the doctor wants to book or schedule a visit.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
        date: z.string().describe("Appointment date in YYYY-MM-DD format"),
        time: z.string().describe("Appointment time in HH:MM format (24h)"),
        motif: z.string().optional().describe("Reason for visit"),
        cost: z.number().optional().describe("Consultation cost"),
      }),
      execute: async ({ patientId, date, time, motif, cost }) => {
        // Get patient name for preview
        const patient: any = await ctx.runQuery(
          internal.whatsappData.getPatientSummary,
          { doctorId, patientId: patientId as Id<"patients"> }
        );

        const [h, m] = time.split(":").map(Number);
        const startDate = new Date(date);
        startDate.setHours(h, m, 0, 0);

        const proposedData = JSON.stringify({
          patientId, startDate: startDate.getTime(), motif, cost,
        });

        const patientName = patient ? `${patient.firstname} ${patient.lastname}` : "Patient";
        const preview = [
          `*New Appointment:* ${patientName}`,
          `Date: ${date} at ${time}`,
          motif ? `Reason: ${motif}` : null,
          cost ? `Cost: ${cost}` : null,
        ].filter(Boolean).join("\n");

        const actionId = await ctx.runMutation(
          internal.whatsappData.createPendingAction,
          {
            doctorId,
            action: "createAppointment",
            patientId: patientId as Id<"patients">,
            proposedData,
            preview,
          }
        );

        return {
          type: "write_confirmation_needed",
          actionId,
          preview,
          message: "I've prepared this appointment. Ask the doctor to confirm.",
        };
      },
    }),

    addAppointmentNote: tool({
      description:
        "Add internal notes to an existing appointment. Use when the doctor wants to add notes, findings, or remarks to a visit.",
      inputSchema: z.object({
        appointmentId: z.string().describe("The appointment ID"),
        notes: z.string().describe("The notes to add"),
        field: z.enum(["internalNotes", "findings", "recommendation", "otherRemarks"])
          .optional()
          .describe("Which field to update. Defaults to internalNotes."),
      }),
      execute: async ({ appointmentId, notes, field }) => {
        const targetField = field || "internalNotes";
        const proposedData = JSON.stringify({
          appointmentId, [targetField]: notes,
        });

        const preview = `*Add ${targetField}:*\n${notes.slice(0, 200)}${notes.length > 200 ? "..." : ""}`;

        const actionId = await ctx.runMutation(
          internal.whatsappData.createPendingAction,
          {
            doctorId,
            action: "addAppointmentNote",
            appointmentId: appointmentId as Id<"appointments">,
            proposedData,
            preview,
          }
        );

        return {
          type: "write_confirmation_needed",
          actionId,
          preview,
          message: "I've prepared the notes. Ask the doctor to confirm.",
        };
      },
    }),

    recordVitals: tool({
      description:
        "Save vitals (weight, height, temperature, etc.) to an appointment. Use when the doctor provides vital signs for a visit.",
      inputSchema: z.object({
        appointmentId: z.string().describe("The appointment ID"),
        weight: z.number().optional().describe("Weight in kg"),
        height: z.number().optional().describe("Height in cm"),
        head: z.number().optional().describe("Head circumference in cm"),
        temperature: z.number().optional().describe("Temperature in °C"),
        pulse: z.number().optional().describe("Heart rate in bpm"),
        sao2: z.number().optional().describe("Oxygen saturation %"),
        respiratory: z.number().optional().describe("Respiratory rate /min"),
        systolic: z.number().optional().describe("Systolic BP mmHg"),
        diastolic: z.number().optional().describe("Diastolic BP mmHg"),
      }),
      execute: async ({ appointmentId, ...vitals }) => {
        const nonNullVitals = Object.fromEntries(
          Object.entries(vitals).filter(([, v]) => v !== undefined)
        );

        const proposedData = JSON.stringify({ appointmentId, ...nonNullVitals });

        const vitalLines = Object.entries(nonNullVitals).map(([key, val]) => {
          const units: Record<string, string> = {
            weight: "kg", height: "cm", head: "cm",
            temperature: "°C", pulse: "bpm", sao2: "%",
            respiratory: "/min", systolic: "mmHg", diastolic: "mmHg",
          };
          return `${key}: ${val}${units[key] || ""}`;
        });

        const preview = `*Vitals:*\n${vitalLines.join("\n")}`;

        const actionId = await ctx.runMutation(
          internal.whatsappData.createPendingAction,
          {
            doctorId,
            action: "recordVitals",
            appointmentId: appointmentId as Id<"appointments">,
            proposedData,
            preview,
          }
        );

        return {
          type: "write_confirmation_needed",
          actionId,
          preview,
          message: "I've prepared the vitals. Ask the doctor to confirm.",
        };
      },
    }),

    logVaccination: tool({
      description:
        "Record a vaccine dose for a patient. Use when the doctor wants to log a vaccination.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
        vaccineName: z.string().describe("Name of the vaccine"),
        manufacturer: z.string().describe("Vaccine manufacturer"),
        lotNumber: z.string().describe("Lot/batch number"),
        dosage: z.string().describe("Dosage given (e.g., '0.5ml')"),
        route: z.string().describe("Route of administration (e.g., 'IM', 'SC', 'oral')"),
        site: z.string().describe("Injection site (e.g., 'left deltoid', 'right thigh')"),
      }),
      execute: async ({ patientId, vaccineName, manufacturer, lotNumber, dosage, route, site }) => {
        const proposedData = JSON.stringify({
          patientId, vaccineName, manufacturer, lotNumber,
          dosage, route, site, date: Date.now(),
        });

        const preview = [
          `*Vaccination:* ${vaccineName}`,
          `Manufacturer: ${manufacturer} | Lot: ${lotNumber}`,
          `Dosage: ${dosage} | Route: ${route} | Site: ${site}`,
        ].join("\n");

        const actionId = await ctx.runMutation(
          internal.whatsappData.createPendingAction,
          {
            doctorId,
            action: "logVaccination",
            patientId: patientId as Id<"patients">,
            proposedData,
            preview,
          }
        );

        return {
          type: "write_confirmation_needed",
          actionId,
          preview,
          message: "I've prepared the vaccination record. Ask the doctor to confirm.",
        };
      },
    }),

    executeConfirmedWrite: tool({
      description:
        "Execute a confirmed write operation after the doctor says YES/confirm/save. This tool actually saves the data. Only call this after the doctor explicitly confirms.",
      inputSchema: z.object({
        actionId: z.string().describe("The pending action ID to execute"),
      }),
      execute: async ({ actionId }) => {
        const result = await ctx.runMutation(
          internal.whatsappData.executeWriteAction,
          { actionId: actionId as Id<"whatsappPendingActions">, doctorId }
        );
        return result;
      },
    }),

    undoLastAction: tool({
      description:
        "Undo the most recent confirmed write action. Only works within 5 minutes of the action. Supports undoing patient creation and appointment scheduling. Use when the doctor says 'undo', 'undo that', 'delete that', or 'revert'.",
      inputSchema: z.object({}),
      execute: async () => {
        const result = await ctx.runMutation(
          internal.whatsappData.undoLastWriteAction,
          { doctorId }
        );
        return result;
      },
    }),
  };
}

// ==================== Helpers ====================

function getAgeLabel(birthdateTs: number): string {
  const now = new Date();
  const birth = new Date(birthdateTs);
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  return years > 0 ? `${years}y` : `${months}m`;
}
