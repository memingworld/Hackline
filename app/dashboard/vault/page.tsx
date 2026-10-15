import * as React from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserAllTeams } from "@/lib/data/squads";
import { getTeamProblemStatements } from "@/lib/data/vault";
import { MultiTeamVaultView } from "@/components/vault/MultiTeamVaultView";

export const metadata: Metadata = {
  title: "Idea Vault | Hackline Command Center",
  description: "Track problem statements, align on hackathon tracks, and conduct team blind voting.",
};

export default async function IdeaVaultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const allTeams = await getUserAllTeams();

  // Fetch problem statements for all user teams
  const teamsWithStatements = await Promise.all(
    allTeams.map(async (team) => {
      const statements = await getTeamProblemStatements(team.id);
      return {
        ...team,
        statements,
      };
    })
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[rgba(229,169,60,0.18)]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-[#fef3c7]">
              Idea Vault & Track Voting
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-[rgba(229,169,60,0.3)] bg-[#e5a93c]/15 text-[#e5a93c] font-semibold">
              Blind Voting Active
            </span>
          </div>
          <p className="mt-1 text-xs text-[#a89a8c] max-w-xl">
            Propose problem statements, debate technical feasibility, and conduct consensus voting to lock in your winning sprint submission.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <MultiTeamVaultView teams={teamsWithStatements} currentUserId={user.id} />
    </div>
  );
}
