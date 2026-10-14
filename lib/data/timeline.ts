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
 * Fetch all timeline milestone events across all enrolled hackathons with event metadata.
 */
export async function getAllUserTimelineEvents(): Promise<(TimelineEvent & { hackathon?: any })[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Fetch events joined with hackathon data
  const { data, error } = await supabase
    .from("timeline_events")
    .select(`
      *,
      hackathon:hackathons(
        id,
        title,
        slug,
        source_platform,
        starts_at,
        ends_at,
        banner_url,
        prize_pool
      )
    `)
    .order("deadline", { ascending: true });

  if (error) {
    console.error("Error fetching all user timeline events:", error.message);
    return [];
  }

  return data || [];
}
