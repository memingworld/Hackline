"use server";

export interface LinkAuditResult {
  url: string;
  type: "repo" | "demo" | "deck" | "live";
  status: "valid" | "warning" | "error" | "untested";
  message: string;
}

/**
 * Audit deliverable URLs to prevent common submission disasters (e.g. private repos, restricted Google Slides).
 */
export async function auditSubmissionLinks(links: {
  repoUrl?: string;
  demoVideoUrl?: string;
  deckUrl?: string;
  liveAppUrl?: string;
}): Promise<LinkAuditResult[]> {
  const results: LinkAuditResult[] = [];

  // 1. Audit Slide Deck URL
  if (links.deckUrl?.trim()) {
    const deck = links.deckUrl.trim();
    if (deck.includes("docs.google.com") && deck.includes("/edit")) {
      results.push({
        url: deck,
        type: "deck",
        status: "warning",
        message: "Deck link has '/edit' in URL. Ensure sharing is set to 'Anyone with link can view'.",
      });
    } else if (!deck.startsWith("http://") && !deck.startsWith("https://")) {
      results.push({
        url: deck,
        type: "deck",
        status: "error",
        message: "Invalid URL format (missing https://).",
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
    if (!repo.startsWith("http://") && !repo.startsWith("https://")) {
      results.push({
        url: repo,
        type: "repo",
        status: "error",
        message: "Invalid URL format (missing https://).",
      });
    } else {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(repo, {
          method: "HEAD",
          headers: { "User-Agent": "HackLine-Auditor/1.0" },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.status === 404) {
          results.push({
            url: repo,
            type: "repo",
            status: "warning",
            message: "Repository returned 404. Ensure repo is set to Public before deadline.",
          });
        } else if (res.ok || res.status === 301 || res.status === 302) {
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
    if (!video.startsWith("http://") && !video.startsWith("https://")) {
      results.push({
        url: video,
        type: "demo",
        status: "error",
        message: "Invalid URL format (missing https://).",
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
    if (!live.startsWith("http://") && !live.startsWith("https://")) {
      results.push({
        url: live,
        type: "live",
        status: "error",
        message: "Invalid URL format (missing https://).",
      });
    } else {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(live, {
          method: "HEAD",
          headers: { "User-Agent": "HackLine-Auditor/1.0" },
          signal: controller.signal,
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
