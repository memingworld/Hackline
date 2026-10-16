"use server";

import { createClient } from "@/utils/supabase/server";
import { isValidPublicHttpUrl } from "@/lib/security";

export interface LinkAuditResult {
  url: string;
  type: "repo" | "demo" | "deck" | "live";
  status: "valid" | "warning" | "error" | "untested";
  message: string;
}

/**
 * Audit deliverable URLs to prevent common submission mistakes (such as restricted decks or invalid links).
 */
export async function auditSubmissionLinks(links: {
  repoUrl?: string;
  demoVideoUrl?: string;
  deckUrl?: string;
  liveAppUrl?: string;
}): Promise<LinkAuditResult[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [
      {
        url: "",
        type: "repo",
        status: "error",
        message: "Authentication required to audit submission links.",
      },
    ];
  }

  const results: LinkAuditResult[] = [];

  // 1. Audit Slide Deck URL
  if (links.deckUrl?.trim()) {
    const deck = links.deckUrl.trim();
    if (!isValidPublicHttpUrl(deck)) {
      results.push({
        url: deck,
        type: "deck",
        status: "error",
        message: "Invalid or prohibited destination. Only public web pitch decks are permitted.",
      });
    } else if (deck.includes("docs.google.com") && deck.includes("/edit")) {
      results.push({
        url: deck,
        type: "deck",
        status: "warning",
        message: "Deck link has '/edit' in URL. Ensure sharing is set to 'Anyone with link can view'.",
      });
    } else {
      results.push({
        url: deck,
        type: "deck",
        status: "valid",
        message: "Pitch deck link formatted correctly.",
      });
    }
  }

  // 2. Audit GitHub Repository URL
  if (links.repoUrl?.trim()) {
    const repo = links.repoUrl.trim();
    if (!isValidPublicHttpUrl(repo)) {
      results.push({
        url: repo,
        type: "repo",
        status: "error",
        message: "Invalid or prohibited destination. Only public web repositories are permitted.",
      });
    } else {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(repo, {
          method: "HEAD",
          headers: { "User-Agent": "HackLine-Auditor/1.0" },
          signal: controller.signal,
          redirect: "manual",
        });
        clearTimeout(timeout);

        if (res.status === 404) {
          results.push({
            url: repo,
            type: "repo",
            status: "warning",
            message: "Repository returned 404. Ensure repo is set to Public before deadline.",
          });
        } else if (res.status >= 300 && res.status < 400) {
          results.push({
            url: repo,
            type: "repo",
            status: "valid",
            message: "Public repository responded with redirection.",
          });
        } else if (res.ok) {
          results.push({
            url: repo,
            type: "repo",
            status: "valid",
            message: "Public repository reachable.",
          });
        } else {
          results.push({
            url: repo,
            type: "repo",
            status: "valid",
            message: `Repository reachable (HTTP ${res.status}).`,
          });
        }
      } catch {
        results.push({
          url: repo,
          type: "repo",
          status: "valid",
          message: "Repository URL formatted (could not ping directly).",
        });
      }
    }
  }

  // 3. Audit Demo Video URL
  if (links.demoVideoUrl?.trim()) {
    const video = links.demoVideoUrl.trim();
    if (!isValidPublicHttpUrl(video)) {
      results.push({
        url: video,
        type: "demo",
        status: "error",
        message: "Invalid or prohibited destination. Only public streaming URLs are permitted.",
      });
    } else if (video.includes("loom.com") || video.includes("youtube.com") || video.includes("youtu.be")) {
      results.push({
        url: video,
        type: "demo",
        status: "valid",
        message: "Valid video streaming provider detected.",
      });
    } else {
      results.push({
        url: video,
        type: "demo",
        status: "valid",
        message: "Demo video link formatted.",
      });
    }
  }

  // 4. Audit Live Web App / Deployed URL
  if (links.liveAppUrl?.trim()) {
    const live = links.liveAppUrl.trim();
    if (!isValidPublicHttpUrl(live)) {
      results.push({
        url: live,
        type: "live",
        status: "error",
        message: "Invalid or prohibited destination. Only public web addresses are permitted.",
      });
    } else {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(live, {
          method: "HEAD",
          headers: { "User-Agent": "HackLine-Auditor/1.0" },
          signal: controller.signal,
          redirect: "manual",
        });
        clearTimeout(timeout);

        if (res.status >= 500) {
          results.push({
            url: live,
            type: "live",
            status: "warning",
            message: `Deployed web app returned server error (HTTP ${res.status}). Check deployment logs.`,
          });
        } else {
          results.push({
            url: live,
            type: "live",
            status: "valid",
            message: "Live deployment endpoint responded.",
          });
        }
      } catch {
        results.push({
          url: live,
          type: "live",
          status: "valid",
          message: "Live deployment link formatted.",
        });
      }
    }
  }

  return results;
}
