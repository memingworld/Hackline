import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a Date object or ISO string into a local HTML datetime-local input string: `YYYY-MM-DDTHH:mm`.
 */
export function toLocalDatetimeString(dateInput?: string | null | Date): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format a Date object or ISO string into a calendar date key: `YYYY-MM-DD`.
 */
export function toDateKey(dateInput?: string | null | Date): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
