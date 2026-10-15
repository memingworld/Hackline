import { test } from "node:test";
import assert from "node:assert/strict";
import { detectPlatform, SCRAPER_REGISTRY } from "../lib/scrapers/registry.ts";
import { devnovateScraper } from "../lib/scrapers/platforms/devnovate.ts";
import { devfolioScraper } from "../lib/scrapers/platforms/devfolio.ts";
import { devpostScraper } from "../lib/scrapers/platforms/devpost.ts";
import { unstopScraper } from "../lib/scrapers/platforms/unstop.ts";
import { lumaScraper } from "../lib/scrapers/platforms/luma.ts";
import { hack2skillScraper } from "../lib/scrapers/platforms/hack2skill.ts";

test("Scraper Registry: detects all supported platforms correctly", () => {
  assert.equal(detectPlatform("https://devnovate.co/event/colossal-a-pitch", "https://devnovate.co/event/colossal-a-pitch"), "devnovate");
  assert.equal(detectPlatform("https://ethindia.devfolio.co", "https://ethindia.devfolio.co"), "devfolio");
  assert.equal(detectPlatform("https://nebius.devpost.com", "https://nebius.devpost.com"), "devpost");
  assert.equal(detectPlatform("https://unstop.com/hackathons/test-123", "https://unstop.com/hackathons/test-123"), "unstop");
  assert.equal(detectPlatform("https://lu.ma/hackathon-2026", "https://lu.ma/hackathon-2026"), "luma");
  assert.equal(detectPlatform("https://hack2skill.com/hack/123", "https://hack2skill.com/hack/123"), "hack2skill");
  assert.equal(detectPlatform("https://acme.org/hackathon", "https://acme.org/hackathon"), "custom");
});

test("Scraper Registry: registry contains all 6 discrete platform scrapers", () => {
  assert.equal(SCRAPER_REGISTRY.length, 6);
  const platforms = SCRAPER_REGISTRY.map((s) => s.platform);
  assert.deepEqual(platforms, ["devnovate", "devfolio", "devpost", "unstop", "luma", "hack2skill"]);
});

test("Devnovate Scraper Module: extracts live Colossal-A-Pitch in isolation", async () => {
  const result = await devnovateScraper.scrape("https://devnovate.co/event/colossal-a-pitch");
  assert.ok(result, "Should return a ScrapedHackathonResult");
  assert.equal(result.title, "Colossal-A-Pitch");
  assert.equal(result.source_platform, "devnovate");
  assert.equal(result.extraction_method, "devnovate_api_engine");
  assert.ok(result.timeline_gates.length >= 5, "Should have parsed schedule gates");
  
  // Verify start date matches Oct 27, 2026
  assert.ok(result.starts_at.includes("2026-10-27"));
  assert.ok(result.ends_at.includes("2026-10-27"));
});
