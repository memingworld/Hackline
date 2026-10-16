import crypto from "crypto";

/**
 * Security and Sanitization Utilities for Hackline
 * Mitigates SSRF, XSS, Open Redirect, and Malformed Input Vulnerabilities.
 */

// Hostnames prohibited from server-side fetching
const FORBIDDEN_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "::",
  "[::]",
  "metadata.google.internal",
  "instance-data",
  "metadata",
  "metadata.internal",
]);

/**
 * Checks whether an IPv4 address is in a private, loopback, link-local, or reserved range.
 */
function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [b0, b1, b2, b3] = parts;

  // 0.0.0.0/8 (Current network)
  if (b0 === 0) return true;

  // 10.0.0.0/8 (Private)
  if (b0 === 10) return true;

  // 100.64.0.0/10 (Shared address space / CGNAT)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;

  // 169.254.0.0/16 (Link-local / Cloud metadata AWS/GCP)
  if (b0 === 169 && b1 === 254) return true;

  // 172.16.0.0/12 (Private)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

  // 192.0.0.0/24 (IETF protocol assignments)
  if (b0 === 192 && b1 === 0 && b2 === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (b0 === 192 && b1 === 0 && b2 === 2) return true;

  // 192.88.99.0/24 (6to4 Relay)
  if (b0 === 192 && b1 === 88 && b2 === 99) return true;

  // 192.168.0.0/16 (Private)
  if (b0 === 192 && b1 === 168) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (b0 === 198 && (b1 === 18 || b1 === 19)) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (b0 === 198 && b1 === 51 && b2 === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (b0 === 203 && b1 === 0 && b2 === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (b0 >= 224 && b0 <= 239) return true;

  // 240.0.0.0/4 (Reserved) & 255.255.255.255 (Broadcast)
  if (b0 >= 240) return true;

  return false;
}

/**
 * Checks whether an IPv6 address is in a private, loopback, link-local, or cloud metadata range.
 */
function isPrivateOrReservedIpv6(rawIpv6: string): boolean {
  const clean = rawIpv6.toLowerCase().replace(/^\[|\]$/g, "");

  // Loopback (::1) and Unspecified (::)
  if (clean === "::1" || clean === "::" || /^0*(:0*)*1$/.test(clean)) {
    return true;
  }

  // IPv4-mapped IPv6 address (e.g. ::ffff:127.0.0.1 or canonicalized hex ::ffff:7f00:1)
  if (clean.includes("ffff:")) {
    const afterFfff = clean.split("ffff:")[1];
    if (afterFfff) {
      if (afterFfff.includes(".")) {
        return isPrivateOrReservedIpv4(afterFfff);
      }
      const hexParts = afterFfff.split(":");
      if (hexParts.length === 2) {
        const h0 = parseInt(hexParts[0], 16);
        const h1 = parseInt(hexParts[1], 16);
        if (!isNaN(h0) && !isNaN(h1)) {
          const octets = [
            (h0 >> 8) & 0xff,
            h0 & 0xff,
            (h1 >> 8) & 0xff,
            h1 & 0xff,
          ];
          return isPrivateOrReservedIpv4(octets.join("."));
        }
      }
    }
    return true; // Any unrecognized ::ffff: mapping is safest to block
  }

  // Unique Local Address: fc00::/7 (covers fc00: through fdff:, including AWS EC2 fd00:ec2::254)
  if (/^f[cd][0-9a-f]{2}:/i.test(clean)) {
    return true;
  }

  // Link-Local: fe80::/10 (covers fe80: through febf:)
  if (/^fe[89ab][0-9a-f]:/i.test(clean)) {
    return true;
  }

  // Multicast: ff00::/8
  if (/^ff[0-9a-f]{2}:/i.test(clean)) {
    return true;
  }

  // Documentation: 2001:db8::/32
  if (/^2001:0?db8:/i.test(clean)) {
    return true;
  }

  // Discard prefix: 100::/64
  if (/^0*100::/i.test(clean)) {
    return true;
  }

  // IPv4/IPv6 translation: 64:ff9b::/96
  if (/^64:ff9b::/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Validates that a URL is a legitimate public web address suitable for server-side fetching.
 * Strictly blocks SSRF attempts against localhost, internal subnets, IPv4/IPv6 private ranges,
 * and cloud metadata services.
 */
export function isValidPublicHttpUrl(urlInput: string): boolean {
  if (!urlInput || typeof urlInput !== "string") return false;

  try {
    const trimmed = urlInput.trim();

    // If a scheme is explicitly specified, it must strictly be http: or https:
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
      if (!/^https?:\/\//i.test(trimmed)) {
        return false;
      }
    }

    const targetUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(targetUrl);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const rawHostname = parsed.hostname.toLowerCase().trim();
    const cleanHostname = rawHostname.replace(/^\[|\]$/g, "");

    // Check against forbidden hostnames
    if (FORBIDDEN_HOSTNAMES.has(rawHostname) || FORBIDDEN_HOSTNAMES.has(cleanHostname)) {
      return false;
    }

    // Check for private TLDs or local network names
    if (
      cleanHostname.endsWith(".localhost") ||
      cleanHostname.endsWith(".local") ||
      cleanHostname.endsWith(".internal") ||
      cleanHostname.endsWith(".lan") ||
      cleanHostname.endsWith(".arpa") ||
      cleanHostname.endsWith(".onion")
    ) {
      return false;
    }

    // Check IPv4 addresses
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(cleanHostname)) {
      if (isPrivateOrReservedIpv4(cleanHostname)) {
        return false;
      }
    }

    // Check IPv6 addresses (or bracketed hostnames)
    if (rawHostname.startsWith("[") || cleanHostname.includes(":")) {
      if (isPrivateOrReservedIpv6(cleanHostname)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes URLs intended for rendering in client <a> or <link> tags.
 * Replaces javascript:, data:, and other dangerous schemes with a safe fallback to prevent XSS.
 */
export function sanitizeSafeUrl(urlInput?: string | null): string {
  if (!urlInput || typeof urlInput !== "string") return "";

  // Strip null bytes and non-printable control characters
  const cleaned = urlInput.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  if (!cleaned) return "";

  const lower = cleaned.toLowerCase();

  // Reject dangerous schemes
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:") ||
    lower.startsWith("blob:") ||
    lower.startsWith("intent:")
  ) {
    return "";
  }

  // Reject protocol-relative URLs (e.g. `//evil.com` or `/\evil.com`)
  if (cleaned.startsWith("//") || cleaned.startsWith("/\\")) {
    return "";
  }

  // Safe relative paths
  if (cleaned.startsWith("/")) {
    return cleaned;
  }

  // Ensure protocol is http or https
  const target = lower.startsWith("http://") || lower.startsWith("https://")
    ? cleaned
    : `https://${cleaned}`;

  try {
    const parsed = new URL(target);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return target;
    }
  } catch {
    return "";
  }

  return "";
}

/**
 * Strips HTML tags, script injections, and malformed characters from user text inputs.
 * Uses a safe recursive pass to prevent entity-decoded tag injection vulnerabilities.
 */
export function sanitizePlainText(input?: string | null): string {
  if (!input || typeof input !== "string") return "";

  // 1. Strip ASCII control chars and null bytes
  let result = input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // 2. Multi-pass tag stripping in case tags are nested or decoded
  let previous = "";
  let iterations = 0;
  while (previous !== result && iterations < 5) {
    previous = result;
    result = result.replace(/<[^>]*>/g, "");
    iterations++;
  }

  // 3. Decode non-HTML entities safely without reviving < or > tags
  result = result
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // 4. Remove any remaining raw angle brackets so text can never be parsed as HTML tags
  result = result.replace(/[<>]/g, "");

  return result.trim();
}

/**
 * Validates and sanitizes internal application redirect paths (e.g. for login callbacks).
 * Mitigates Open Redirect (CWE-601) and Protocol-Relative redirection attacks.
 */
export function sanitizeSafeRedirectPath(nextPath?: string | null, fallback = "/dashboard"): string {
  if (!nextPath || typeof nextPath !== "string") return fallback;

  const trimmed = nextPath.trim();

  // Must begin with a single "/" and NOT "//" or "/\" (protocol-relative bypasses)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Must not contain backslashes or URI schemes before the first path segment
  if (trimmed.includes("\\") || /^\/[a-zA-Z0-9+.-]+:/.test(trimmed)) {
    return fallback;
  }

  try {
    // Resolve against dummy origin to verify it is strictly a path on the same host
    const resolved = new URL(trimmed, "http://localhost");
    if (resolved.origin !== "http://localhost") {
      return fallback;
    }
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Constant-time string comparison to defend against timing attacks on authentication secrets.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;

  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");

  if (bufA.length !== bufB.length) {
    // Perform dummy comparison to equalize timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Escapes characters for Telegram standard Markdown formatting to prevent parsing crashes.
 */
export function escapeTelegramMarkdown(text?: string | null): string {
  if (!text || typeof text !== "string") return "";
  return text.replace(/([*_`\[\]])/g, "\\$1");
}

/**
 * Generates an HMAC-signed, time-bounded token for Telegram account linking.
 * Mitigates unauthorized identifier linking on the notification channel.
 */
export function generateTelegramConnectToken(userId: string): string {
  if (!userId) return "";
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.CRON_SECRET || "hackline_telegram_link_secret";
  const timestamp = Date.now().toString();
  const payload = `${userId}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
    .substring(0, 32);

  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

/**
 * Verifies an HMAC-signed Telegram connection token. Returns userId if valid and not expired (1 hour).
 */
export function verifyTelegramConnectToken(token: string): string | null {
  if (!token || typeof token !== "string") return null;

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;

    const [userId, timestampStr, incomingSig] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return null;

    // Check expiration: 1 hour (3600000 ms)
    const MAX_AGE_MS = 60 * 60 * 1000;
    if (Date.now() - timestamp > MAX_AGE_MS || timestamp > Date.now() + 60000) {
      return null;
    }

    const secret = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.CRON_SECRET || "hackline_telegram_link_secret";
    const payload = `${userId}:${timestampStr}`;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")
      .substring(0, 32);

    if (constantTimeCompare(incomingSig, expectedSig)) {
      return userId;
    }

    return null;
  } catch {
    return null;
  }
}
