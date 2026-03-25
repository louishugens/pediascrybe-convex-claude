/**
 * Schedule Tools — AI SDK tool definitions for schedule/calendar access.
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

export function createScheduleTools({ ctx, doctorId }: ToolContext) {
  return {
    getTodaySchedule: tool({
      description:
        "Get today's appointment schedule with patient names and reasons. Use when the doctor asks about today's patients, schedule, or \"who do I have today?\"",
      inputSchema: z.object({}),
      execute: async () => {
        return await ctx.runQuery(internal.whatsappData.getTodaySchedule, {
          doctorId,
        });
      },
    }),

    getWeekSchedule: tool({
      description:
        "Get this week's full appointment schedule. Use when the doctor asks about the week's schedule.",
      inputSchema: z.object({}),
      execute: async () => {
        return await ctx.runQuery(internal.whatsappData.getWeekSchedule, {
          doctorId,
        });
      },
    }),

    getAvailableSlots: tool({
      description:
        "Get available appointment slots for a specific date. Use when the doctor asks about availability or wants to schedule something.",
      inputSchema: z.object({
        date: z
          .string()
          .describe(
            "The date to check in ISO format (YYYY-MM-DD), e.g., '2026-03-30'"
          ),
      }),
      execute: async ({ date }) => {
        return await ctx.runQuery(internal.whatsappData.getAvailableSlots, {
          doctorId,
          date,
        });
      },
    }),

    getDailyAnalytics: tool({
      description:
        "Get today's analytics: revenue, patient count, paid appointments. Use when the doctor asks about revenue, earnings, or daily stats.",
      inputSchema: z.object({}),
      execute: async () => {
        return await ctx.runQuery(internal.whatsappData.getDailyAnalytics, {
          doctorId,
        });
      },
    }),
  };
}
