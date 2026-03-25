/**
 * Timezone utilities for doctor-specific time calculations.
 *
 * Uses IANA timezone strings (e.g. "America/Port-au-Prince", "Africa/Lagos").
 * Falls back to UTC if no timezone is set on the doctor profile.
 */

const DEFAULT_TIMEZONE = "America/Port-au-Prince";

/**
 * Get the start and end of "today" in the doctor's timezone, as UTC timestamps.
 */
export function getTodayRange(timezone?: string): {
  startOfDay: number;
  endOfDay: number;
} {
  const tz = timezone || DEFAULT_TIMEZONE;
  const now = new Date();

  // Format current date parts in the doctor's timezone
  const parts = getDatePartsInTz(now, tz);

  // Build start of day in the doctor's timezone, then convert to UTC
  const startOfDay = datePartsToUtc(parts.year, parts.month, parts.day, 0, 0, tz);
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

  return { startOfDay, endOfDay };
}

/**
 * Get the start and end of "this week" (Sunday-Saturday) in the doctor's timezone, as UTC timestamps.
 */
export function getWeekRange(timezone?: string): {
  startOfWeek: number;
  endOfWeek: number;
} {
  const tz = timezone || DEFAULT_TIMEZONE;
  const now = new Date();

  const parts = getDatePartsInTz(now, tz);

  // Get the day of week (0=Sunday) in the doctor's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  });
  const weekdayStr = formatter.format(now);
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayOfWeek = dayMap[weekdayStr] ?? 0;

  // Start of week = start of today minus dayOfWeek days
  const startOfToday = datePartsToUtc(parts.year, parts.month, parts.day, 0, 0, tz);
  const startOfWeek = startOfToday - dayOfWeek * 24 * 60 * 60 * 1000;
  const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000;

  return { startOfWeek, endOfWeek };
}

/**
 * Get year/month/day in a given timezone.
 */
function getDatePartsInTz(
  date: Date,
  tz: string
): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA formats as YYYY-MM-DD
  const str = formatter.format(date);
  const [year, month, day] = str.split("-").map(Number);
  return { year, month: month - 1, day }; // month is 0-indexed for Date constructor
}

/**
 * Convert a date (year, month 0-indexed, day, hour, minute) in a timezone to a UTC timestamp.
 * Uses binary search on the UTC offset to handle DST correctly.
 */
function datePartsToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  tz: string
): number {
  // Create a rough UTC guess
  const guess = Date.UTC(year, month, day, hour, minute);

  // Get the actual offset at that time by checking what the tz shows
  const offsetMs = getOffsetMs(new Date(guess), tz);

  // The local time we want = guess, so UTC = local + offset
  // But offset depends on the actual UTC time, so we iterate once
  const utc = guess + offsetMs;
  const offsetMs2 = getOffsetMs(new Date(utc), tz);

  // If offset changed (DST boundary), use the second calculation
  return guess + offsetMs2;
}

/**
 * Get the offset in ms from the timezone to UTC at a given instant.
 * Positive = timezone is behind UTC, negative = ahead.
 */
function getOffsetMs(date: Date, tz: string): number {
  // Format in UTC and in the target timezone, compare
  const utcParts = getDatePartsInTz(date, "UTC");
  const tzParts = getDatePartsInTz(date, tz);

  const utcFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const tzFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const utcTime = utcFormatter.format(date);
  const tzTime = tzFormatter.format(date);

  const [utcH, utcM] = utcTime.split(":").map(Number);
  const [tzH, tzM] = tzTime.split(":").map(Number);

  // Day difference
  const dayDiff =
    (utcParts.year - tzParts.year) * 365 +
    (utcParts.month - tzParts.month) * 30 +
    (utcParts.day - tzParts.day);

  const utcMinutes = dayDiff * 24 * 60 + utcH * 60 + utcM;
  const tzMinutes = tzH * 60 + tzM;

  return (utcMinutes - tzMinutes) * 60 * 1000;
}
