import { test } from "node:test";
import assert from "node:assert/strict";

test("Devnovate Scraper Engine: extracts live hackathon by slug", async () => {
  const slug = "sgu_hackx-10";
  const res = await fetch(`https://devnovate.co/api/v1/events/name/${encodeURIComponent(slug)}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  assert.equal(res.status, 200, "Devnovate API should return 200 OK");
  const json = await res.json();
  const event = json.hackathon;

  assert.ok(event, "Event payload should contain hackathon data");
  assert.ok(event.name.includes("SGU"), "Title should match SGU hackathon");
  assert.equal(event.hackathon, "sgu_hackx-10", "Slug should match");
  assert.ok(event.prizePool, "Prize pool should be populated");
  assert.ok(event.startDate, "Start date should be present");
  assert.ok(event.endDate, "End date should be present");
  assert.ok(Array.isArray(event.schedule), "Schedule checkpoints should be an array");
});

test("Devnovate Scraper Engine: extracts list of events for fallback discovery", async () => {
  const res = await fetch("https://devnovate.co/api/v1/events", {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  assert.equal(res.status, 200, "Devnovate events list should return 200 OK");
  const list = await res.json();
  assert.ok(Array.isArray(list), "Response should be an array of hackathons");
  assert.ok(list.length > 50, "Should contain active hackathons");
});
