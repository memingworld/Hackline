import * as React from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserAllTeams } from "@/lib/data/squads";
import { getTeamAssets } from "@/lib/data/assets";
import { MultiTeamAssetsView } from "@/components/assets/MultiTeamAssetsView";

export const metadata: Metadata = {
  title: "Asset Hub | Hackline Command Center",
  description: "Centralized repository for GitHub links, Figma boards, slide decks, and demo videos.",
};

export default async function AssetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const allTeams = await getUserAllTeams();

  // Fetch assets for all user teams
  const teamsWithAssets = await Promise.all(
    allTeams.map(async (team) => {
      const assets = await getTeamAssets(team.id);
      return {
        ...team,
        assets,
      };
    })
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Asset Hub & Deliverables
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300">
              Live Roster Assets
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 max-w-xl">
            Keep your repositories, design prototypes, pitch decks, and walkthrough videos unified and instantly accessible to the team.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <MultiTeamAssetsView teams={teamsWithAssets} />
    </div>
  );
}
