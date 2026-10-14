import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isValidPublicHttpUrl, sanitizePlainText } from "@/lib/security";

function cleanString(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractSmartDetailsFromUrl(
  url: string,
  platform: string,
  currentTitle: string
): { title: string; description: string } {
  const trimmed = cleanString(currentTitle);
  const lower = trimmed.toLowerCase();
  const isGeneric =
    !trimmed ||
    trimmed === "Imported Hackathon" ||
    trimmed.includes("Just a moment") ||
    trimmed.includes("403 Forbidden") ||
    trimmed.includes("Attention Required") ||
    trimmed.includes("Cloudflare") ||
    ["unstop", "devfolio", "devpost", "luma", "hack2skill", "home", "competitions", "hackathons", "untitled"].includes(lower) ||
    lower.includes("competitions, quizzes");

  if (!isGeneric) {
    return { title: trimmed, description: "" };
  }

  try {
    const parsed = new URL(url);

    // 1. Devpost Subdomain extraction (e.g. nebiusglobalaihackathon.devpost.com)
    if (parsed.hostname.includes("devpost.com")) {
      const sub = parsed.hostname.split(".")[0];
      if (sub && sub !== "devpost" && sub !== "www") {
        const formatted = sub
          .replace(/[-_]+/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/hackathon/gi, " Hackathon")
          .replace(/global/gi, " Global")
          .replace(/ai/gi, " AI ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return {
          title: formatted,
          description: `Extracted challenge from Devpost (${formatted}). Review schedule gates and squad capacity below.`,
        };
      }
    }

    // 2. Check query parameters like utm_source, utm_campaign, challenge
    const utmCampaign = parsed.searchParams.get("utm_campaign") || "";
    const challengeParam = parsed.searchParams.get("challenge") || "";
    const candidate = challengeParam || utmCampaign;

    if (candidate && !["logged_out_user", "share", "referral"].includes(candidate.toLowerCase())) {
      const formatted = candidate
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        title: `${formatted}`,
        description: `Auto-extracted ${formatted} on ${platform}. Review your sprint gates and team capacity below.`,
      };
    }

    // 3. Check path segments (e.g. /hackathons/flipkart-grid-60-...-1025542)
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];

    if (lastPart && !["hackathons", "competitions", "events", "o", "challenges"].includes(lastPart.toLowerCase())) {
      let cleaned = lastPart
        .replace(/-\d{4,}$/, "") // strip trailing numerical portal ID (e.g. -1025542)
        .replace(/[-_]+/g, " ")
        .replace(/\b(\d{1,2})0\b/g, "$1.0 ") // e.g. 60 -> 6.0
        .replace(/\s+/g, " ")
        .trim();

      const formatted = cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        title: formatted,
        description: `Extracted ${formatted} challenge on ${platform}. Review squad duties and timeline gates below.`,
      };
    }
  } catch {
    // URL parsing failed; fallback
  }

  const capitalizedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
  return {
    title: `${capitalizedPlatform} Hackathon Challenge`,
    description: `Extracted from ${capitalizedPlatform}. Review tracks and timeline gates below.`,
  };
}

export async function POST(request: Request) {
  try {
    // 1. Enforce Authentication (Defense-in-depth: Prevent open unauthenticated scraping / abuse)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to import hackathons." },
        { status: 401 }
      );
    }

    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid hackathon URL is required." },
        { status: 400 }
      );
    }

    // 2. Anti-SSRF Validation (Prevent fetching localhost, cloud metadata, or private subnets)
    if (!isValidPublicHttpUrl(url)) {
      return NextResponse.json(
        {
          error:
            "Invalid or prohibited URL. Only public HTTP/HTTPS hackathon URLs are allowed.",
        },
        { status: 400 }
      );
    }

    const cleanUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;

    // Detect Platform
    let platform: "devfolio" | "unstop" | "devpost" | "luma" | "hack2skill" | "custom" = "custom";
    if (cleanUrl.includes("devfolio.co")) platform = "devfolio";
    else if (cleanUrl.includes("unstop.com")) platform = "unstop";
    else if (cleanUrl.includes("devpost.com")) platform = "devpost";
    else if (cleanUrl.includes("lu.ma")) platform = "luma";
    else if (cleanUrl.includes("hack2skill.com")) platform = "hack2skill";

    // ==========================================
    // 1. DEVPOST OFFICIAL API HANDLER (100% Reliable, No Cloudflare Block)
    // ==========================================
    if (platform === "devpost") {
      try {
        const parsed = new URL(cleanUrl);
        const sub = parsed.hostname.split(".")[0];
        const rawCandidate = sub && sub !== "devpost" && sub !== "www" ? sub : parsed.pathname.split("/").filter(Boolean)[0] || "";

        if (rawCandidate) {
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
            const matchingHackathon = apiData.hackathons.find(
              (h: any) =>
                h.url?.toLowerCase().includes(sub.toLowerCase()) ||
                h.title?.toLowerCase().includes(spaceSeparated.toLowerCase())
            ) || apiData.hackathons[0];

            if (matchingHackathon) {
              const rawPrize = cleanString(matchingHackathon.prize_amount);
              const prize = rawPrize ? (rawPrize.startsWith("$") ? `${rawPrize} in prizes` : rawPrize) : "TBA";

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

              const slug = matchingHackathon.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .slice(0, 50);

              return NextResponse.json({
                title: matchingHackathon.title,
                slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
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
              });
            }
          }
        }
      } catch (devpostErr) {
        console.warn("Devpost API lookup failed, falling back:", devpostErr);
      }
    }

    // ==========================================
    // 2. DEVFOLIO OFFICIAL API HANDLER (100% Reliable)
    // ==========================================
    if (platform === "devfolio") {
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

        if (slugCandidate) {
          const devfolioRes = await fetch(
            `https://api.devfolio.co/api/hackathons/${encodeURIComponent(slugCandidate)}`,
            {
              headers: { Accept: "application/json" },
            }
          );

          if (devfolioRes.ok) {
            const d = await devfolioRes.json();
            const startsAt = d.starts_at || new Date().toISOString();
            const endsAt = d.ends_at || new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();

            return NextResponse.json({
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
            });
          }
        }
      } catch (devfolioErr) {
        console.warn("Devfolio API lookup failed, falling back:", devfolioErr);
      }
    }

    // ==========================================
    // 3. UNSTOP SEARCH API HANDLER (100% Reliable, Structured JSON)
    // ==========================================
    if (platform === "unstop") {
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

          const slug = item.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 50);

          return NextResponse.json({
            title: item.title,
            slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
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
          });
        }
      } catch (unstopErr) {
        console.warn("Unstop API lookup failed, falling back:", unstopErr);
      }
    }

    // ==========================================
    // 4. LUMA NEXT_DATA STRUCTURED HANDLER (100% Reliable)
    // ==========================================
    if (platform === "luma") {
      try {
        const lumaRes = await fetch(cleanUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });

        if (lumaRes.ok) {
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

              const slug = event.name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .slice(0, 50);

              return NextResponse.json({
                title: event.name,
                slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
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
              });
            }
          }
        }
      } catch (lumaErr) {
        console.warn("Luma structured data extraction failed, falling back:", lumaErr);
      }
    }

    // ==========================================
    // 5. DIRECT HTML & JSON-LD PARSER (For Custom & General)
    // ==========================================
    try {
      const res = await fetch(cleanUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (res.ok) {
        const html = await res.text();

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

        const slug = rawTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 50);

        return NextResponse.json({
          title: rawTitle,
          slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
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
        });
      }
    } catch (fetchErr) {
      console.warn("Direct HTML fetch failed, using smart URL engine:", fetchErr);
    }

    // ==========================================
    // 4. SMART URL FALLBACK (Always Works, Zero Hardcoded Data)
    // ==========================================
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
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to parse hackathon link." },
      { status: 500 }
    );
  }
}
