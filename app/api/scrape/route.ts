import { NextResponse } from "next/server";

function extractSmartDetailsFromUrl(
  url: string,
  platform: string,
  currentTitle: string
): { title: string; description: string } {
  const trimmed = (currentTitle || "").trim();
  const lower = trimmed.toLowerCase();
  const isGeneric =
    !trimmed ||
    trimmed === "Imported Hackathon" ||
    ["unstop", "devfolio", "devpost", "luma", "hack2skill", "home", "competitions", "hackathons", "untitled"].includes(lower) ||
    lower.includes("competitions, quizzes") ||
    lower.includes("403 forbidden") ||
    lower.includes("just a moment");

  if (!isGeneric) {
    return { title: trimmed, description: "" };
  }

  try {
    const parsed = new URL(url);

    // 1. Check query parameters like utm_source, utm_campaign, challenge
    const utmSource = parsed.searchParams.get("utm_source") || "";
    const utmCampaign = parsed.searchParams.get("utm_campaign") || "";
    const candidate = utmSource || utmCampaign;

    if (candidate && !["logged_out_user", "share", "referral"].includes(candidate.toLowerCase())) {
      const formatted = candidate
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        title: `${formatted} (${platform.toUpperCase()})`,
        description: `Auto-extracted ${formatted} on ${platform}. Review your sprint gates and team capacity below.`,
      };
    }

    // 2. Check path segments (e.g. /hackathons/flipkart-grid or /o/2qr951x)
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];

    if (lastPart && !["hackathons", "competitions", "events", "o"].includes(lastPart.toLowerCase())) {
      if (lastPart.includes("-")) {
        const formatted = lastPart
          .replace(/-+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return {
          title: formatted,
          description: `Extracted ${formatted} challenge on ${platform}.`,
        };
      } else if (lastPart.length >= 4) {
        return {
          title: `${platform.toUpperCase()} Sprint #${lastPart.toUpperCase()}`,
          description: `Live event from ${platform} (Ref: ${lastPart}). Review submission deadlines below.`,
        };
      }
    }
  } catch {
    // URL parsing failed; fallback
  }

  return {
    title: `${platform.toUpperCase()} Hackathon Challenge`,
    description: `Extracted from ${platform}. Review tracks and timeline gates below.`,
  };
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid hackathon URL is required." },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    const scraperServiceUrl =
      process.env.SCRAPER_SERVICE_URL || "http://127.0.0.1:8000";

    // Detect Platform
    let platform = "custom";
    if (cleanUrl.includes("devfolio.co")) platform = "devfolio";
    else if (cleanUrl.includes("unstop.com")) platform = "unstop";
    else if (cleanUrl.includes("devpost.com")) platform = "devpost";
    else if (cleanUrl.includes("lu.ma")) platform = "luma";
    else if (cleanUrl.includes("hack2skill.com")) platform = "hack2skill";
    else if (cleanUrl.includes("hackculture.com")) platform = "hackculture";
    else if (cleanUrl.includes("hackbriven.com")) platform = "hackbriven";

    // 1. Attempt to call FastAPI microservice
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const serviceRes = await fetch(`${scraperServiceUrl}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (serviceRes.ok) {
        const data = await serviceRes.json();
        const smart = extractSmartDetailsFromUrl(cleanUrl, data.source_platform || platform, data.title);
        if (smart.title && smart.title !== data.title) {
          data.title = smart.title;
          if (!data.description || data.description.length < 25) {
            data.description = smart.description;
          }
        }
        return NextResponse.json(data);
      }
    } catch {
      // Microservice not reached; gracefully continue to direct Next.js HTML extractor
    }

    // 2. Direct server-side HTML extraction fallback
    const res = await fetch(cleanUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      // Even if the page returns 403 or Cloudflare protection, resolve with smart URL parameters
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
        starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
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
    }

    const html = await res.text();

    // Extract OpenGraph tags
    const titleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<title>([^<]+)<\/title>/i);
    let rawTitle = titleMatch ? titleMatch[1].split("|")[0].split("-")[0].trim() : "";

    const bannerMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    const bannerUrl = bannerMatch ? bannerMatch[1] : null;

    const descMatch =
      html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    let description = descMatch ? descMatch[1].trim() : "";

    // Prize Pool Regex Search
    const prizeMatch =
      html.match(/(?:(?:\$|₹|INR\s*|USD\s*)[\d,]+(?:\.\d+)?(?:\s*(?:lakh|crore|k|m))?)/i) ||
      html.match(/prize\s*pool[^\w]{0,10}([\d,]+)/i);
    const prizePool = prizeMatch ? prizeMatch[0] : "TBA";

    // Run smart extraction if title is generic
    const smart = extractSmartDetailsFromUrl(cleanUrl, platform, rawTitle);
    rawTitle = smart.title;
    if ((!description || description.includes("competitions & engagements")) && smart.description) {
      description = smart.description;
    }

    const slug = rawTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);

    const extractedData = {
      title: rawTitle,
      slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
      source_platform: platform,
      source_url: cleanUrl,
      banner_url: bannerUrl,
      prize_pool: prizePool,
      description: description ? description.slice(0, 400) : smart.description,
      starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24h from now default
      ends_at: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),   // 72h window
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
      extraction_method: "direct_html_parser",
    };

    return NextResponse.json(extractedData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to parse hackathon link." },
      { status: 500 }
    );
  }
}
