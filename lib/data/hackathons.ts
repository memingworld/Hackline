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
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching hackathons from Supabase:", error.message);
    return [];
  }

  return (data as Hackathon[]) || [];
}

/**
 * Fetch the authenticated user's current team and member roster for a specific hackathon.
 */
export async function getUserCurrentTeam(hackathonId?: string): Promise<Team | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let targetTeamId: string | null = null;

  // 1. If hackathonId is provided, first look for teams linked to that hackathon
  if (hackathonId) {
    // Check if captain of a team in this hackathon
    const { data: captainTeams } = await supabase
      .from("teams")
      .select("id")
      .eq("captain_id", user.id)
      .eq("hackathon_id", hackathonId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (captainTeams && captainTeams.length > 0) {
      targetTeamId = captainTeams[0].id;
    } else {
      // Check team_members in this hackathon
      const { data: memberTeams } = await supabase
        .from("team_members")
        .select("team_id, teams!inner(id, hackathon_id)")
        .eq("user_id", user.id)
        .eq("teams.hackathon_id", hackathonId)
        .limit(1);

      if (memberTeams && memberTeams.length > 0) {
        targetTeamId = memberTeams[0].team_id;
      }
    }
  } else {
    // 2. Fallback: get the user's latest team only if no specific hackathon was requested
    const { data: captainTeams } = await supabase
      .from("teams")
      .select("id")
      .eq("captain_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (captainTeams && captainTeams.length > 0) {
      targetTeamId = captainTeams[0].id;
    } else {
      const { data: memberRecords } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .limit(1);

      if (memberRecords && memberRecords.length > 0) {
        targetTeamId = memberRecords[0].team_id;
      }
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
