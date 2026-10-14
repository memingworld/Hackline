import { createClient } from "@/utils/supabase/server";
import { Hackathon, Team, TimelineEvent, SubmissionChecklistItem } from "@/types/database";
import { extractReservedMembers, toReservedTeamMember } from "@/lib/data/reserved-members";

/**
 * Fetch all active hackathons associated with the authenticated user directly from the Supabase database.
 */
export async function getActiveHackathons(): Promise<Hackathon[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Query 1: Hackathons created by this user
  const { data: createdHacks, error: createdErr } = await supabase
    .from("hackathons")
    .select("id")
    .eq("created_by", user.id);

  if (createdErr) {
    console.error("Error fetching user created hackathons:", createdErr.message);
  }

  // Query 2: Teams where user is captain
  const { data: captainTeams, error: capErr } = await supabase
    .from("teams")
    .select("hackathon_id")
    .eq("captain_id", user.id);

  if (capErr) {
    console.error("Error fetching captain teams:", capErr.message);
  }

  // Query 3: Teams where user is a member
  const { data: memberTeams, error: memErr } = await supabase
    .from("team_members")
    .select("teams!inner(hackathon_id)")
    .eq("user_id", user.id);

  if (memErr) {
    console.error("Error fetching member teams:", memErr.message);
  }

  const hackathonIds = new Set<string>();
  createdHacks?.forEach((h) => hackathonIds.add(h.id));
  captainTeams?.forEach((t) => t.hackathon_id && hackathonIds.add(t.hackathon_id));
  memberTeams?.forEach((m: any) => {
    const hid = m.teams?.hackathon_id;
    if (hid) hackathonIds.add(hid);
  });

  if (hackathonIds.size === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("hackathons")
    .select("*")
    .in("id", Array.from(hackathonIds))
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

  const team = data as Team;
  const { cleanDescription, reservedMembers } = extractReservedMembers(team.description);
  team.description = cleanDescription;
  const existingMembers = team.members || [];
  const syntheticMembers = reservedMembers.map((rm, idx) =>
    toReservedTeamMember(team.id, rm, existingMembers.length + idx)
  );
  team.members = [...existingMembers, ...syntheticMembers];

  return team;
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

/**
 * Fetch a specific hackathon by ID.
 */
export async function getHackathonById(id: string): Promise<Hackathon | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hackathons")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Hackathon;
}
