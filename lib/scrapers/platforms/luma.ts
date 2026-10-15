import type { PlatformScraper, ScrapedHackathonResult } from "../types.ts";
import { cleanString, makeSlug } from "../base.ts";

export const lumaScraper: PlatformScraper = {
  name: "Luma",
  platform: "luma",

  matches(url: string, cleanUrl: string): boolean {
    return cleanUrl.includes("lu.ma");
  },

  async scrape(cleanUrl: string): Promise<ScrapedHackathonResult | null> {
    try {
      const lumaRes = await fetch(cleanUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!lumaRes.ok) {
        return null;
      }

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

          const slug = makeSlug(event.name);

          return {
            title: event.name,
            slug,
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
          };
        }
      }

      return null;
    } catch (lumaErr) {
      console.warn("Luma structured data extraction failed, falling back:", lumaErr);
      return null;
    }
  },
};
