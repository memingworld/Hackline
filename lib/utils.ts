import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const APP_TIMEZONE = "Asia/Kolkata";

/**
 * Format a Date object or ISO string into a local HTML datetime-local input string: `YYYY-MM-DDTHH:mm`.
 * Defaults to Asia/Kolkata (IST) so inputs remain strictly consistent across server and client.
 */
export function toLocalDatetimeString(
  dateInput?: string | null | Date,
  timeZone: string = APP_TIMEZONE
): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);

    const map: Record<string, string> = {};
    for (const part of parts) {
      map[part.type] = part.value;
    }

    return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
  } catch {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

/**
 * Format a Date object or ISO string into a calendar date key: `YYYY-MM-DD`.
 * Defaults to Asia/Kolkata (IST).
 */
export function toDateKey(
  dateInput?: string | null | Date,
  timeZone: string = APP_TIMEZONE
): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);

    const map: Record<string, string> = {};
    for (const part of parts) {
      map[part.type] = part.value;
    }

    return `${map.year}-${map.month}-${map.day}`;
  } catch {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
}

/**
 * Parse a datetime string (which may be a local datetime-local string without timezone)
 * into a valid UTC ISO string, interpreting local times in Asia/Kolkata (IST, +05:30).
 */
export function parseDateTimeInputToUtc(
  dateInput?: string | Date | null,
  timeZone: string = APP_TIMEZONE
): string {
  if (!dateInput) return new Date().toISOString();
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? new Date().toISOString() : dateInput.toISOString();
  }

  const str = String(dateInput).trim();
  if (!str) return new Date().toISOString();

  // If already an ISO string with UTC or explicit timezone offset
  if (str.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  // If datetime-local without timezone: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
  const withSeconds = str.length === 16 ? `${str}:00` : str;
  const offset = timeZone === "Asia/Kolkata" ? "+05:30" : "+00:00";
  const withOffset = `${withSeconds}${offset}`;
  const d = new Date(withOffset);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? new Date().toISOString() : fallback.toISOString();
}

/**
 * Format a timestamp into user-friendly localized date & time in IST.
 * e.g. "Oct 19, 12:00 AM" or "Oct 19, 12:00 AM IST"
 */
export function formatDateTimeIst(
  dateInput?: string | Date | null,
  options?: Intl.DateTimeFormatOptions & { includeTz?: boolean }
): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const { includeTz = false, ...intlOptions } = options || {};

  try {
    const formatted = d.toLocaleString("en-US", {
      timeZone: APP_TIMEZONE,
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      ...intlOptions,
    });
    return includeTz ? `${formatted} IST` : formatted;
  } catch {
    return d.toLocaleString();
  }
}

/**
 * Format a timestamp into localized date in IST.
 * e.g. "Oct 19, 2026"
 */
export function formatDateIst(
  dateInput?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  try {
    return d.toLocaleDateString("en-US", {
      timeZone: APP_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
      ...options,
    });
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Format a timestamp into localized time in IST.
 * e.g. "12:00 AM"
 */
export function formatTimeIst(
  dateInput?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  try {
    return d.toLocaleTimeString("en-US", {
      timeZone: APP_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      ...options,
    });
  } catch {
    return d.toLocaleTimeString();
  }
}

/**
 * Formats a deadline for notifications in the user's localized time (e.g. IST)
 * with both the localized datetime string and an explicit countdown string.
 */
export function formatNotificationDeadline(
  dateInput: string | Date,
  options?: {
    preferredTimezone?: string | null;
    phoneNumber?: string | null;
    referenceTimeMs?: number;
  }
): {
  localizedDateTime: string; // e.g. "Oct 16, 12:06 AM IST"
  displayString: string;     // e.g. "Oct 16, 12:06 AM IST (1h 56m remaining)"
  countdownText: string;     // e.g. "1h 56m remaining"
} {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return {
      localizedDateTime: String(dateInput),
      displayString: String(dateInput),
      countdownText: "",
    };
  }

  // Determine user timezone:
  // 1. Explicit preference if provided
  // 2. If phone starts with +91 -> Asia/Kolkata
  // 3. Default to "Asia/Kolkata" (IST)
  let tz = options?.preferredTimezone?.trim();
  if (!tz) {
    if (options?.phoneNumber?.trim().startsWith("+91")) {
      tz = "Asia/Kolkata";
    } else {
      tz = "Asia/Kolkata";
    }
  }

  let localDateStr = "";
  let tzAbbr = "IST";

  try {
    localDateStr = date.toLocaleString("en-US", {
      timeZone: tz,
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(date);
    tzAbbr = parts.find((p) => p.type === "timeZoneName")?.value || tz;
    if (tz === "Asia/Kolkata" || tzAbbr.includes("GMT+5:30")) {
      tzAbbr = "IST";
    }
  } catch {
    localDateStr = date.toUTCString();
    tzAbbr = "UTC";
  }

  const localizedDateTime = `${localDateStr} ${tzAbbr}`;

  // Compute countdown relative to reference time (defaults to now)
  const nowMs = options?.referenceTimeMs ?? Date.now();
  const diffMs = date.getTime() - nowMs;
  const diffHours = diffMs / (1000 * 60 * 60);

  let countdownText = "";
  if (diffHours <= 0) {
    const passedMins = Math.round(Math.abs(diffHours) * 60);
    countdownText = passedMins > 60
      ? `Passed ${Math.round(passedMins / 60)}h ago`
      : `Passed ${passedMins}m ago`;
  } else {
    const totalMinutes = Math.round(diffHours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) {
      countdownText = `${mins}m remaining`;
    } else if (mins === 0) {
      countdownText = `${hrs}h remaining`;
    } else {
      countdownText = `${hrs}h ${mins}m remaining`;
    }
  }

  const displayString = `${localizedDateTime} (${countdownText})`;

  return {
    localizedDateTime,
    displayString,
    countdownText,
  };
}

/**
 * Format a platform identifier into a clean brand name.
 * Prevents translation issues and normalizes display casing.
 */
export function formatPlatformName(platform?: string | null): string {
  if (!platform) return "Custom";
  const lower = platform.toLowerCase();
  switch (lower) {
    case "unstop":
      return "Unstop";
    case "devfolio":
      return "Devfolio";
    case "devpost":
      return "Devpost";
    case "devnovate":
      return "Devnovate";
    case "luma":
      return "Luma";
    case "hack2skill":
      return "Hack2skill";
    case "custom":
      return "Custom";
    default:
      return platform.charAt(0).toUpperCase() + platform.slice(1);
  }
}
