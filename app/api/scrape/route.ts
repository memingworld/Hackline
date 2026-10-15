import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isValidPublicHttpUrl } from "@/lib/security";
import { scrapeHackathon } from "@/lib/scrapers/registry";

export async function POST(request: Request) {
  try {
    // 1. Enforce Authentication (Defense-in-depth: Prevent open unauthenticated scraping / abuse)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 2. Validate Request Body
    const body = await request.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid hackathon URL is required." },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim();

    // 3. Strict SSRF & Protocol Validation (Blocks RFC-1918, Cloud Metadata, Loopbacks)
    if (!isValidPublicHttpUrl(cleanUrl)) {
      return NextResponse.json(
        { error: "Invalid target URL. Only public HTTP/HTTPS URLs are accepted." },
        { status: 400 }
      );
    }

    // 4. Delegate to Modular Scraper Registry
    const result = await scrapeHackathon(cleanUrl);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to parse hackathon link." },
      { status: 500 }
    );
  }
}
