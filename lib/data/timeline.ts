import { createClient } from "@/utils/supabase/server";
import { TimelineEvent } from "@/types/database";

/**
 * Fetch timeline milestone events for a team or hackathon.
 */
export async function getTeamTimelineEvents(
  teamId?: string,
  hackathonId?: string
): Promise<TimelineEvent[]> {
  const supabase = await createClient();

  let query = supabase.from("timeline_events").select("*").order("deadline", { ascending: true });

  if (teamId) {
    query = query.eq("team_id", teamId);
  } else if (hackathonId) {
    query = query.eq("hackathon_id", hackathonId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching timeline events:", error.message);
    return [];
  }

  return (data as TimelineEvent[]) || [];
}

/**
 * Utility to generate a direct 1-click Google Calendar Web Add-Event URL.
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

/**
 * Utility to generate standard .ics iCalendar file content.
 */
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
