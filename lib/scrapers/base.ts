import { sanitizePlainText } from "../security.ts";

export function cleanString(str?: string | null): string {
  return sanitizePlainText(str);
}

export function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base || "hackathon"}-${randomSuffix}`;
}

export const DEVNOVATE_MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

export function parseDevnovateDate(str?: string | null, fallback?: Date | null): Date | null {
  if (!str || typeof str !== "string") return fallback ?? null;
  const s = str.trim();
  // 1. DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmy) {
    const yr = dmy[3];
    const mo = dmy[2].padStart(2, "0");
    const dy = dmy[1].padStart(2, "0");
    const timeMatch = s.match(/[T\s](\d{1,2}):(\d{2})/);
    const tm = timeMatch ? `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}:00` : "00:00:00";
    return new Date(`${yr}-${mo}-${dy}T${tm}+05:30`);
  }
  // 2. YYYY-MM-DD or YYYY/MM/DD with optional time
  const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymd) {
    const yr = ymd[1];
    const mo = ymd[2].padStart(2, "0");
    const dy = ymd[3].padStart(2, "0");
    const timeMatch = s.match(/[T\s](\d{1,2}):(\d{2})/);
    const tm = timeMatch ? `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}:00` : "00:00:00";
    return new Date(`${yr}-${mo}-${dy}T${tm}+05:30`);
  }
  // 3. Fallback to standard Date
  const d = new Date(s);
  return isNaN(d.getTime()) ? (fallback ?? null) : d;
}

export function parseDevnovateScheduleItem(
  dayStr: string | undefined,
  timeStr: string | undefined,
  baseDate: Date
): Date {
  let yr = baseDate.getFullYear();
  let mo = baseDate.getMonth() + 1;
  let dy = baseDate.getDate();

  if (dayStr) {
    const s = dayStr.trim();
    // 1. Day X (e.g. 'Day 2' or 'Day 1')
    const dayNumMatch = s.match(/Day\s*(\d+)/i);
    if (dayNumMatch) {
      const offset = parseInt(dayNumMatch[1], 10) - 1;
      const ref = new Date(baseDate.getTime() + Math.max(0, offset) * 86400000);
      yr = ref.getFullYear();
      mo = ref.getMonth() + 1;
      dy = ref.getDate();
    }

    // 2. '27 October 2026' or '2 Nov 2026'
    const dmyWord = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)(?:\s+(\d{4}))?/i);
    if (dmyWord) {
      const monthKey = dmyWord[2].toLowerCase();
      if (DEVNOVATE_MONTHS[monthKey]) {
        dy = parseInt(dmyWord[1], 10);
        mo = DEVNOVATE_MONTHS[monthKey];
        if (dmyWord[3]) yr = parseInt(dmyWord[3], 10);
      }
    } else {
      // 3. 'October 23, 2026'
      const mdyWord = s.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*(\d{4}))?/i);
      if (mdyWord) {
        const monthKey = mdyWord[1].toLowerCase();
        if (DEVNOVATE_MONTHS[monthKey]) {
          dy = parseInt(mdyWord[2], 10);
          mo = DEVNOVATE_MONTHS[monthKey];
          if (mdyWord[3]) yr = parseInt(mdyWord[3], 10);
        }
      }
    }
  }

  // Time parsing
  let hours = 9;
  let mins = 0;

  if (timeStr) {
    const t = timeStr.trim();
    const ampmMatch = t.match(/(\d{1,2})(?:[:.](\d{2}))?\s*(AM|PM)/i);
    if (ampmMatch) {
      let h = parseInt(ampmMatch[1], 10);
      const m = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
      const isPM = ampmMatch[3].toUpperCase() === "PM";
      if (isPM && h < 12) h += 12;
      if (!isPM && h === 12) h = 0;
      hours = h;
      mins = m;
    } else {
      const time24 = t.match(/(\d{1,2}):(\d{2})/);
      if (time24) {
        hours = parseInt(time24[1], 10);
        mins = parseInt(time24[2], 10);
      } else if (/morning/i.test(t)) {
        hours = 9;
      } else if (/afternoon/i.test(t)) {
        hours = 14;
      } else if (/evening/i.test(t)) {
        hours = 18;
      } else if (/deadline|closing|submission/i.test(t)) {
        hours = 23;
        mins = 59;
      }
    }
  }

  const yrStr = String(yr);
  const moStr = String(mo).padStart(2, "0");
  const dyStr = String(dy).padStart(2, "0");
  const hrStr = String(hours).padStart(2, "0");
  const mnStr = String(mins).padStart(2, "0");

  const computed = new Date(`${yrStr}-${moStr}-${dyStr}T${hrStr}:${mnStr}:00+05:30`);
  return isNaN(computed.getTime()) ? baseDate : computed;
}

export function extractSmartDetailsFromUrl(
  url: string,
  platform: string,
  currentTitle: string
): { title: string; description: string } {
  const trimmed = cleanString(currentTitle);
  const lower = trimmed.toLowerCase();
  const isGeneric =
    !trimmed ||
    trimmed === "Imported Hackathon" ||
    trimmed.includes("Just a moment") ||
    trimmed.includes("403 Forbidden") ||
    trimmed.includes("Attention Required") ||
    trimmed.includes("Cloudflare") ||
    ["unstop", "devfolio", "devpost", "luma", "hack2skill", "devnovate", "home", "competitions", "hackathons", "untitled"].includes(lower) ||
    lower.includes("competitions, quizzes");

  if (!isGeneric) {
    return { title: trimmed, description: "" };
  }

  try {
    const parsed = new URL(url);

    // 1. Devpost Subdomain extraction (e.g. nebiusglobalaihackathon.devpost.com)
    if (parsed.hostname.includes("devpost.com")) {
      const sub = parsed.hostname.split(".")[0];
      if (sub && sub !== "devpost" && sub !== "www") {
        const formatted = sub
          .replace(/[-_]+/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/hackathon/gi, " Hackathon")
          .replace(/global/gi, " Global")
          .replace(/ai/gi, " AI ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return {
          title: formatted,
          description: `Extracted challenge from Devpost (${formatted}). Review schedule gates and squad capacity below.`,
        };
      }
    }

    // 2. Check query parameters like utm_source, utm_campaign, challenge
    const utmCampaign = parsed.searchParams.get("utm_campaign") || "";
    const challengeParam = parsed.searchParams.get("challenge") || "";
    const candidate = challengeParam || utmCampaign;

    if (candidate && !["logged_out_user", "share", "referral"].includes(candidate.toLowerCase())) {
      const formatted = candidate
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        title: `${formatted}`,
        description: `Auto-extracted ${formatted} on ${platform}. Review your sprint gates and team capacity below.`,
      };
    }

    // 3. Check path segments (e.g. /hackathons/flipkart-grid-60-...-1025542)
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];

    if (lastPart && !["hackathons", "competitions", "events", "o", "challenges"].includes(lastPart.toLowerCase())) {
      let cleaned = lastPart
        .replace(/-\d{4,}$/, "") // strip trailing numerical portal ID (e.g. -1025542)
        .replace(/[-_]+/g, " ")
        .replace(/\b(\d{1,2})0\b/g, "$1.0 ") // e.g. 60 -> 6.0
        .replace(/\s+/g, " ")
        .trim();

      const formatted = cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        title: formatted,
        description: `Extracted ${formatted} challenge on ${platform}. Review squad duties and timeline gates below.`,
      };
    }
  } catch {
    // URL parsing failed; fallback
  }

  const capitalizedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
  return {
    title: `${capitalizedPlatform} Hackathon Challenge`,
    description: `Extracted from ${capitalizedPlatform}. Review tracks and timeline gates below.`,
  };
}
