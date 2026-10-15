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
      <div className="rounded-2xl border border-dashed border-[rgba(229,169,60,0.22)] bg-[#181410] p-8 flex flex-col items-center justify-center text-center min-h-[260px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] mb-3.5 shadow-md">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-[#fef3c7] tracking-tight font-mono">
          No Active Hackathon Squads Yet
        </h3>
        <p className="mt-2 text-xs text-[#a89a8c] max-w-sm leading-relaxed">
          When you import or register a hackathon sprint, your squad roster will automatically initialize here.
        </p>
        <div className="mt-6">
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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[rgba(229,169,60,0.15)]">
          <span className="text-[11px] font-mono text-[#a89a8c] uppercase tracking-wider mr-1 shrink-0">
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
                    ? "bg-[#e5a93c]/15 text-[#fef3c7] border border-[#e5a93c]/40 font-semibold shadow-sm"
                    : "text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d] border border-transparent"
                }`}
              >
                <Users className={`h-3.5 w-3.5 ${isSelected ? "text-[#e5a93c]" : "text-[#a89a8c]"}`} />
                <span>{t.name}</span>
                {t.hackathon && (
                  <span className="text-[10px] opacity-75 border-l border-[rgba(229,169,60,0.20)] pl-2 text-[#a89a8c]">
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
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="h-2 w-2 rounded-full bg-[#e5a93c] shadow-[0_0_8px_rgba(229,169,60,0.8)] animate-pulse" />
          <h3 className="text-sm font-bold text-[#fef3c7] uppercase tracking-wider font-mono">
            {selectedTeam.name}
          </h3>
          {selectedTeam.hackathon && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6]">
              {selectedTeam.hackathon.title}
            </span>
          )}
        </div>
        <span className="text-xs text-[#a89a8c] font-mono">
          {selectedTeam.members?.length || 1} / {selectedTeam.max_members || 4} Members
        </span>
      </div>

      {/* Roster Widget */}
      <ActiveSquadRoster team={selectedTeam} currentUserId={currentUserId} />

      {/* Pre-Flight Checklist for this squad */}
      <div className="pt-4 border-t border-[rgba(229,169,60,0.15)]">
        <PreFlightGateManager
          activeTeam={selectedTeam}
          checklistItems={selectedTeam.checklistItems || []}
          isCaptain={isCaptain}
        />
      </div>
    </div>
  );
}
