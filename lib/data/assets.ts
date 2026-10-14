import { createClient } from "@/utils/supabase/server";
import { Asset } from "@/types/database";

/**
 * Fetch all shared assets for the team (GitHub repos, Figma boards, Canva decks, Loom demos).
 */
export async function getTeamAssets(teamId: string): Promise<Asset[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !teamId) return [];

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching team assets:", error.message);
    return [];
  }

  return (data as Asset[]) || [];
}

/**
 * Fetch all assets belonging to any of the user's teams, joined with team and hackathon info.
 */
export async function getAllUserAssets(): Promise<(Asset & { team?: any })[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("assets")
    .select(`
      *,
      team:teams(
        id,
        name,
        hackathon:hackathons(
          id,
          title,
          source_platform
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all user assets:", error.message);
    return [];
  }

  return data || [];
}
