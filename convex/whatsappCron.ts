"use node";

/**
 * WhatsApp Cron Jobs
 *
 * Scheduled actions for proactive WhatsApp notifications.
 * Runs hourly — each doctor gets their summary at 7am in their local timezone.
 */
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { sendTextMessage } from "./whatsappClient";

const DEFAULT_TIMEZONE = "America/Port-au-Prince";
const SUMMARY_HOUR = 7; // 7am local time

/**
 * Check if it's currently the target hour in a given timezone.
 */
function isLocalHour(tz: string, targetHour: number): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    hour12: false,
  });
  const localHour = parseInt(formatter.format(now), 10);
  return localHour === targetHour;
}

/**
 * Send a proactive daily summary to all linked doctors.
 * Runs every hour — only sends to doctors whose local time is 7am.
 */
export const sendDailySummaries = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all active WhatsApp links
    const links: { doctorId: any; phoneNumber: string }[] = await ctx.runQuery(
      internal.whatsappLinks.getAllActiveLinks,
      {}
    );

    if (links.length === 0) return;

    for (const link of links) {
      try {
        // Get doctor profile to check timezone
        const doctor: any = await ctx.runQuery(
          internal.whatsappData.getDoctorById,
          { doctorId: link.doctorId }
        );

        const tz = doctor?.timezone || DEFAULT_TIMEZONE;

        // Only send if it's 7am in the doctor's timezone
        if (!isLocalHour(tz, SUMMARY_HOUR)) continue;

        // Check if doctor still has feature access
        const access = await ctx.runQuery(
          internal.whatsappData.checkFeatureAccess,
          { doctorId: link.doctorId }
        );
        if (!access.hasAccess) continue;

        // Get today's schedule
        const schedule = await ctx.runQuery(
          internal.whatsappData.getTodaySchedule,
          { doctorId: link.doctorId }
        );

        const doctorName = doctor
          ? `Dr. ${doctor.lastname}`
          : "Doctor";

        const patientCount = schedule.length;
        if (patientCount === 0) {
          await sendTextMessage(
            link.phoneNumber,
            `Good morning ${doctorName}. You have no appointments scheduled for today.\n\nNeed anything? I can help with patient lookups, reports, or vaccine checks — just ask.`
          );
        } else {
          const firstAppt = schedule[0];
          const firstTime = new Date(firstAppt.time).toLocaleTimeString("en-US", {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          await sendTextMessage(
            link.phoneNumber,
            `Good morning ${doctorName}! You have *${patientCount} patient${patientCount > 1 ? "s" : ""}* today. First appointment at ${firstTime}.\n\nReply *"schedule"* for the full list.`
          );
        }
      } catch (error) {
        console.error(`[Cron] Failed to send daily summary to ${link.phoneNumber}:`, error);
      }
    }
  },
});
