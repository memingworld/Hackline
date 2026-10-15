"use client";

import * as React from "react";
import { Team, ProblemStatement } from "@/types/database";
import { VaultManager } from "./VaultManager";
import { Users, Lightbulb } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MultiTeamVaultViewProps {
  teams: (Team & { statements: ProblemStatement[] })[];
  currentUserId: string;
}

export function MultiTeamVaultView({
  teams,
  currentUserId,
}: MultiTeamVaultViewProps) {
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
      <div className="rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.2)] p-8 flex flex-col items-center justify-center text-center min-h-[300px] shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] mb-3">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-[#fef3c7]">No Active Squad Assigned</h3>
        <p className="mt-1 text-xs text-[#a89a8c] max-w-sm">
          Idea Vault is collaborative and tied to your hackathon squad. Create or join a team first to start proposing and voting on ideas.
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
  const isCaptain = selectedTeam.captain_id === currentUserId;

  return (
    <div className="space-y-6">
      {/* Team Tabs when user has multiple squads */}
      {teams.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[rgba(229,169,60,0.15)]">
          <span className="text-[11px] font-mono text-[#a89a8c] uppercase tracking-wider mr-1 shrink-0">
            Sprint Ideas:
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
                    ? "bg-[#e5a93c]/20 text-[#e5a93c] border border-[rgba(229,169,60,0.35)] font-semibold shadow-sm"
                    : "text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d] border border-transparent"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>{t.name}</span>
                {t.hackathon && (
                  <span className="text-[10px] opacity-75 border-l border-[rgba(229,169,60,0.2)] pl-2">
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
        <div className="flex items-center gap-2 text-xs font-mono text-[#a89a8c]">
          <span className="text-[#a89a8c]/70">Squad:</span>
          <span className="text-[#fef3c7] font-medium">{selectedTeam.name}</span>
          {selectedTeam.hackathon && (
            <span className="text-[10px] px-2 py-0.5 rounded border border-[rgba(229,169,60,0.2)] bg-[#181410] text-[#fef3c7]">
              {selectedTeam.hackathon.title}
            </span>
          )}
        </div>
      </div>

      <VaultManager
        statements={selectedTeam.statements || []}
        teamId={selectedTeam.id}
        hackathonId={selectedTeam.hackathon_id}
        isCaptain={isCaptain}
        currentUserId={currentUserId}
      />
    </div>
  );
}
