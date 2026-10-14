/**
 * Security and Sanitization Utilities for Hackline
 * Mitigates SSRF, XSS, and Malformed Input Vulnerabilities
 */

const PRIVATE_IP_PATTERNS = [
  /^127\./, // 127.0.0.0/8 (Loopback)
  /^10\./, // 10.0.0.0/8 (Private)
  /^192\.168\./, // 192.168.0.0/16 (Private)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (Private)
  /^169\.254\./, // 169.254.0.0/16 (Link-local / Cloud metadata)
  /^0\./, // 0.0.0.0/8
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // 100.64.0.0/10 (Carrier-grade NAT)
  /^fc00:/i, // Unique local address (IPv6)
  /^fe80:/i, // Link-local address (IPv6)
  /^::1$/, // Loopback (IPv6)
  /^::$/, // Unspecified (IPv6)
];

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
]);

/**
 * Validates that a URL is a legitimate public web address suitable for server-side fetching.
 * Strictly blocks SSRF attempts against localhost, internal subnets, and cloud metadata services.
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
      cleanHostname.endsWith(".arpa")
    ) {
      return false;
    }

    // Check against private / internal IP ranges
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(cleanHostname)) {
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

  const trimmed = urlInput.trim();
  if (!trimmed) return "";

  // Reject dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return "";
  }

  // Ensure protocol is http or https
  if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Strips HTML tags, script injections, and malformed characters from user text inputs.
 */
export function sanitizePlainText(input?: string | null): string {
  if (!input || typeof input !== "string") return "";

  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "") // strip entire <script>...</script> block
    .replace(/<style[\s\S]*?<\/style>/gi, "") // strip entire <style>...</style> block
    .replace(/<[^>]*>/g, "") // strip remaining HTML tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // strip ASCII control chars
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
