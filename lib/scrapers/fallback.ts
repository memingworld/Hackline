import type { ScrapedHackathonResult, SupportedPlatform } from "./types.ts";
import { cleanString, extractSmartDetailsFromUrl, makeSlug } from "./base.ts";
import { isValidPublicHttpUrl } from "../security.ts";

export async function scrapeFallback(
  cleanUrl: string,
  platform: SupportedPlatform = "custom"
): Promise<ScrapedHackathonResult> {
  // 1. Try Direct HTML & JSON-LD extraction
  try {
    let currentUrl = cleanUrl;
    let res: Response | null = null;
    let redirectHops = 0;
    const MAX_HOPS = 3;

    while (redirectHops <= MAX_HOPS) {
      if (!isValidPublicHttpUrl(currentUrl)) {
        throw new Error("Target redirected to prohibited address.");
      }

      res = await fetch(currentUrl, {
        signal: AbortSignal.timeout(8000),
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        const resolved = new URL(location, currentUrl).toString();
        currentUrl = resolved;
        redirectHops++;
      } else {
        break;
      }
    }

    if (res && res.ok) {
      // Read up to 2MB to prevent memory exhaustion
      let html = "";
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let bytesRead = 0;
        const MAX_BYTES = 2 * 1024 * 1024;
        while (bytesRead < MAX_BYTES) {
          const { done, value } = await reader.read();
          if (done) break;
          bytesRead += value.length;
          html += decoder.decode(value, { stream: true });
        }
        reader.cancel();
      } else {
        html = await res.text();
      }

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

      const slug = makeSlug(rawTitle);

      return {
        title: rawTitle,
        slug,
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
      };
    }
  } catch (fetchErr) {
    console.warn("Direct HTML fetch failed, using smart URL engine:", fetchErr);
  }

  // 2. Smart URL Fallback (Always Works, Zero Hardcoded Data)
  const smart = extractSmartDetailsFromUrl(cleanUrl, platform, "");
  const slug = makeSlug(smart.title);

  return {
    title: smart.title,
    slug,
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
  };
}
