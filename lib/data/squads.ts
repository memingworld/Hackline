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

import { getUserCurrentTeam } from "@/lib/data/hackathons";

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

  return data as unknown as InviteTeamDetails;
}
