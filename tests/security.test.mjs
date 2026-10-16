import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  isValidPublicHttpUrl,
  sanitizeSafeUrl,
  sanitizePlainText,
  sanitizeSafeRedirectPath,
  constantTimeCompare,
  escapeTelegramMarkdown,
  generateTelegramConnectToken,
  verifyTelegramConnectToken,
} from "../lib/security.ts";

test("SAST Security Test Suite: SSRF Prevention", async (t) => {
  await t.test("blocks standard loopback localhost addresses", () => {
    assert.equal(isValidPublicHttpUrl("http://localhost"), false);
    assert.equal(isValidPublicHttpUrl("http://localhost:3000"), false);
    assert.equal(isValidPublicHttpUrl("https://localhost:8080/admin"), false);
    assert.equal(isValidPublicHttpUrl("http://127.0.0.1"), false);
    assert.equal(isValidPublicHttpUrl("http://127.0.0.2:8000"), false);
    assert.equal(isValidPublicHttpUrl("http://127.255.255.255"), false);
    assert.equal(isValidPublicHttpUrl("http://0.0.0.0"), false);
    assert.equal(isValidPublicHttpUrl("http://[::1]"), false);
    assert.equal(isValidPublicHttpUrl("http://[::]"), false);
  });

  await t.test("blocks IPv4-mapped IPv6 loopbacks & metadata bypasses", () => {
    assert.equal(isValidPublicHttpUrl("http://[::ffff:127.0.0.1]"), false);
    assert.equal(isValidPublicHttpUrl("http://[::ffff:169.254.169.254]"), false);
    assert.equal(isValidPublicHttpUrl("http://[::ffff:10.0.0.1]"), false);
    assert.equal(isValidPublicHttpUrl("http://[::ffff:192.168.1.1]"), false);
  });

  await t.test("blocks AWS / GCP cloud metadata endpoints (IPv4 and IPv6)", () => {
    assert.equal(isValidPublicHttpUrl("http://169.254.169.254/latest/meta-data/"), false);
    assert.equal(isValidPublicHttpUrl("http://169.254.169.254/computeMetadata/v1/"), false);
    assert.equal(isValidPublicHttpUrl("http://[fd00:ec2::254]"), false); // AWS EC2 IPv6 metadata
    assert.equal(isValidPublicHttpUrl("http://[fc00::1]"), false); // IPv6 Unique Local
    assert.equal(isValidPublicHttpUrl("http://[fe80::1]"), false); // IPv6 Link-Local
    assert.equal(isValidPublicHttpUrl("http://metadata.google.internal"), false);
    assert.equal(isValidPublicHttpUrl("http://instance-data"), false);
    assert.equal(isValidPublicHttpUrl("http://metadata"), false);
  });

  await t.test("blocks RFC-1918 & CGNAT private IPv4 subnets", () => {
    // 10.0.0.0/8
    assert.equal(isValidPublicHttpUrl("http://10.0.0.1/internal-api"), false);
    assert.equal(isValidPublicHttpUrl("http://10.254.254.254"), false);
    // 172.16.0.0/12
    assert.equal(isValidPublicHttpUrl("http://172.16.0.5:8000"), false);
    assert.equal(isValidPublicHttpUrl("http://172.31.255.255"), false);
    // 192.168.0.0/16
    assert.equal(isValidPublicHttpUrl("http://192.168.1.1/router"), false);
    assert.equal(isValidPublicHttpUrl("http://192.168.0.100:3000"), false);
    // 100.64.0.0/10 (CGNAT)
    assert.equal(isValidPublicHttpUrl("http://100.64.0.1"), false);
    assert.equal(isValidPublicHttpUrl("http://100.127.255.255"), false);
  });

  await t.test("blocks internal domains and non-HTTP protocols", () => {
    assert.equal(isValidPublicHttpUrl("http://service.local"), false);
    assert.equal(isValidPublicHttpUrl("http://app.internal"), false);
    assert.equal(isValidPublicHttpUrl("http://router.lan"), false);
    assert.equal(isValidPublicHttpUrl("file:///etc/passwd"), false);
    assert.equal(isValidPublicHttpUrl("gopher://localhost:70"), false);
    assert.equal(isValidPublicHttpUrl("javascript:alert(1)"), false);
    assert.equal(isValidPublicHttpUrl("data:text/html,hello"), false);
    assert.equal(isValidPublicHttpUrl("blob:https://evil.com/uuid"), false);
  });

  await t.test("allows legitimate public hackathon URLs", () => {
    assert.equal(isValidPublicHttpUrl("https://devpost.com/hackathons/ethglobal"), true);
    assert.equal(isValidPublicHttpUrl("https://ethindia.devfolio.co"), true);
    assert.equal(isValidPublicHttpUrl("https://unstop.com/competitions/flipkart-grid"), true);
    assert.equal(isValidPublicHttpUrl("https://lu.ma/hackathon-sf"), true);
  });
});

test("SAST Security Test Suite: XSS Prevention & URL Sanitization", async (t) => {
  await t.test("neutralizes javascript: URIs across schemes and encodings", () => {
    assert.equal(sanitizeSafeUrl("javascript:alert(document.cookie)"), "");
    assert.equal(sanitizeSafeUrl("JAVASCRIPT:alert(1)"), "");
    assert.equal(sanitizeSafeUrl("javascript:void(0)"), "");
    assert.equal(sanitizeSafeUrl("  javascript:alert(1)"), "");
  });

  await t.test("neutralizes data:, vbscript:, file:, blob:, and intent: URIs", () => {
    assert.equal(sanitizeSafeUrl("data:text/html,<script>alert(1)</script>"), "");
    assert.equal(sanitizeSafeUrl("vbscript:msgbox(1)"), "");
    assert.equal(sanitizeSafeUrl("file:///etc/shadow"), "");
    assert.equal(sanitizeSafeUrl("blob:https://example.com/uuid"), "");
    assert.equal(sanitizeSafeUrl("intent://evil.com"), "");
  });

  await t.test("normalizes valid external URLs and safe relative paths", () => {
    assert.equal(
      sanitizeSafeUrl("https://github.com/myorg/hackline"),
      "https://github.com/myorg/hackline"
    );
    assert.equal(sanitizeSafeUrl("devpost.com/hackathons"), "https://devpost.com/hackathons");
    assert.equal(sanitizeSafeUrl("/dashboard/squad"), "/dashboard/squad");
    // Protocol-relative URLs must be blocked
    assert.equal(sanitizeSafeUrl("//evil.com/phish"), "");
  });
});

test("SAST Security Test Suite: Input Sanitization & Entity Mutation Defense", async (t) => {
  await t.test("strips script blocks, style blocks, and HTML tags", () => {
    assert.equal(
      sanitizePlainText("<script>alert('pwned')</script>Hackathon Title"),
      "Hackathon Title"
    );
    assert.equal(
      sanitizePlainText("<img src=x onerror=alert(1)>TreeHacks"),
      "TreeHacks"
    );
    assert.equal(
      sanitizePlainText("<style>body{display:none}</style>Clean Text"),
      "Clean Text"
    );
  });

  await t.test("neutralizes entity-encoded tag injections (prevents mutation XSS)", () => {
    const maliciousEntity = "&lt;img src=x onerror=alert(1)&gt;";
    const sanitized = sanitizePlainText(maliciousEntity);
    // Sanitized output must never contain executable HTML tags
    assert.equal(sanitized.includes("<"), false);
    assert.equal(sanitized.includes(">"), false);
  });

  await t.test("strips dangerous null bytes and ASCII control characters", () => {
    const malicious = "Title\u0000\u0008Injection";
    assert.equal(sanitizePlainText(malicious), "TitleInjection");
  });
});

test("SAST Security Test Suite: Open Redirect & Path Traversal Prevention", async (t) => {
  await t.test("blocks protocol-relative open redirect bypasses", () => {
    assert.equal(sanitizeSafeRedirectPath("//evil.com"), "/dashboard");
    assert.equal(sanitizeSafeRedirectPath("//evil.com/phish"), "/dashboard");
    assert.equal(sanitizeSafeRedirectPath("/\\evil.com"), "/dashboard");
  });

  await t.test("blocks absolute external URLs in redirect parameters", () => {
    assert.equal(sanitizeSafeRedirectPath("https://evil.com/login"), "/dashboard");
    assert.equal(sanitizeSafeRedirectPath("http://attacker.com"), "/dashboard");
    assert.equal(sanitizeSafeRedirectPath("javascript:alert(1)"), "/dashboard");
  });

  await t.test("preserves valid internal relative paths and query parameters", () => {
    assert.equal(sanitizeSafeRedirectPath("/dashboard"), "/dashboard");
    assert.equal(sanitizeSafeRedirectPath("/dashboard/squad"), "/dashboard/squad");
    assert.equal(
      sanitizeSafeRedirectPath("/dashboard/hackathons?id=123#overview"),
      "/dashboard/hackathons?id=123#overview"
    );
    assert.equal(sanitizeSafeRedirectPath(null), "/dashboard");
    assert.equal(sanitizeSafeRedirectPath(""), "/dashboard");
  });
});

test("SAST Security Test Suite: Constant-Time Comparison Timing Defense", async (t) => {
  await t.test("correctly verifies matching secrets", () => {
    const secret = "secret_cron_token_998877665544332211";
    assert.equal(constantTimeCompare(secret, secret), true);
  });

  await t.test("rejects mismatched tokens safely without timing leaks", () => {
    assert.equal(constantTimeCompare("secretA", "secretB"), false);
    assert.equal(constantTimeCompare("secretA", "secretLongerToken"), false);
    assert.equal(constantTimeCompare("", "secret"), false);
  });
});

test("Telegram Security Suite: Markdown Sanitization", async (t) => {
  await t.test("escapes formatting entities to prevent Telegram parse crashes", () => {
    const raw = "Team *Alpha* [Hackathon_2026] `code_snippet`";
    const escaped = escapeTelegramMarkdown(raw);
    assert.equal(escaped, "Team \\*Alpha\\* \\[Hackathon\\_2026\\] \\`code\\_snippet\\`");
  });

  await t.test("handles null, undefined, and empty inputs gracefully", () => {
    assert.equal(escapeTelegramMarkdown(""), "");
    assert.equal(escapeTelegramMarkdown(null), "");
    assert.equal(escapeTelegramMarkdown(undefined), "");
  });
});

test("Telegram Security Suite: Cryptographic Account Linking Tokens", async (t) => {
  const userId = "usr_99aa88bb77cc";

  await t.test("generates and verifies a valid HMAC-signed connect token", () => {
    const token = generateTelegramConnectToken(userId);
    assert.ok(token && typeof token === "string");
    const verified = verifyTelegramConnectToken(token);
    assert.equal(verified, userId);
  });

  await t.test("rejects tampered token signature", () => {
    const token = generateTelegramConnectToken(userId);
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    // Tamper with the incoming signature
    parts[2] = "00000000000000000000000000000000";
    const tamperedToken = Buffer.from(parts.join(":")).toString("base64url");
    assert.equal(verifyTelegramConnectToken(tamperedToken), null);
  });

  await t.test("rejects tampered user identifier in token payload", () => {
    const token = generateTelegramConnectToken(userId);
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    // Tamper with the user ID without updating the signature
    parts[0] = "usr_evil_impersonator";
    const tamperedToken = Buffer.from(parts.join(":")).toString("base64url");
    assert.equal(verifyTelegramConnectToken(tamperedToken), null);
  });

  await t.test("rejects expired tokens older than one hour", () => {
    // Generate token with timestamp from 2 hours ago
    const expiredTimestamp = (Date.now() - 2 * 60 * 60 * 1000).toString();
    const secret = "hackline_telegram_link_secret";
    const payload = `${userId}:${expiredTimestamp}`;
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")
      .substring(0, 32);
    const expiredToken = Buffer.from(`${payload}:${signature}`).toString("base64url");
    assert.equal(verifyTelegramConnectToken(expiredToken), null);
  });

  await t.test("rejects invalid, malformed, or blank tokens", () => {
    assert.equal(verifyTelegramConnectToken(""), null);
    assert.equal(verifyTelegramConnectToken(null), null);
    assert.equal(verifyTelegramConnectToken("invalid-base64url-token"), null);
    assert.equal(verifyTelegramConnectToken("abc:123"), null);
  });
});

