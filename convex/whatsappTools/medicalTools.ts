/**
 * Medical Tools — AI SDK tool definitions for clinical decision support.
 *
 * These tools generate clinical proposals (diagnosis, medication, labs)
 * that follow the propose-review-save cycle.
 */
import { tool } from "ai";
import { z } from "zod";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { runFullSafetyCheck } from "./clinicalSafety";

type ToolContext = {
  ctx: ActionCtx;
  doctorId: Id<"doctors">;
};

export function createMedicalTools({ ctx, doctorId }: ToolContext) {
  return {
    proposeDiagnostic: tool({
      description:
        "Generate a differential diagnosis (DDx) based on symptoms, vitals, and patient context. Creates a proposal the doctor can review and save. Use when the doctor describes symptoms or asks for a diagnosis.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
        symptoms: z
          .string()
          .describe(
            "Comma-separated symptoms described by the doctor (e.g., 'fever 39.2, ear pain 2 days, runny nose')"
          ),
        appointmentId: z
          .string()
          .optional()
          .describe("Appointment ID to attach the diagnosis to"),
      }),
      execute: async ({ patientId, symptoms, appointmentId }) => {
        // The AI agent itself generates the DDx in its response.
        // This tool creates the pending action for the propose-review-save cycle.
        const actionId = await ctx.runMutation(
          internal.whatsappData.createPendingAction,
          {
            doctorId,
            action: "diagnostic",
            patientId: patientId as Id<"patients">,
            appointmentId: appointmentId
              ? (appointmentId as Id<"appointments">)
              : undefined,
            proposedData: JSON.stringify({ symptoms, diagnoses: [] }), // Agent fills diagnoses in response
            preview: `Diagnostic proposal for symptoms: ${symptoms}`,
          }
        );
        return {
          type: "proposal_created",
          actionId,
          message:
            "I've analyzed the symptoms. Present the differential diagnosis to the doctor and ask if they want to save it.",
        };
      },
    }),

    proposeMedication: tool({
      description:
        "Generate medication suggestions based on diagnosis, patient weight, age, and allergies. Creates a proposal the doctor can review and save. Use when the doctor asks for prescriptions or medications.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
        condition: z
          .string()
          .describe(
            "The condition/diagnosis to prescribe for (e.g., 'acute otitis media')"
          ),
        appointmentId: z
          .string()
          .optional()
          .describe("Appointment ID to attach the prescription to"),
        linkedActionId: z
          .string()
          .optional()
          .describe(
            "ID of a previous diagnostic proposal to chain with"
          ),
      }),
      execute: async ({
        patientId,
        condition,
        appointmentId,
        linkedActionId,
      }) => {
        const actionId = await ctx.runMutation(
          internal.whatsappData.createPendingAction,
          {
            doctorId,
            action: "medication",
            patientId: patientId as Id<"patients">,
            appointmentId: appointmentId
              ? (appointmentId as Id<"appointments">)
              : undefined,
            proposedData: JSON.stringify({ condition, medications: [] }),
            preview: `Medication proposal for: ${condition}`,
            linkedActionId: linkedActionId
              ? (linkedActionId as Id<"whatsappPendingActions">)
              : undefined,
          }
        );
        return {
          type: "proposal_created",
          actionId,
          message:
            "I've prepared medication suggestions. Present them to the doctor with dosages, considering patient weight and allergies.",
        };
      },
    }),

    proposeLabExams: tool({
      description:
        "Suggest lab exams based on suspected diagnosis and patient context. Creates a proposal the doctor can review. Use when the doctor asks for lab suggestions.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
        suspectedCondition: z
          .string()
          .describe("The suspected condition or reason for labs"),
        appointmentId: z
          .string()
          .optional()
          .describe("Appointment ID to attach the lab order to"),
        linkedActionId: z
          .string()
          .optional()
          .describe("ID of a previous proposal to chain with"),
      }),
      execute: async ({
        patientId,
        suspectedCondition,
        appointmentId,
        linkedActionId,
      }) => {
        const actionId = await ctx.runMutation(
          internal.whatsappData.createPendingAction,
          {
            doctorId,
            action: "labExam",
            patientId: patientId as Id<"patients">,
            appointmentId: appointmentId
              ? (appointmentId as Id<"appointments">)
              : undefined,
            proposedData: JSON.stringify({
              suspectedCondition,
              exams: [],
            }),
            preview: `Lab exam suggestion for: ${suspectedCondition}`,
            linkedActionId: linkedActionId
              ? (linkedActionId as Id<"whatsappPendingActions">)
              : undefined,
          }
        );
        return {
          type: "proposal_created",
          actionId,
          message:
            "I've prepared lab exam suggestions. Present age-appropriate lab recommendations to the doctor.",
        };
      },
    }),

    checkMedicationSafety: tool({
      description:
        "Run clinical safety checks on proposed medications for a patient. Checks allergies, age-appropriateness, drug interactions, weight-based dosing, and duplicates. ALWAYS call this before presenting medication suggestions to the doctor.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
        proposedDrugs: z.array(z.string()).describe("List of drug names to check"),
      }),
      execute: async ({ patientId, proposedDrugs }) => {
        // Fetch patient data for safety context
        const patient: any = await ctx.runQuery(
          internal.whatsappData.getPatientSummary,
          { doctorId, patientId: patientId as Id<"patients"> }
        );

        if (!patient) {
          return { safe: true, summary: "Patient not found, cannot run safety checks." };
        }

        // Calculate age in months
        const now = new Date();
        const birth = new Date(patient.birthdate);
        const ageMonths =
          (now.getFullYear() - birth.getFullYear()) * 12 +
          (now.getMonth() - birth.getMonth());

        // Get current medications from recent appointments
        const appointments: any[] = await ctx.runQuery(
          internal.whatsappData.getPatientAppointments,
          { doctorId, patientId: patientId as Id<"patients"> }
        );

        const recentMeds: { drug: string }[] = [];
        for (const appt of (appointments || []).slice(0, 3)) {
          if (appt.medication) {
            for (const med of appt.medication) {
              recentMeds.push({ drug: med.drug || med.name || "" });
            }
          }
        }

        const result = runFullSafetyCheck({
          proposedDrugs,
          allergies: patient.allergies,
          weightKg: patient.lastVitals?.weight,
          ageMonths,
          currentMedications: recentMeds,
        });

        return {
          safe: result.safe,
          summary: result.summary,
          dosingNotes: result.dosingNotes,
          allergyWarnings: result.allergyWarnings,
          ageWarnings: result.ageWarnings,
          interactions: result.interactions,
          duplicates: result.duplicates,
        };
      },
    }),

    confirmPendingAction: tool({
      description:
        "Confirm and save a pending clinical proposal (diagnosis, medication, or lab exam) to the patient's record. Use when the doctor approves a proposal with 'yes', 'save', 'ok', 'go ahead', 'looks good'.",
      inputSchema: z.object({
        actionId: z.string().describe("The pending action ID to confirm"),
      }),
      execute: async ({ actionId }) => {
        await ctx.runMutation(internal.whatsappData.updatePendingAction, {
          actionId: actionId as Id<"whatsappPendingActions">,
          status: "confirmed",
        });
        return {
          type: "confirmed",
          message: "Proposal saved to the patient's record.",
        };
      },
    }),

    cancelPendingAction: tool({
      description:
        "Cancel/discard a pending clinical proposal. Use when the doctor says 'no', 'cancel', 'skip', 'discard', 'never mind'.",
      inputSchema: z.object({
        actionId: z.string().describe("The pending action ID to cancel"),
      }),
      execute: async ({ actionId }) => {
        await ctx.runMutation(internal.whatsappData.updatePendingAction, {
          actionId: actionId as Id<"whatsappPendingActions">,
          status: "cancelled",
        });
        return {
          type: "cancelled",
          message: "Proposal discarded.",
        };
      },
    }),
  };
}
