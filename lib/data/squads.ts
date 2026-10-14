import { createClient } from "@/utils/supabase/server";
import { SavedSquad, Team, InviteTeamDetails } from "@/types/database";

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
 * Fetch the user's active team roster and duty assignments.
 */
export async function getActiveSquadRoster(): Promise<Team | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Check if user is a member of an active team
  const { data: memberRecords } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .limit(1);

  let targetTeamId: string | null = null;

  if (memberRecords && memberRecords.length > 0) {
    targetTeamId = memberRecords[0].team_id;
  } else {
    // Check if user is captain of a team
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
    console.error("Error fetching active squad roster:", error.message);
    return null;
  }

  return data as Team;
}

/**
 * Lookup team and hackathon information by invite code.
 * Safe for public preview before joining.
 */
export async function getTeamByInviteCode(inviteCode: string): Promise<InviteTeamDetails | null> {
  const supabase = await createClient();

  // First attempt via RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_team_by_invite", {
    invite_code_input: inviteCode,
  });

  if (!rpcError && rpcData && rpcData.id) {
    return rpcData as InviteTeamDetails;
  }

  // Fallback: Direct select query with relations
  const { data, error } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      description,
      invite_code,
      captain_id,
      hackathon:hackathons(
        id,
        title,
        source_platform,
        banner_url,
        prize_pool,
        starts_at,
        ends_at
      ),
      members:team_members(
        id,
        user_id,
        duty,
        is_captain,
        user:profiles(
          id,
          full_name,
          avatar_url,
          email
        )
      )
    `)
    .eq("invite_code", inviteCode)
    .single();

  if (error || !data) {
    return null;
  }

  return data as unknown as InviteTeamDetails;
}
