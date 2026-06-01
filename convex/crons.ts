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

// Monthly — zero AI credits, pack balance, WhatsApp trial, telehealth minutes
// on the 1st at 00:00 UTC. Period string is computed by the handler.
crons.monthly(
  "reset-monthly-usage",
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.usage.resetCurrentPeriodUsage,
);

// Monthly — bill telehealth minute overages from the previous period as
// one-time invoice items on each doctor's Stripe subscription.
// Runs at 00:30 UTC so reset-monthly-usage has already completed.
crons.monthly(
  "telehealth-overage-billing",
  { day: 1, hourUTC: 0, minuteUTC: 30 },
  internal.billingCrons.billTelehealthOverages,
);

export default crons;
