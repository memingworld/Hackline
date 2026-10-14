/**
 * Calendar formatting and synchronization utilities for Google Calendar and iCal.
 * Client-safe (no server dependencies).
 */

export function generateGoogleCalendarUrl(
  title: string,
  details: string,
  startIso: string,
  endIso?: string
): string {
  const startDate = new Date(startIso);
  const endDate = endIso ? new Date(endIso) : new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatGCalDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const datesParam = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `[Hackline] ${title}`,
    dates: datesParam,
    details: details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateIcsContent(
  title: string,
  details: string,
  startIso: string,
  endIso?: string
): string {
  const startDate = new Date(startIso);
  const endDate = endIso ? new Date(endIso) : new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatIcsDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hackline//Hackathon Calendar Sync//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@hackline.dev`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:[Hackline] ${title}`,
    `DESCRIPTION:${details.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
