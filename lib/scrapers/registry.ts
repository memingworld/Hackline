import type { PlatformScraper, ScrapedHackathonResult, SupportedPlatform } from "./types.ts";
import { devnovateScraper } from "./platforms/devnovate.ts";
import { devfolioScraper } from "./platforms/devfolio.ts";
import { devpostScraper } from "./platforms/devpost.ts";
import { unstopScraper } from "./platforms/unstop.ts";
import { lumaScraper } from "./platforms/luma.ts";
import { hack2skillScraper } from "./platforms/hack2skill.ts";
import { scrapeFallback } from "./fallback.ts";

export const SCRAPER_REGISTRY: PlatformScraper[] = [
  devnovateScraper,
  devfolioScraper,
  devpostScraper,
  unstopScraper,
  lumaScraper,
  hack2skillScraper,
];

export function detectPlatform(url: string, cleanUrl: string): SupportedPlatform {
  for (const scraper of SCRAPER_REGISTRY) {
    if (scraper.matches(url, cleanUrl)) {
      return scraper.platform;
    }
  }
  return "custom";
}

export async function scrapeHackathon(cleanUrl: string): Promise<ScrapedHackathonResult> {
  const platform = detectPlatform(cleanUrl, cleanUrl);

  for (const scraper of SCRAPER_REGISTRY) {
    if (scraper.matches(cleanUrl, cleanUrl)) {
      try {
        const result = await scraper.scrape(cleanUrl);
        if (result) {
          return result;
        }
      } catch (err) {
        console.warn(`[Scraper Registry] ${scraper.name} scraper failed, falling back:`, err);
      }
      break;
    }
  }

  // Fallback engine
  return scrapeFallback(cleanUrl, platform);
}
