/**
 * Chart, Report & Analytics Tools
 *
 * Tools for growth chart summaries, report data, receipts, and analytics.
 * PDF generation is client-side in the web app — these tools provide
 * text summaries and data for WhatsApp delivery.
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

export function createChartReportTools({ ctx, doctorId }: ToolContext) {
  return {
    generateGrowthSummary: tool({
      description:
        "Generate a text summary of a patient's growth data with WHO percentile analysis. Use when the doctor asks about growth, percentiles, or weight/height trends. Always provide the percentile positions — even with a single measurement. After providing the summary, offer to send growth chart PDFs (wfa, hfa, hcfa, bfa) — ask which chart(s) the doctor wants.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
      }),
      execute: async ({ patientId }) => {
        const growthData = await ctx.runQuery(
          internal.whatsappData.getPatientGrowthData,
          { doctorId, patientId: patientId as Id<"patients"> }
        );

        if (!growthData || growthData.dataPoints.length === 0) {
          return {
            type: "growth_summary",
            message: "No growth measurements recorded for this patient.",
          };
        }

        const latest = growthData.dataPoints[growthData.dataPoints.length - 1];
        const first = growthData.dataPoints[0];
        const dataPointCount = growthData.dataPoints.length;

        // Calculate trends (only with 2+ data points)
        const trends: any = {};
        if (first.weight && latest.weight && dataPointCount > 1) {
          trends.weightGain = +(latest.weight - first.weight).toFixed(1);
        }
        if (first.height && latest.height && dataPointCount > 1) {
          trends.heightGain = +(latest.height - first.height).toFixed(1);
        }

        return {
          type: "growth_summary",
          patient: growthData.patientName,
          sex: growthData.sex,
          age: growthData.age,
          dataPointCount,
          latest: {
            weight: latest.weight ? `${latest.weight}kg` : null,
            height: latest.height ? `${latest.height}cm` : null,
            head: latest.head ? `${latest.head}cm` : null,
            ageInDays: latest.ageInDays,
          },
          whoPercentiles: latest.percentiles || {},
          trends,
          allMeasurements: growthData.dataPoints.map((dp: any) => ({
            date: dp.date,
            ageInDays: dp.ageInDays,
            weight: dp.weight,
            height: dp.height,
            head: dp.head,
            percentiles: dp.percentiles,
          })),
        };
      },
    }),

    getReportsForPatient: tool({
      description:
        "Get all medical reports, certificates, and reference notes for a patient. Use when the doctor asks about existing reports.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
      }),
      execute: async ({ patientId }) => {
        const reports = await ctx.runQuery(
          internal.whatsappData.getPatientReports,
          { doctorId, patientId: patientId as Id<"patients"> }
        );
        return reports;
      },
    }),

    getReceiptsForPatient: tool({
      description:
        "Get billing receipts for a patient. Use when the doctor asks about invoices, payments, or receipts.",
      inputSchema: z.object({
        patientId: z.string().describe("The patient's ID"),
      }),
      execute: async ({ patientId }) => {
        const receipts = await ctx.runQuery(
          internal.whatsappData.getPatientReceipts,
          { doctorId, patientId: patientId as Id<"patients"> }
        );
        return receipts;
      },
    }),

    getMonthlyAnalytics: tool({
      description:
        "Get monthly analytics: revenue trends, patient count growth, top services. Use when the doctor asks about monthly stats, trends, or 'how was this month?'",
      inputSchema: z.object({
        month: z.string().optional().describe("Month in YYYY-MM format. Defaults to current month."),
      }),
      execute: async ({ month }) => {
        return await ctx.runQuery(
          internal.whatsappData.getMonthlyAnalytics,
          { doctorId, month }
        );
      },
    }),
  };
}
