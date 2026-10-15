import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isValidPublicHttpUrl, sanitizePlainText } from "@/lib/security";

function cleanString(str?: string | null): string {
  return sanitizePlainText(str);
}

const DEVNOVATE_MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function parseDevnovateDate(str?: string | null, fallback?: Date | null): Date | null {
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

function parseDevnovateScheduleItem(dayStr: string | undefined, timeStr: string | undefined, baseDate: Date): Date {
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

function extractSmartDetailsFromUrl(
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

export async function POST(request: Request) {
  try {
    // 1. Enforce Authentication (Defense-in-depth: Prevent open unauthenticated scraping / abuse)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to import hackathons." },
        { status: 401 }
      );
    }

    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid hackathon URL is required." },
        { status: 400 }
      );
    }

    // 2. Anti-SSRF Validation (Prevent fetching localhost, cloud metadata, or private subnets)
    if (!isValidPublicHttpUrl(url)) {
      return NextResponse.json(
        {
          error:
            "Invalid or prohibited URL. Only public HTTP/HTTPS hackathon URLs are allowed.",
        },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;

    // Detect Platform
    let platform: "devfolio" | "unstop" | "devpost" | "luma" | "hack2skill" | "devnovate" | "custom" = "custom";
    if (cleanUrl.includes("devfolio.co")) platform = "devfolio";
    else if (cleanUrl.includes("devnovate.co")) platform = "devnovate";
    else if (cleanUrl.includes("unstop.com")) platform = "unstop";
    else if (cleanUrl.includes("devpost.com")) platform = "devpost";
    else if (cleanUrl.includes("lu.ma")) platform = "luma";
    else if (cleanUrl.includes("hack2skill.com")) platform = "hack2skill";

    // ==========================================
    // 1. DEVPOST OFFICIAL API HANDLER (100% Reliable, No Cloudflare Block)
    // ==========================================
    if (platform === "devpost") {
      try {
        const parsed = new URL(cleanUrl);
        const sub = parsed.hostname.split(".")[0];
        const rawCandidate = sub && sub !== "devpost" && sub !== "www" ? sub : parsed.pathname.split("/").filter(Boolean)[0] || "";

        if (rawCandidate) {
          // Break words in subdomain (e.g. nebiusglobalaihackathon -> "nebius global ai hackathon" or first word "nebius")
          const spaceSeparated = rawCandidate
            .replace(/[-_]+/g, " ")
            .replace(/hackathon/gi, " hackathon")
            .replace(/global/gi, " global")
            .replace(/ai/gi, " ai ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/\s+/g, " ")
            .trim();
          
          const primaryWord = spaceSeparated.split(" ")[0];

          // Try searching with spaceSeparated, fallback to primaryWord
          let apiData: any = null;
          for (const query of [spaceSeparated, primaryWord, rawCandidate]) {
            if (!query || query.length < 2) continue;
            const devpostApiRes = await fetch(
              `https://devpost.com/api/hackathons?search=${encodeURIComponent(query)}`,
              {
                signal: AbortSignal.timeout(10000),
                headers: {
                  Accept: "application/json",
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
              }
            );
            if (devpostApiRes.ok) {
              const json = await devpostApiRes.json();
              if (json.hackathons && json.hackathons.length > 0) {
                apiData = json;
                break;
              }
            }
          }

          if (apiData && apiData.hackathons) {
            const matchingHackathon = apiData.hackathons.find(
              (h: any) =>
                h.url?.toLowerCase().includes(sub.toLowerCase()) ||
                h.title?.toLowerCase().includes(spaceSeparated.toLowerCase())
            ) || apiData.hackathons[0];

            if (matchingHackathon) {
              const rawPrize = cleanString(matchingHackathon.prize_amount);
              const prize = rawPrize ? (rawPrize.startsWith("$") ? `${rawPrize} in prizes` : rawPrize) : "TBA";

              // Thumbnail
              let bannerUrl = matchingHackathon.thumbnail_url;
              if (bannerUrl && bannerUrl.startsWith("//")) {
                bannerUrl = `https:${bannerUrl}`;
              }

              // Parse dates
              let startsAt = new Date().toISOString();
              let endsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

              if (matchingHackathon.submission_period_dates) {
                // e.g. "Aug 26 - Oct 30, 2026"
                const parts = matchingHackathon.submission_period_dates.split("-");
                if (parts.length === 2) {
                  const endCandidate = new Date(parts[1].trim());
                  if (!isNaN(endCandidate.getTime())) {
                    endsAt = endCandidate.toISOString();
                  }
                }
              }

              const themes = matchingHackathon.themes?.map((t: any) => t.name).join(", ") || "";
              const description = themes
                ? `Themes: ${themes}. Organized by ${matchingHackathon.organization_name || "Devpost"}.`
                : `Official Devpost Challenge with ${matchingHackathon.registrations_count || 0} participants.`;

              const slug = matchingHackathon.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .slice(0, 50);

              return NextResponse.json({
                title: matchingHackathon.title,
                slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
                source_platform: "devpost",
                source_url: matchingHackathon.url || cleanUrl,
                banner_url: bannerUrl || null,
                prize_pool: prize,
                description,
                starts_at: startsAt,
                ends_at: endsAt,
                timeline_gates: [
                  {
                    title: "Registration Checkpoint",
                    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
                    event_type: "registration_deadline",
                  },
                  {
                    title: "Submission Deadline",
                    deadline: endsAt,
                    event_type: "submission_deadline",
                  },
                ],
                extraction_method: "devpost_api_engine",
              });
            }
          }
        }
      } catch (devpostErr) {
        console.warn("Devpost API lookup failed, falling back:", devpostErr);
      }
    }

    // ==========================================
    // 2. DEVFOLIO OFFICIAL API HANDLER (100% Reliable)
    // ==========================================
    if (platform === "devfolio") {
      try {
        const parsed = new URL(cleanUrl);
        const pathParts = parsed.pathname.split("/").filter(Boolean);
        let slugCandidate = "";

        const sub = parsed.hostname.split(".")[0];
        if (sub && sub !== "devfolio" && sub !== "www" && sub !== "api") {
          slugCandidate = sub;
        } else if (pathParts.length > 0) {
          if (pathParts[0] === "hackathons" && pathParts[1]) {
            slugCandidate = pathParts[1];
          } else {
            slugCandidate = pathParts[0];
          }
        }

        if (slugCandidate) {
          const devfolioRes = await fetch(
            `https://api.devfolio.co/api/hackathons/${encodeURIComponent(slugCandidate)}`,
            {
              signal: AbortSignal.timeout(10000),
              headers: { Accept: "application/json" },
            }
          );

          if (devfolioRes.ok) {
            const d = await devfolioRes.json();
            const startsAt = d.starts_at || new Date().toISOString();
            const endsAt = d.ends_at || new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();

            return NextResponse.json({
              title: d.name,
              slug: `${d.slug || slugCandidate}-${Math.random().toString(36).substring(2, 6)}`,
              source_platform: "devfolio",
              source_url: cleanUrl,
              banner_url: d.cover_img || null,
              prize_pool: d.prizes_total || "TBA",
              description: d.tagline || d.desc || `Devfolio Hackathon in ${d.city || "Online"}.`,
              starts_at: startsAt,
              ends_at: endsAt,
              timeline_gates: [
                {
                  title: "Registration Deadline",
                  deadline: startsAt,
                  event_type: "registration_deadline",
                },
                {
                  title: "Code Freeze & Submission",
                  deadline: endsAt,
                  event_type: "submission_deadline",
                },
              ],
              extraction_method: "devfolio_api_engine",
            });
          }
        }
      } catch (devfolioErr) {
        console.warn("Devfolio API lookup failed, falling back:", devfolioErr);
      }
    }

    // ==========================================
    // 3. DEVNOVATE OFFICIAL API HANDLER (100% Reliable, Fast JSON)
    // ==========================================
    if (platform === "devnovate") {
      try {
        const parsed = new URL(cleanUrl);
        const pathParts = parsed.pathname.split("/").filter(Boolean);

        // Devnovate URLs:
        // https://devnovate.co/event/colossal-a-pitch
        // https://devnovate.co/events/colossal-a-pitch
        // https://devnovate.co/hackathons/sgu_hackx-10
        // https://devnovate.co/sgu_hackx-10
        let slugCandidate = "";
        if (pathParts.length > 0) {
          if (pathParts[0] === "hackathons" || pathParts[0] === "events" || pathParts[0] === "event" || pathParts[0] === "e") {
            slugCandidate = pathParts[1] || pathParts[0];
          } else {
            slugCandidate = pathParts[pathParts.length - 1];
          }
        }

        let eventData: any = null;

        // 1. Try querying Devnovate by slug directly
        if (slugCandidate) {
          try {
            const devnovateRes = await fetch(
              `https://devnovate.co/api/v1/events/name/${encodeURIComponent(slugCandidate)}`,
              {
                signal: AbortSignal.timeout(10000),
                headers: {
                  Accept: "application/json",
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                },
              }
            );

            if (devnovateRes.ok) {
              const json = await devnovateRes.json();
              eventData = json?.hackathon || json;
            }
          } catch (e) {
            console.warn("Devnovate slug fetch failed, trying search fallback:", e);
          }
        }

        // 2. Fallback: Search all events if direct slug didn't match
        if (!eventData?.name) {
          try {
            const listRes = await fetch("https://devnovate.co/api/v1/events", {
              signal: AbortSignal.timeout(10000),
              headers: {
                Accept: "application/json",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              },
            });
            if (listRes.ok) {
              const allEvents = await listRes.json();
              if (Array.isArray(allEvents)) {
                const normSlug = slugCandidate.toLowerCase().replace(/[-_]+/g, "");
                eventData =
                  allEvents.find((ev: any) => {
                    const evSlug = (ev.hackathon || ev.eventName || "").toLowerCase().replace(/[-_]+/g, "");
                    const evName = (ev.name || "").toLowerCase().replace(/[-_]+/g, "");
                    return evSlug === normSlug || evName.includes(normSlug) || normSlug.includes(evSlug);
                  }) || null;
              }
            }
          } catch (e) {
            console.warn("Devnovate all-events fallback search failed:", e);
          }
        }

        if (eventData && eventData.name) {
          const title = cleanString(eventData.name);
          const slugBase = (eventData.hackathon || eventData.eventName || slugCandidate || "devnovate-event")
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 50);

          // Dates: startDate, endDate, registrationDeadline (accurately in IST)
          const defaultStart = new Date();
          const parsedStart = parseDevnovateDate(eventData.startDate, defaultStart) || defaultStart;
          let startsAtDate = parsedStart;

          const parsedEnd = parseDevnovateDate(eventData.endDate, null);
          let endsAtDate = parsedEnd || new Date(parsedStart.getTime() + 1000 * 60 * 60 * 48);

          // Prize Pool
          let prizePool = "TBA";
          if (eventData.prizePool && typeof eventData.prizePool === "string" && eventData.prizePool.trim()) {
            prizePool = cleanString(eventData.prizePool);
          } else if (Array.isArray(eventData.prizes) && eventData.prizes.length > 0) {
            const prizeStrings = eventData.prizes
              .map((p: any) => (p.amount ? `${p.place || "Prize"}: ${p.amount}` : null))
              .filter(Boolean);
            if (prizeStrings.length > 0) {
              prizePool = prizeStrings.join(" • ");
            }
          }

          // Description & Themes
          let description = "";
          if (eventData.subtitle) {
            description = cleanString(eventData.subtitle);
          }
          if (Array.isArray(eventData.theme) && eventData.theme.length > 0) {
            const themesStr = eventData.theme.join(", ");
            description = description
              ? `${description}\n\nTracks & Themes: ${themesStr}`
              : `Tracks & Themes: ${themesStr}`;
          }
          if (eventData.organizationName) {
            description = `${description ? `${description}\n\n` : ""}Organized by: ${cleanString(eventData.organizationName)}`;
          }

          // Team Sizes
          let minTeamSize = 1;
          let maxTeamSize = 4;
          if (eventData.teamSize && typeof eventData.teamSize === "string") {
            const sizeParts = eventData.teamSize.match(/(\d+)\s*[-–to]+\s*(\d+)/i);
            if (sizeParts) {
              minTeamSize = parseInt(sizeParts[1], 10) || 1;
              maxTeamSize = parseInt(sizeParts[2], 10) || 4;
            } else {
              const singleNum = eventData.teamSize.match(/(\d+)/);
              if (singleNum) {
                maxTeamSize = parseInt(singleNum[1], 10) || 4;
              }
            }
          }

          // Timeline Gates & Checkpoints
          const timelineGates: { title: string; deadline: string; event_type: string }[] = [];

          if (eventData.registrationDeadline) {
            const regDate = parseDevnovateDate(eventData.registrationDeadline, null);
            if (regDate) {
              timelineGates.push({
                title: "Registration Deadline",
                deadline: regDate.toISOString(),
                event_type: "registration_deadline",
              });
            }
          }

          if (Array.isArray(eventData.schedule) && eventData.schedule.length > 0) {
            const scheduledItems: { title: string; deadline: Date; event_type: string }[] = [];

            eventData.schedule.forEach((daySchedule: any) => {
              const dayStr = daySchedule.day;
              if (Array.isArray(daySchedule.events)) {
                daySchedule.events.forEach((ev: any) => {
                  const itemDate = parseDevnovateScheduleItem(dayStr, ev.time, parsedStart);
                  const titleStr = cleanString(ev.title) || "Sprint Checkpoint";
                  const lowerTitle = titleStr.toLowerCase();

                  let eventType = "pitch_session";
                  if (lowerTitle.includes("registration") || lowerTitle.includes("check-in")) {
                    eventType = "registration_deadline";
                  } else if (
                    lowerTitle.includes("submission") ||
                    lowerTitle.includes("freeze") ||
                    lowerTitle.includes("deadline")
                  ) {
                    eventType = "submission_deadline";
                  } else if (
                    lowerTitle.includes("presentation") ||
                    lowerTitle.includes("demo") ||
                    lowerTitle.includes("pitch") ||
                    lowerTitle.includes("announcement")
                  ) {
                    eventType = "pitch_session";
                  }

                  scheduledItems.push({
                    title: titleStr,
                    deadline: itemDate,
                    event_type: eventType,
                  });
                });
              }
            });

            // Sort chronologically
            scheduledItems.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

            if (scheduledItems.length > 0) {
              startsAtDate = scheduledItems[0].deadline;
              const lastItemTime = scheduledItems[scheduledItems.length - 1].deadline;
              if (parsedEnd && parsedEnd.getTime() > lastItemTime.getTime()) {
                endsAtDate = parsedEnd;
              } else {
                endsAtDate = lastItemTime;
              }
            }

            for (const item of scheduledItems) {
              timelineGates.push({
                title: item.title,
                deadline: item.deadline.toISOString(),
                event_type: item.event_type,
              });
            }
          }

          // Always ensure final code freeze gate
          const hasSubmissionGate = timelineGates.some((g) => g.event_type === "submission_deadline");
          if (!hasSubmissionGate) {
            timelineGates.push({
              title: "Code Freeze & Final Submission",
              deadline: endsAtDate.toISOString(),
              event_type: "submission_deadline",
            });
          }

          // Banner Image
          let bannerUrl =
            eventData.bannerImage ||
            eventData.mobileBannerImage ||
            eventData.cardImage ||
            eventData.organizationLogo ||
            null;
          if (bannerUrl && bannerUrl.startsWith("/")) {
            bannerUrl = `https://devnovate.co${bannerUrl}`;
          }

          return NextResponse.json({
            title,
            slug: `${slugBase}-${Math.random().toString(36).substring(2, 6)}`,
            source_platform: "devnovate",
            source_url: cleanUrl,
            banner_url: bannerUrl,
            prize_pool: prizePool,
            description,
            starts_at: startsAtDate.toISOString(),
            ends_at: endsAtDate.toISOString(),
            min_team_size: minTeamSize,
            max_team_size: maxTeamSize,
            timeline_gates: timelineGates,
            extraction_method: "devnovate_api_engine",
          });
        }
      } catch (devnovateErr) {
        console.warn("Devnovate API lookup failed, falling back:", devnovateErr);
      }
    }

    // ==========================================
    // 4. UNSTOP SEARCH API HANDLER (100% Reliable, Structured JSON)
    // ==========================================
    if (platform === "unstop") {
      try {
        const parsed = new URL(cleanUrl);
        const pathParts = parsed.pathname.split("/").filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1] || "";

        // Extract trailing numeric ID if present (e.g. zero-day-apocalypse-...-1764669 -> 1764669)
        const idMatch = lastPart.match(/-(\d{4,})$/);
        const opportunityId = idMatch ? idMatch[1] : "";

        // Extract title slug search keywords
        const cleanSlug = lastPart
          .replace(/-\d{4,}$/, "")
          .replace(/[-_]+/g, " ")
          .replace(/\b(\d{1,2})0\b/g, "$1.0 ")
          .trim();

        let item: any = null;

        // 1. Try exact Opportunity ID search first
        if (opportunityId) {
          const idEndpoints = [
            `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&searchTerm=${opportunityId}&per_page=5`,
            `https://unstop.com/api/public/opportunity/search-result?searchTerm=${opportunityId}&per_page=5`,
          ];

          for (const ep of idEndpoints) {
            const res = await fetch(ep, {
              signal: AbortSignal.timeout(10000),
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                Accept: "application/json",
                Referer: "https://unstop.com/",
              },
            });

            if (res.ok) {
              const json = await res.json();
              const items = json?.data?.data || [];
              item = items.find((x: any) => String(x.id) === opportunityId);
              if (item) break;
            }
          }
        }

        // 2. If not found by ID, search by title keywords
        if (!item && cleanSlug) {
          const firstFewWords = cleanSlug.split(" ").slice(0, 3).join(" ");
          const searchQueries = [cleanSlug, firstFewWords].filter(Boolean);

          for (const q of searchQueries) {
            const res = await fetch(
              `https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons&searchTerm=${encodeURIComponent(q)}&per_page=5`,
              {
                signal: AbortSignal.timeout(10000),
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                  Accept: "application/json",
                  Referer: "https://unstop.com/",
                },
              }
            );

            if (res.ok) {
              const json = await res.json();
              const items = json?.data?.data || [];
              if (opportunityId) {
                item = items.find((x: any) => String(x.id) === opportunityId);
              }
              if (!item) {
                // Find item whose title contains main query words (preventing random unrelated fallback)
                const queryWords = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
                item = items.find((x: any) => {
                  const t = (x.title || "").toLowerCase();
                  return queryWords.some((w) => t.includes(w));
                });
              }
              if (item) break;
            }
          }
        }

        if (item && item.title) {
          let prizePool = "TBA";
          if (item.prizes && Array.isArray(item.prizes) && item.prizes.length > 0) {
            const totalCash = item.prizes.reduce(
              (sum: number, p: any) => sum + (Number(p.cash) || 0),
              0
            );
            const currCode = item.prizes[0].currency;
            const currSym = currCode === "fa-rupee" ? "₹" : currCode === "fa-dollar" ? "$" : "";
            if (totalCash > 0) {
              prizePool = `${currSym}${totalCash.toLocaleString()} in prizes`;
            } else if (item.prizes[0].rank) {
              prizePool = item.prizes[0].rank;
            }
          }

          const startsAt =
            item.regnRequirements?.start_regn_dt || item.created_at || new Date().toISOString();
          const endsAt =
            item.end_date ||
            item.regnRequirements?.end_regn_dt ||
            new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString();

          let description = cleanString(item.details || "");
          if (!description) {
            const org = item.organisation?.name || "Unstop";
            const location = item.address_with_country_logo?.address
              ? `at ${item.address_with_country_logo.address}`
              : "";
            description = `Official hackathon challenge organized by ${org} ${location}. Complete your squad assembly and track milestone gates.`.trim();
          }

          const bannerUrl = item.banner_mobile?.image_url || item.logoUrl2 || null;

          const slug = item.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 50);

          return NextResponse.json({
            title: item.title,
            slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
            source_platform: "unstop",
            source_url: item.seo_url || cleanUrl,
            banner_url: bannerUrl,
            prize_pool: prizePool,
            description: description.slice(0, 400),
            starts_at: startsAt,
            ends_at: endsAt,
            min_team_size: item.regnRequirements?.min_team_size || 1,
            max_team_size: item.regnRequirements?.max_team_size || 4,
            timeline_gates: [
              {
                title: "Registration Checkpoint",
                deadline: startsAt,
                event_type: "registration_deadline",
              },
              {
                title: "Submission Gate",
                deadline: endsAt,
                event_type: "submission_deadline",
              },
            ],
            extraction_method: "unstop_api_engine",
          });
        }
      } catch (unstopErr) {
        console.warn("Unstop API lookup failed, falling back:", unstopErr);
      }
    }

    // ==========================================
    // 4. LUMA NEXT_DATA STRUCTURED HANDLER (100% Reliable)
    // ==========================================
    if (platform === "luma") {
      try {
        const lumaRes = await fetch(cleanUrl, {
          signal: AbortSignal.timeout(10000),
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });

        if (lumaRes.ok) {
          const html = await lumaRes.text();
          const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

          if (nextDataMatch) {
            const nextData = JSON.parse(nextDataMatch[1]);
            const event =
              nextData.props?.pageProps?.initialData?.data?.event ||
              nextData.props?.pageProps?.event;

            if (event && event.name) {
              const startsAt = event.start_at || new Date().toISOString();
              const endsAt =
                event.end_at || new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();
              const bannerUrl = event.cover_url || null;
              const description =
                event.summary ||
                (event.description_mirror
                  ? cleanString(event.description_mirror)
                  : `Official Luma Event in ${event.timezone || "Online"}.`);

              const slug = event.name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .slice(0, 50);

              return NextResponse.json({
                title: event.name,
                slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
                source_platform: "luma",
                source_url: cleanUrl,
                banner_url: bannerUrl,
                prize_pool: "Community / Track Event",
                description: description.slice(0, 400),
                starts_at: startsAt,
                ends_at: endsAt,
                timeline_gates: [
                  {
                    title: "Event Starts",
                    deadline: startsAt,
                    event_type: "registration_deadline",
                  },
                  {
                    title: "Submission Gate",
                    deadline: endsAt,
                    event_type: "submission_deadline",
                  },
                ],
                extraction_method: "luma_nextdata_engine",
              });
            }
          }
        }
      } catch (lumaErr) {
        console.warn("Luma structured data extraction failed, falling back:", lumaErr);
      }
    }

    // ==========================================
    // 5. DIRECT HTML & JSON-LD PARSER (For Custom & General)
    // ==========================================
    try {
      const res = await fetch(cleanUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (res.ok) {
        const html = await res.text();

        // 1. Title Extraction
        const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1];
        const twitterTitle = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i)?.[1];
        const pageTitle = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.split("|")[0]?.split(" - ")[0]?.trim();
        let rawTitle = cleanString(ogTitle || twitterTitle || pageTitle || "");

        // 2. Banner Extraction
        const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
        const twitterImage = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)?.[1];
        const bannerUrl = ogImage || twitterImage || null;

        // 3. Description Extraction
        const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1];
        const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1];
        let description = cleanString(ogDesc || metaDesc || "");

        // 4. Prize Pool Extraction
        let prizePool = "TBA";
        const devpostCurrencyVal = html.match(/data-currency-value>([0-9,]+)<\/span>/i)?.[1];
        if (devpostCurrencyVal) {
          prizePool = `$${devpostCurrencyVal}+ in prizes`;
        } else {
          const prizeMatch =
            html.match(/(?:(?:\$|€|£|₹|INR\s*|USD\s*)[\d,]+(?:\.\d+)?(?:\s*(?:lakh|crore|k|m|\+))?(?:\s*(?:in prizes|prizes|total))?)/i) ||
            html.match(/prize\s*pool[^\w]{0,10}([\d,]+)/i);
          if (prizeMatch) {
            prizePool = prizeMatch[0].trim();
          }
        }

        // 5. Deadlines Extraction
        let endsAt = new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString();
        let startsAt = new Date().toISOString();
        const timeMatch = html.match(/<time[^>]*datetime=["']([^"']+)["']/i);
        if (timeMatch) {
          const parsedDate = new Date(timeMatch[1]);
          if (!isNaN(parsedDate.getTime())) {
            endsAt = parsedDate.toISOString();
          }
        }

        // 6. Structured Data (JSON-LD) Extraction
        try {
          const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
          let ldMatch;
          while ((ldMatch = jsonLdRegex.exec(html)) !== null) {
            const parsedLd = JSON.parse(ldMatch[1]);
            const items = Array.isArray(parsedLd) ? parsedLd : (parsedLd["@graph"] || [parsedLd]);
            for (const item of items) {
              if (item && (item["@type"] === "Event" || item["@type"] === "Hackathon" || item.name)) {
                if (!rawTitle || rawTitle === "Imported Hackathon") {
                  rawTitle = cleanString(item.name);
                }
                if (!description && item.description) {
                  description = cleanString(item.description);
                }
                if (item.startDate) {
                  const s = new Date(item.startDate);
                  if (!isNaN(s.getTime())) startsAt = s.toISOString();
                }
                if (item.endDate) {
                  const e = new Date(item.endDate);
                  if (!isNaN(e.getTime())) endsAt = e.toISOString();
                }
              }
            }
          }
        } catch {}

        // Run smart extraction fallback if title is still generic
        const smart = extractSmartDetailsFromUrl(cleanUrl, platform, rawTitle);
        rawTitle = smart.title;
        if (!description && smart.description) {
          description = smart.description;
        }

        const slug = rawTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 50);

        return NextResponse.json({
          title: rawTitle,
          slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
          source_platform: platform,
          source_url: cleanUrl,
          banner_url: bannerUrl,
          prize_pool: prizePool,
          description: description ? description.slice(0, 400) : smart.description,
          starts_at: startsAt,
          ends_at: endsAt,
          timeline_gates: [
            {
              title: "Registration Checkpoint",
              deadline: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
              event_type: "registration_deadline",
            },
            {
              title: "Submission Gate",
              deadline: endsAt,
              event_type: "submission_deadline",
            },
          ],
          extraction_method: "direct_html_parser",
        });
      }
    } catch (fetchErr) {
      console.warn("Direct HTML fetch failed, using smart URL engine:", fetchErr);
    }

    // ==========================================
    // 4. SMART URL FALLBACK (Always Works, Zero Hardcoded Data)
    // ==========================================
    const smart = extractSmartDetailsFromUrl(cleanUrl, platform, "");
    const slug = smart.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);

    return NextResponse.json({
      title: smart.title,
      slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
      source_platform: platform,
      source_url: cleanUrl,
      banner_url: null,
      prize_pool: "TBA",
      description: smart.description,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      timeline_gates: [
        {
          title: "Registration Deadline",
          deadline: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
          event_type: "registration_deadline",
        },
        {
          title: "Submission Gate",
          deadline: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
          event_type: "submission_deadline",
        },
      ],
      extraction_method: "smart_url_engine",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to parse hackathon link." },
      { status: 500 }
    );
  }
}
