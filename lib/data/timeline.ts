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
