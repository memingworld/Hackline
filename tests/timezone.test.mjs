import test from "node:test";
import assert from "node:assert/strict";
import {
  toLocalDatetimeString,
  toDateKey,
  parseDateTimeInputToUtc,
  formatDateTimeIst,
  formatDateIst,
  formatTimeIst,
  formatNotificationDeadline,
} from "../lib/utils.ts";

test("Timezone Suite: parseDateTimeInputToUtc & toLocalDatetimeString round-trip in IST", () => {
  // 1. User inputs midnight 19 Oct 00:00 in datetime-local input
  const localInput = "2026-10-19T00:00";
  const utcIso = parseDateTimeInputToUtc(localInput);

  // In UTC, Oct 19 00:00 IST is Oct 18 18:30:00.000Z
  assert.equal(utcIso, "2026-10-18T18:30:00.000Z");

  // Round-trip back to datetime-local input string
  const roundTripLocal = toLocalDatetimeString(utcIso);
  assert.equal(roundTripLocal, "2026-10-19T00:00");
});

test("Timezone Suite: toDateKey calendar matching in IST", () => {
  // Oct 18 18:30 UTC is Oct 19 in IST
  const dateKey = toDateKey("2026-10-18T18:30:00.000Z");
  assert.equal(dateKey, "2026-10-19");
});

test("Timezone Suite: formatDateTimeIst displays correctly in IST", () => {
  const formatted = formatDateTimeIst("2026-10-18T18:30:00.000Z");
  assert.equal(formatted, "Oct 19, 12:00 AM");

  const formattedWithTz = formatDateTimeIst("2026-10-18T18:30:00.000Z", { includeTz: true });
  assert.equal(formattedWithTz, "Oct 19, 12:00 AM IST");
});

test("Timezone Suite: formatDateIst & formatTimeIst", () => {
  const dateStr = formatDateIst("2026-10-18T18:30:00.000Z");
  assert.equal(dateStr, "Oct 19, 2026");

  const timeStr = formatTimeIst("2026-10-18T18:30:00.000Z");
  assert.equal(timeStr, "12:00 AM");
});

test("Timezone Suite: formatNotificationDeadline reports in IST", () => {
  const info = formatNotificationDeadline("2026-10-18T18:30:00.000Z", {
    preferredTimezone: "Asia/Kolkata",
    referenceTimeMs: new Date("2026-10-18T16:30:00.000Z").getTime(), // 2h before
  });

  assert.equal(info.localizedDateTime, "Oct 19, 12:00 AM IST");
  assert.equal(info.countdownText, "2h remaining");
});
