import { createClient } from "@/utils/supabase/server";
import { Hackathon, Team, TimelineEvent, SubmissionChecklistItem } from "@/types/database";

/**
 * Fetch all active hackathons directly from the Supabase database.
 */
export async function getActiveHackathons(): Promise<Hackathon[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("hackathons")
    .select("*")
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Error fetching hackathons from Supabase:", error.message);
    return [];
  }

  return (data as Hackathon[]) || [];
}

/**
 * Fetch the authenticated user's current team and member roster.
 */
export async function getUserCurrentTeam(): Promise<Team | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Query team where user is either the captain or a squad member
  const { data: memberRecords, error: memberError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .limit(1);

  let targetTeamId: string | null = null;

  if (memberRecords && memberRecords.length > 0) {
    targetTeamId = memberRecords[0].team_id;
  } else {
    // Check if user is a captain of a team
    const { data: captainTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("captain_id", user.id)
      .limit(1);

    if (captainTeam && captainTeam.length > 0) {
      targetTeamId = captainTeam[0].id;
    }
  }

  if (!targetTeamId) return null;

  const { data, error } = await supabase
    .from("teams")
    .select(`
      *,
      members:team_members(
        id,
        team_id,
        user_id,
        duty,
        is_captain,
        joined_at,
        user:profiles(*)
      ),
      hackathon:hackathons(*)
    `)
    .eq("id", targetTeamId)
    .single();

  if (error) {
    console.error("Error fetching team roster from Supabase:", error.message);
    return null;
  }

  return data as Team;
}

/**
 * Fetch timeline gates for a given team or hackathon.
 */
export async function getTeamTimeline(teamId?: string, hackathonId?: string): Promise<TimelineEvent[]> {
  const supabase = await createClient();

  let query = supabase.from("timeline_events").select("*").order("deadline", { ascending: true });

  if (teamId) {
    query = query.eq("team_id", teamId);
  } else if (hackathonId) {
    query = query.eq("hackathon_id", hackathonId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching timeline events from Supabase:", error.message);
    return [];
  }

  return (data as TimelineEvent[]) || [];
}

/**
 * Fetch submission checklist items for a team.
 */
export async function getSubmissionChecklist(teamId: string): Promise<SubmissionChecklistItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submission_checklists")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching submission checklist from Supabase:", error.message);
    return [];
  }

  return (data as SubmissionChecklistItem[]) || [];
}
