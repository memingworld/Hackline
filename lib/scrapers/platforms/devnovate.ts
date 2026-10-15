import type { PlatformScraper, ScrapedHackathonResult } from "../types.ts";
import {
  cleanString,
  parseDevnovateDate,
  parseDevnovateScheduleItem,
} from "../base.ts";

export const devnovateScraper: PlatformScraper = {
  name: "Devnovate",
  platform: "devnovate",

  matches(url: string, cleanUrl: string): boolean {
    return cleanUrl.includes("devnovate.co");
  },

  async scrape(cleanUrl: string): Promise<ScrapedHackathonResult | null> {
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
        if (
          pathParts[0] === "hackathons" ||
          pathParts[0] === "events" ||
          pathParts[0] === "event" ||
          pathParts[0] === "e"
        ) {
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

      if (!eventData || !eventData.name) {
        return null;
      }

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

      return {
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
      };
    } catch (devnovateErr) {
      console.warn("Devnovate API lookup failed, falling back:", devnovateErr);
      return null;
    }
  },
};
