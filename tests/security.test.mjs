import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidPublicHttpUrl,
  sanitizeSafeUrl,
  sanitizePlainText,
} from "../lib/security.ts";

test("SAST Security Test Suite: SSRF Prevention", async (t) => {
  await t.test("blocks loopback localhost addresses", () => {
    assert.equal(isValidPublicHttpUrl("http://localhost"), false);
    assert.equal(isValidPublicHttpUrl("http://localhost:3000"), false);
    assert.equal(isValidPublicHttpUrl("https://localhost:8080/admin"), false);
    assert.equal(isValidPublicHttpUrl("http://127.0.0.1"), false);
    assert.equal(isValidPublicHttpUrl("http://127.0.0.1:5432"), false);
    assert.equal(isValidPublicHttpUrl("http://0.0.0.0"), false);
    assert.equal(isValidPublicHttpUrl("http://[::1]"), false);
  });

  await t.test("blocks AWS / GCP cloud metadata endpoints (169.254.169.254)", () => {
    assert.equal(isValidPublicHttpUrl("http://169.254.169.254/latest/meta-data/"), false);
    assert.equal(isValidPublicHttpUrl("http://169.254.169.254/computeMetadata/v1/"), false);
    assert.equal(isValidPublicHttpUrl("http://metadata.google.internal"), false);
  });

  await t.test("blocks RFC-1918 private IPv4 subnets", () => {
    // 10.0.0.0/8
    assert.equal(isValidPublicHttpUrl("http://10.0.0.1/internal-api"), false);
    // 172.16.0.0/12
    assert.equal(isValidPublicHttpUrl("http://172.16.0.5:8000"), false);
    assert.equal(isValidPublicHttpUrl("http://172.31.255.255"), false);
    // 192.168.0.0/16
    assert.equal(isValidPublicHttpUrl("http://192.168.1.1/router"), false);
    assert.equal(isValidPublicHttpUrl("http://192.168.0.100:3000"), false);
  });

  await t.test("blocks non-HTTP protocols", () => {
    assert.equal(isValidPublicHttpUrl("file:///etc/passwd"), false);
    assert.equal(isValidPublicHttpUrl("gopher://localhost:70"), false);
    assert.equal(isValidPublicHttpUrl("javascript:alert(1)"), false);
    assert.equal(isValidPublicHttpUrl("data:text/html,hello"), false);
  });

  await t.test("allows legitimate public hackathon URLs", () => {
    assert.equal(isValidPublicHttpUrl("https://devpost.com/hackathons/ethglobal"), true);
    assert.equal(isValidPublicHttpUrl("https://ethindia.devfolio.co"), true);
    assert.equal(isValidPublicHttpUrl("https://unstop.com/competitions/flipkart-grid"), true);
    assert.equal(isValidPublicHttpUrl("https://lu.ma/hackathon-sf"), true);
  });
});

test("SAST Security Test Suite: XSS Prevention & URL Sanitization", async (t) => {
  await t.test("neutralizes javascript: URIs", () => {
    assert.equal(sanitizeSafeUrl("javascript:alert(document.cookie)"), "");
    assert.equal(sanitizeSafeUrl("JAVASCRIPT:alert(1)"), "");
    assert.equal(sanitizeSafeUrl("javascript:void(0)"), "");
  });

  await t.test("neutralizes data: and vbscript: URIs", () => {
    assert.equal(sanitizeSafeUrl("data:text/html,<script>alert(1)</script>"), "");
    assert.equal(sanitizeSafeUrl("vbscript:msgbox(1)"), "");
  });

  await t.test("normalizes valid URLs with https", () => {
    assert.equal(sanitizeSafeUrl("https://github.com/myorg/hackline"), "https://github.com/myorg/hackline");
    assert.equal(sanitizeSafeUrl("devpost.com/hackathons"), "https://devpost.com/hackathons");
  });
});

test("SAST Security Test Suite: Input Sanitization", async (t) => {
  await t.test("strips HTML tags and script injections", () => {
    assert.equal(
      sanitizePlainText("<script>alert('pwned')</script>Hackathon Title"),
      "Hackathon Title"
    );
    assert.equal(
      sanitizePlainText("<img src=x onerror=alert(1)>TreeHacks"),
      "TreeHacks"
    );
    assert.equal(
      sanitizePlainText("<b>Bold</b> &amp; <i>Italic</i>"),
      "Bold & Italic"
    );
  });

  await t.test("strips dangerous null bytes and ASCII control characters", () => {
    const malicious = "Title\u0000\u0008Injection";
    assert.equal(sanitizePlainText(malicious), "TitleInjection");
  });
});
