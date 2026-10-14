"use client";

import * as React from "react";
import { Team, Asset } from "@/types/database";
import { AssetsManager } from "./AssetsManager";
import { Users, FolderGit2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MultiTeamAssetsViewProps {
  teams: (Team & { assets: Asset[] })[];
}

export function MultiTeamAssetsView({ teams }: MultiTeamAssetsViewProps) {
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>(
    () => teams[0]?.id || ""
  );

  React.useEffect(() => {
    if (teams.length > 0 && !teams.some((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  if (teams.length === 0) {
    return (
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-8 flex flex-col items-center justify-center text-center min-h-[300px] shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 mb-3">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">No Active Squad Assigned</h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-sm">
          Deliverables and assets are scoped to your active hackathon squad. Create or join a team first to link repositories and slide decks.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <Link href="/dashboard/squad">
            <Button size="sm" variant="primary" className="rounded-xl text-xs gap-1.5">
              <span>Go to Squad Management</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  return (
    <div className="space-y-6">
      {/* Team Tabs when user has multiple squads */}
      {teams.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-850">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mr-1">
            Squad Sprints:
          </span>
          {teams.map((t) => {
            const isSelected = t.id === selectedTeam.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTeamId(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium shrink-0 transition-all flex items-center gap-2 ${
                  isSelected
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>{t.name}</span>
                {t.hackathon && (
                  <span className="text-[10px] opacity-70 border-l border-zinc-700 pl-2">
                    {t.hackathon.title}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Team Context Badge */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="text-zinc-500">Squad:</span>
          <span className="text-white font-medium">{selectedTeam.name}</span>
          {selectedTeam.hackathon && (
            <span className="text-[10px] px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
              {selectedTeam.hackathon.title}
            </span>
          )}
        </div>
      </div>

      <AssetsManager
        assets={selectedTeam.assets || []}
        teamId={selectedTeam.id}
        hackathonId={selectedTeam.hackathon_id}
      />
    </div>
  );
}
