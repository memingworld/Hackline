import type { PlatformScraper, ScrapedHackathonResult } from "../types.ts";

export const devfolioScraper: PlatformScraper = {
  name: "Devfolio",
  platform: "devfolio",

  matches(url: string, cleanUrl: string): boolean {
    return cleanUrl.includes("devfolio.co");
  },

  async scrape(cleanUrl: string): Promise<ScrapedHackathonResult | null> {
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

      if (!slugCandidate) {
        return null;
      }

      const devfolioRes = await fetch(
        `https://api.devfolio.co/api/hackathons/${encodeURIComponent(slugCandidate)}`,
        {
          signal: AbortSignal.timeout(10000),
          headers: { Accept: "application/json" },
        }
      );

      if (!devfolioRes.ok) {
        return null;
      }

      const d = await devfolioRes.json();
      const startsAt = d.starts_at || new Date().toISOString();
      const endsAt = d.ends_at || new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();

      return {
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
      };
    } catch (devfolioErr) {
      console.warn("Devfolio API lookup failed, falling back:", devfolioErr);
      return null;
    }
  },
};
