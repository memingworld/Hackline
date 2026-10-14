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

/**
 * Generate a multi-event RFC 5545 .ics iCalendar file aggregating all hackathon deadlines.
 */
export function generateMultiEventIcsContent(
  events: Array<{
    title: string;
    details: string;
    startIso: string;
    endIso?: string;
  }>
): string {
  const formatIcsDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const nowStamp = formatIcsDate(new Date());

  const eventBlocks = events.map((event, idx) => {
    const startDate = new Date(event.startIso);
    const endDate = event.endIso ? new Date(event.endIso) : new Date(startDate.getTime() + 60 * 60 * 1000);

    return [
      "BEGIN:VEVENT",
      `UID:${Date.now()}-${idx}@hackline.dev`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:[Hackline] ${event.title}`,
      `DESCRIPTION:${(event.details || "").replace(/\n/g, "\\n")}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hackline//Universal Hackathon Deadlines//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...eventBlocks,
    "END:VCALENDAR",
  ].join("\r\n");
}

