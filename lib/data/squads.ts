import { createClient } from "@/utils/supabase/server";
import { SavedSquad, Team, InviteTeamDetails, TeamMember } from "@/types/database";
import { getUserCurrentTeam } from "@/lib/data/hackathons";
import {
  ReservedMember,
  extractReservedMembers,
  encodeReservedMembers,
  toReservedTeamMember,
} from "./reserved-members";

export * from "./reserved-members";

/**
 * Fetch all saved squads owned by the authenticated user with their pre-assigned member templates.
 */
export async function getUserSavedSquads(): Promise<SavedSquad[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_squads")
    .select(`
      *,
      members:saved_squad_members(*)
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching saved squads:", error.message);
    return [];
  }

  return (data as SavedSquad[]) || [];
}

/**
 * Fetch the user's active team roster and duty assignments for a specific hackathon.
 */
export async function getActiveSquadRoster(hackathonId?: string): Promise<Team | null> {
  return getUserCurrentTeam(hackathonId);
}

/**
 * Lookup team and hackathon information by invite code.
 * Safe for public preview before joining.
 */
export async function getTeamByInviteCode(inviteCode: string): Promise<InviteTeamDetails | null> {
  const supabase = await createClient();

  let teamDetails: any = null;

  // First attempt via RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_team_by_invite", {
    invite_code_input: inviteCode,
  });

  if (!rpcError && rpcData && rpcData.id) {
    teamDetails = rpcData;
  } else {
    // Fallback: Direct select query with relations
    const { data, error } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        description,
        invite_code,
        captain_id,
        max_members,
        hackathon:hackathons(
          id,
          title,
          source_platform,
          banner_url,
          prize_pool,
          starts_at,
          ends_at,
          min_team_size,
          max_team_size
        ),
        members:team_members(
          id,
          user_id,
          duty,
          is_captain,
          user:profiles(
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq("invite_code", inviteCode)
      .single();

    if (error || !data) {
      return null;
    }
    teamDetails = data;
  }

  if (teamDetails) {
    const { cleanDescription, reservedMembers } = extractReservedMembers(teamDetails.description);
    teamDetails.description = cleanDescription;
    const existingMembers = teamDetails.members || [];
    const syntheticMembers = reservedMembers.map((rm, idx) =>
      toReservedTeamMember(teamDetails.id, rm, existingMembers.length + idx)
    );
    teamDetails.members = [...existingMembers, ...syntheticMembers];
  }

  return teamDetails as unknown as InviteTeamDetails;
}

/**
 * Fetch all teams where the authenticated user is a captain or enrolled member.
 */
export async function getUserAllTeams(): Promise<Team[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // 1. Teams where user is captain
  const { data: captainTeams } = await supabase
    .from("teams")
    .select("id")
    .eq("captain_id", user.id);

  // 2. Teams where user is member
  const { data: memberTeams } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const teamIds = new Set<string>();
  captainTeams?.forEach((t) => teamIds.add(t.id));
  memberTeams?.forEach((m) => teamIds.add(m.team_id));

  if (teamIds.size === 0) return [];

  const { data, error } = await supabase
    .from("teams")
    .select(`
      *,
      hackathon:hackathons(*),
      members:team_members(
        id,
        team_id,
        user_id,
        duty,
        is_captain,
        joined_at,
        user:profiles(*)
      )
    `)
    .in("id", Array.from(teamIds))
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user all teams:", error.message);
    return [];
  }

  const teams = (data as Team[]) || [];
  return teams.map((team) => {
    const { cleanDescription, reservedMembers } = extractReservedMembers(team.description);
    team.description = cleanDescription;
    const existingMembers = team.members || [];
    const syntheticMembers = reservedMembers.map((rm, idx) =>
      toReservedTeamMember(team.id, rm, existingMembers.length + idx)
    );
    team.members = [...existingMembers, ...syntheticMembers];
    return team;
  });
}
