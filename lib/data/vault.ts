import { createClient } from "@/utils/supabase/server";
import { ProblemStatement } from "@/types/database";

/**
 * Fetch problem statements for the active team with computed vote tallies and current user vote status.
 */
export async function getTeamProblemStatements(teamId: string): Promise<ProblemStatement[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !teamId) return [];

  // 1. Fetch statements
  const { data: statements, error } = await supabase
    .from("problem_statements")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error || !statements) {
    console.error("Error fetching problem statements:", error?.message);
    return [];
  }

  if (statements.length === 0) return [];

  const statementIds = statements.map((s) => s.id);

  // 2. Fetch votes for these statements
  const { data: votes } = await supabase
    .from("problem_votes")
    .select("problem_id, user_id")
    .in("problem_id", statementIds);

  const voteCountMap = new Map<string, number>();
  const userVotedSet = new Set<string>();

  if (votes) {
    votes.forEach((v) => {
      voteCountMap.set(v.problem_id, (voteCountMap.get(v.problem_id) || 0) + 1);
      if (v.user_id === user.id) {
        userVotedSet.add(v.problem_id);
      }
    });
  }

  const enriched: ProblemStatement[] = statements.map((s) => ({
    ...s,
    vote_count: voteCountMap.get(s.id) || 0,
    has_voted: userVotedSet.has(s.id),
  }));

  // Sort: selected first, then by vote count descending
  enriched.sort((a, b) => {
    if (a.is_selected && !b.is_selected) return -1;
    if (!a.is_selected && b.is_selected) return 1;
    return (b.vote_count || 0) - (a.vote_count || 0);
  });

  return enriched;
}
