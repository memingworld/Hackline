import type { PlatformScraper, ScrapedHackathonResult } from "../types.ts";
import { cleanString, makeSlug } from "../base.ts";

export const devpostScraper: PlatformScraper = {
  name: "Devpost",
  platform: "devpost",

  matches(url: string, cleanUrl: string): boolean {
    return cleanUrl.includes("devpost.com");
  },

  async scrape(cleanUrl: string): Promise<ScrapedHackathonResult | null> {
    try {
      const parsed = new URL(cleanUrl);
      const sub = parsed.hostname.split(".")[0];
      const rawCandidate =
        sub && sub !== "devpost" && sub !== "www"
          ? sub
          : parsed.pathname.split("/").filter(Boolean)[0] || "";

      if (!rawCandidate) {
        return null;
      }

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
        const matchingHackathon =
          apiData.hackathons.find(
            (h: any) =>
              h.url?.toLowerCase().includes(sub.toLowerCase()) ||
              h.title?.toLowerCase().includes(spaceSeparated.toLowerCase())
          ) || apiData.hackathons[0];

        if (matchingHackathon) {
          const rawPrize = cleanString(matchingHackathon.prize_amount);
          const prize = rawPrize
            ? rawPrize.startsWith("$")
              ? `${rawPrize} in prizes`
              : rawPrize
            : "TBA";

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

          const slug = makeSlug(matchingHackathon.title);

          return {
            title: matchingHackathon.title,
            slug,
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
          };
        }
      }

      return null;
    } catch (devpostErr) {
      console.warn("Devpost API lookup failed, falling back:", devpostErr);
      return null;
    }
  },
};
