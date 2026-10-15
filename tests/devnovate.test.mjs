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

test("Devnovate Scraper Engine: parses Colossal-A-Pitch schedule and dates accurately in IST", async () => {
  const slug = "colossal-a-pitch";
  const res = await fetch(`https://devnovate.co/api/v1/events/name/${encodeURIComponent(slug)}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  const event = json.hackathon;

  assert.equal(event.name, "Colossal-A-Pitch");
  assert.equal(event.startDate, "27-10-2026");
  assert.equal(event.endDate, "27-10-2026");
  assert.equal(event.registrationDeadline, "2026-10-22T12:00");

  // Verify schedule has 5 checkpoints
  assert.ok(Array.isArray(event.schedule));
  assert.equal(event.schedule.length, 1);
  assert.equal(event.schedule[0].events.length, 5);

  const times = event.schedule[0].events.map((e) => e.time);
  assert.deepEqual(times, ["08:00 AM", "09:30 AM", "10:00 AM", "06:00 PM", "07:00 PM"]);
});

