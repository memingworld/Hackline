import { NextResponse } from "next/server";

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
        Accept: "text/html,application/xhtml+xml,application/xml",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Target page returned status ${res.status}. Please check the link.` },
        { status: 400 }
      );
    }

    const html = await res.text();

    // Extract OpenGraph tags
    const titleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<title>([^<]+)<\/title>/i);
    const rawTitle = titleMatch ? titleMatch[1].split("|")[0].split("-")[0].trim() : "Imported Hackathon";

    const bannerMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    const bannerUrl = bannerMatch ? bannerMatch[1] : null;

    const descMatch =
      html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : "Extracted via Hackline Magic Scraper.";

    // Prize Pool Regex Search
    const prizeMatch =
      html.match(/(?:\$|₹|INR\s*|USD\s*)[\d,]+(?:\.\d+)?/i) ||
      html.match(/prize\s*pool[^\w]{0,10}([\d,]+)/i);
    const prizePool = prizeMatch ? prizeMatch[0] : "TBA";

    // Detect Platform
    let platform = "custom";
    if (cleanUrl.includes("devfolio.co")) platform = "devfolio";
    else if (cleanUrl.includes("unstop.com")) platform = "unstop";
    else if (cleanUrl.includes("devpost.com")) platform = "devpost";
    else if (cleanUrl.includes("lu.ma")) platform = "luma";
    else if (cleanUrl.includes("hack2skill.com")) platform = "hack2skill";
    else if (cleanUrl.includes("hackculture.com")) platform = "hackculture";
    else if (cleanUrl.includes("hackbriven.com")) platform = "hackbriven";

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
      description: description.slice(0, 400),
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
