import type { PlatformScraper, ScrapedHackathonResult } from "../types.ts";
import { cleanString, makeSlug } from "../base.ts";

export const unstopScraper: PlatformScraper = {
  name: "Unstop",
  platform: "unstop",

  matches(url: string, cleanUrl: string): boolean {
    return cleanUrl.includes("unstop.com");
  },

  async scrape(cleanUrl: string): Promise<ScrapedHackathonResult | null> {
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
        const slug = makeSlug(item.title);

        return {
          title: item.title,
          slug,
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
        };
      }

      return null;
    } catch (unstopErr) {
      console.warn("Unstop API lookup failed, falling back:", unstopErr);
      return null;
    }
  },
};
