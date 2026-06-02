import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run hourly — each doctor gets their daily summary at 7am in their local timezone
crons.hourly(
  "whatsapp-daily-summary",
  { minuteUTC: 0 },
  internal.whatsappCron.sendDailySummaries,
);

// Consolidate duplicate doctor preferences weekly (Sunday midnight UTC)
crons.weekly(
  "consolidate-preferences",
  { hourUTC: 0, minuteUTC: 0, dayOfWeek: "sunday" },
  internal.whatsappPreferences.consolidatePreferences,
);

// STANDALONE: billing removed — monthly usage reset and telehealth overage
// billing crons dropped (usage is unlimited; there is nothing to bill).

export default crons;
