"use client";

import * as React from "react";
import { Team, SubmissionChecklistItem } from "@/types/database";
import { ActiveSquadRoster } from "./ActiveSquadRoster";
import { PreFlightGateManager } from "./PreFlightGateManager";
import { Users, ShieldCheck, Trophy, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MultiSquadManagerProps {
  teams: (Team & { checklistItems?: SubmissionChecklistItem[] })[];
  currentUserId: string;
}

export function MultiSquadManager({
  teams,
  currentUserId,
}: MultiSquadManagerProps) {
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
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 flex flex-col items-center justify-center text-center min-h-[260px]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 mb-3">
          <Users className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-white tracking-tight">
          No Active Hackathon Squads Yet
        </h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-sm leading-relaxed">
          When you import or register a hackathon sprint, your squad roster will automatically initialize here.
        </p>
        <div className="mt-5">
          <Link href="/dashboard/hackathons?action=scrape">
            <Button size="sm" variant="primary" className="rounded-xl text-xs gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Import Sprint via Magic Link</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
  const isCaptain = selectedTeam.captain_id === currentUserId;

  return (
    <div className="space-y-6">
      {/* Multi-Team Selector Tabs (when user belongs to >1 squad) */}
      {teams.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-850">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider mr-1">
            Active Squads:
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

      {/* Active Team Context Banner */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            {selectedTeam.name}
          </h3>
          {selectedTeam.hackathon && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
              {selectedTeam.hackathon.title}
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-500 font-mono">
          {selectedTeam.members?.length || 1} / {selectedTeam.max_members || 4} Members
        </span>
      </div>

      {/* Roster Widget */}
      <ActiveSquadRoster team={selectedTeam} currentUserId={currentUserId} />

      {/* Pre-Flight Checklist for this squad */}
      <div className="pt-4 border-t border-zinc-900">
        <PreFlightGateManager
          activeTeam={selectedTeam}
          checklistItems={selectedTeam.checklistItems || []}
          isCaptain={isCaptain}
        />
      </div>
    </div>
  );
}
