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

/**
 * Validate a Convex ID looks correct (not a model-fabricated one).
 * Convex IDs are base64-like strings, typically starting with a letter
 * and containing alphanumeric chars, not short prefixed strings like "PAT_xxx".
 */
function isValidConvexId(id: string): boolean {
  // Convex IDs are typically 20+ chars and don't contain underscores after a prefix
  return id.length >= 15 && !id.match(/^[A-Z]+_/);
}

export function createBackgroundTools({ ctx, doctorId, phoneNumber }: ToolContext) {
  return {
    generateFullReport: tool({
      description:
        "Generate a comprehensive patient report (may take 30-60s). Runs in background and sends result when ready. Use when the doctor asks for a 'full report', 'comprehensive report', or 'complete summary' for a patient.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
      }),
      execute: async ({ patientId }) => {
        if (!isValidConvexId(patientId)) {
          return { type: "error", message: `Invalid patient ID "${patientId}". Use the exact _id from a previous tool result.` };
        }
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
        if (!isValidConvexId(appointmentId)) {
          return { type: "error", message: `Invalid appointment ID "${appointmentId}". Use the exact _id from a previous tool result.` };
        }
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
        appointmentId: z.string().describe("The exact Convex appointment ID from a previous tool result"),
      }),
      execute: async ({ appointmentId }) => {
        if (!isValidConvexId(appointmentId)) {
          return { type: "error", message: `Invalid appointment ID "${appointmentId}". Use the exact _id from a previous tool result.` };
        }
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
        receiptId: z.string().describe("The exact Convex receipt ID from a previous tool result"),
      }),
      execute: async ({ receiptId }) => {
        if (!isValidConvexId(receiptId)) {
          return { type: "error", message: `Invalid receipt ID "${receiptId}". Use the exact _id from a previous tool result.` };
        }
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
        patientId: z.string().describe("The exact Convex patient ID from a previous tool result"),
      }),
      execute: async ({ patientId }) => {
        if (!isValidConvexId(patientId)) {
          return { type: "error", message: `Invalid patient ID "${patientId}". Use the exact _id from a previous tool result.` };
        }
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

    sendGrowthChartPdf: tool({
      description:
        "Generate and send a WHO growth chart as a PDF document via WhatsApp. IMPORTANT: Before calling this, you MUST ask which chart type the doctor wants. Available types: wfa (Weight for Age), hfa (Height for Age), hcfa (Head Circumference for Age), bfa (BMI for Age). You can send multiple charts if the doctor asks for 'all charts'. IMPORTANT: The patientId must be the exact Convex document ID from a previous tool result (e.g. from searchPatients or getPatientSummary), not a made-up ID.",
      inputSchema: z.object({
        patientId: z.string().describe("The exact Convex patient ID from a previous tool result"),
        chartType: z
          .string()
          .describe(
            "Chart type: 'wfa' (Weight for Age), 'hfa' (Height for Age), 'hcfa' (Head Circumference for Age), 'bfa' (BMI for Age)"
          ),
      }),
      execute: async ({ patientId, chartType }) => {
        if (!isValidConvexId(patientId)) {
          return {
            type: "error",
            message: `Invalid patient ID "${patientId}". Use the exact _id from searchPatients or getPatientSummary results.`,
          };
        }

        const validTypes = ["wfa", "hfa", "hcfa", "bfa"];
        if (!validTypes.includes(chartType)) {
          return {
            type: "error",
            message: `Invalid chart type "${chartType}". Use one of: wfa, hfa, hcfa, bfa.`,
          };
        }

        await ctx.scheduler.runAfter(
          0,
          internal.whatsappBackground.sendGrowthChartPdf,
          {
            doctorId,
            patientId: patientId as Id<"patients">,
            chartType,
            phoneNumber,
          }
        );

        const chartLabels: Record<string, string> = {
          wfa: "Weight for Age",
          hfa: "Height for Age",
          hcfa: "Head Circumference for Age",
          bfa: "BMI for Age",
        };

        return {
          type: "background_job",
          message: `Generating the ${chartLabels[chartType] || chartType} chart... I'll send it in a moment.`,
        };
      },
    }),
  };
}
