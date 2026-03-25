/**
 * Patient Tools — AI SDK tool definitions for patient data access.
 *
 * These are NOT Convex functions. They are AI SDK tool definitions
 * that call Convex internal queries via the action context.
 */
import { tool } from "ai";
import { z } from "zod";
import type { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { omitPII } from "../whatsappPrompts";

type ToolContext = {
  ctx: ActionCtx;
  doctorId: Id<"doctors">;
};

export function createPatientTools({ ctx, doctorId }: ToolContext) {
  return {
    searchPatients: tool({
      description:
        "Search the doctor's patients by name. Use this when the doctor mentions a patient by name or asks about a patient.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Patient name or partial name to search for"),
      }),
      execute: async ({ query }) => {
        const results = await ctx.runQuery(
          internal.whatsappData.searchPatients,
          { doctorId, query }
        );

        if (results.length === 0) {
          return { found: false, message: `No patients found matching "${query}"` };
        }

        return {
          found: true,
          count: results.length,
          patients: results.map((p) => omitPII(p, ["phone"])),
        };
      },
    }),

    getPatientSummary: tool({
      description:
        "Get a full patient profile: demographics, allergies, medical history, recent vitals, medications. Use this after identifying a patient.",
      inputSchema: z.object({
        patientId: z
          .string()
          .describe("The patient's ID (from searchPatients result)"),
      }),
      execute: async ({ patientId }) => {
        const summary = await ctx.runQuery(
          internal.whatsappData.getPatientSummary,
          { doctorId, patientId: patientId as Id<"patients"> }
        );
        return omitPII(summary, ["phone", "mothername"]);
      },
    }),

    getPatientAppointments: tool({
      description:
        "Get all appointments for a patient, optionally filtered by date range.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
        startDate: z
          .number()
          .optional()
          .describe("Start date as Unix timestamp (ms)"),
        endDate: z
          .number()
          .optional()
          .describe("End date as Unix timestamp (ms)"),
      }),
      execute: async ({ patientId, startDate, endDate }) => {
        return await ctx.runQuery(
          internal.whatsappData.getPatientAppointments,
          {
            doctorId,
            patientId: patientId as Id<"patients">,
            startDate,
            endDate,
          }
        );
      },
    }),

    getVaccinationRecords: tool({
      description:
        "Get a patient's vaccination history and which vaccines may be due.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
      }),
      execute: async ({ patientId }) => {
        return await ctx.runQuery(
          internal.whatsappData.getVaccinationRecords,
          { doctorId, patientId: patientId as Id<"patients"> }
        );
      },
    }),

    getPatientGrowthData: tool({
      description:
        "Get a patient's growth measurements over time (weight, height, head circumference).",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
      }),
      execute: async ({ patientId }) => {
        return await ctx.runQuery(
          internal.whatsappData.getPatientGrowthData,
          { doctorId, patientId: patientId as Id<"patients"> }
        );
      },
    }),
  };
}
