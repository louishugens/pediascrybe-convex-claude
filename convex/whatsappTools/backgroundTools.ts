/**
 * Background Tools — Long-running operations executed asynchronously.
 *
 * These tools schedule background jobs via ctx.scheduler and send
 * a follow-up WhatsApp message when complete.
 */
import { tool } from "ai";
import { z } from "zod";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

type ToolContext = {
  ctx: ActionCtx;
  doctorId: Id<"doctors">;
  phoneNumber: string;
};

export function createBackgroundTools({ ctx, doctorId, phoneNumber }: ToolContext) {
  return {
    generateFullReport: tool({
      description:
        "Generate a comprehensive patient report (may take 30-60s). Runs in background and sends result when ready. Use when the doctor asks for a 'full report', 'comprehensive report', or 'complete summary' for a patient.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
      }),
      execute: async ({ patientId }) => {
        await ctx.scheduler.runAfter(
          0,
          internal.whatsappBackground.generateFullReport,
          {
            doctorId,
            patientId: patientId as Id<"patients">,
            phoneNumber,
          }
        );
        return {
          type: "background_job",
          message: "Working on the comprehensive report... I'll send it when it's ready.",
        };
      },
    }),

    generateEndOfDaySummary: tool({
      description:
        "Generate a summary of today's patients, findings, and pending follow-ups. Runs in background. Use when the doctor says 'wrap up my day', 'end of day summary', or 'daily summary'.",
      inputSchema: z.object({}),
      execute: async () => {
        await ctx.scheduler.runAfter(
          0,
          internal.whatsappBackground.generateEndOfDaySummary,
          { doctorId, phoneNumber }
        );
        return {
          type: "background_job",
          message: "Working on your daily summary... I'll send it shortly.",
        };
      },
    }),

    batchVaccineCheck: tool({
      description:
        "Check vaccine status for all patients in a given age range. Runs in background. Use when the doctor asks to check vaccines for a group, e.g., 'which patients under 2 need vaccines?'",
      inputSchema: z.object({
        minAgeMonths: z.number().optional().describe("Minimum age in months (default 0)"),
        maxAgeMonths: z.number().optional().describe("Maximum age in months (default 60 = 5 years)"),
      }),
      execute: async ({ minAgeMonths, maxAgeMonths }) => {
        await ctx.scheduler.runAfter(
          0,
          internal.whatsappBackground.batchVaccineCheck,
          {
            doctorId,
            phoneNumber,
            minAgeMonths: minAgeMonths || 0,
            maxAgeMonths: maxAgeMonths || 60,
          }
        );
        return {
          type: "background_job",
          message: "Checking vaccine status for your patients... I'll send the results when done.",
        };
      },
    }),

    sendPrescriptionPdf: tool({
      description:
        "Generate and send a prescription as a PDF document via WhatsApp. Use when the doctor asks for a prescription PDF, e.g., 'send me the prescription for Jean' or 'PDF of the last prescription'.",
      inputSchema: z.object({
        appointmentId: z.string().describe("The appointment ID that contains the prescription"),
      }),
      execute: async ({ appointmentId }) => {
        await ctx.scheduler.runAfter(
          0,
          internal.whatsappBackground.sendPrescriptionPdf,
          {
            doctorId,
            appointmentId: appointmentId as Id<"appointments">,
            phoneNumber,
          }
        );
        return {
          type: "background_job",
          message: "Generating the prescription PDF... I'll send it in a moment.",
        };
      },
    }),

    sendLabExamPdf: tool({
      description:
        "Generate and send a lab exam order as a PDF document via WhatsApp. Use when the doctor asks for lab exam PDF.",
      inputSchema: z.object({
        appointmentId: z.string().describe("The appointment ID that contains the lab exams"),
      }),
      execute: async ({ appointmentId }) => {
        await ctx.scheduler.runAfter(
          0,
          internal.whatsappBackground.sendLabExamPdf,
          {
            doctorId,
            appointmentId: appointmentId as Id<"appointments">,
            phoneNumber,
          }
        );
        return {
          type: "background_job",
          message: "Generating the lab exam PDF... I'll send it in a moment.",
        };
      },
    }),

    sendReceiptPdf: tool({
      description:
        "Generate and send a receipt/invoice as a PDF document via WhatsApp. Use when the doctor asks for a receipt PDF.",
      inputSchema: z.object({
        receiptId: z.string().describe("The receipt ID"),
      }),
      execute: async ({ receiptId }) => {
        await ctx.scheduler.runAfter(
          0,
          internal.whatsappBackground.sendReceiptPdf,
          {
            doctorId,
            receiptId: receiptId as Id<"receipts">,
            phoneNumber,
          }
        );
        return {
          type: "background_job",
          message: "Generating the receipt PDF... I'll send it in a moment.",
        };
      },
    }),

    sendPatientSummaryPdf: tool({
      description:
        "Generate and send a patient summary as a PDF document via WhatsApp. Use when the doctor asks for a patient summary PDF, e.g., 'send me a PDF summary of Jean' or 'patient file for Marie'.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
      }),
      execute: async ({ patientId }) => {
        await ctx.scheduler.runAfter(
          0,
          internal.whatsappBackground.sendPatientSummaryPdf,
          {
            doctorId,
            patientId: patientId as Id<"patients">,
            phoneNumber,
          }
        );
        return {
          type: "background_job",
          message: "Generating the patient summary PDF... I'll send it in a moment.",
        };
      },
    }),
  };
}
