"use client";

import * as React from "react";
import { Team } from "@/types/database";
import {
  Users,
  Copy,
  Check,
  Crown,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SquadProps {
  team: Team | null;
}

export function SquadRosterWidget({ team }: SquadProps) {
  const [copied, setCopied] = React.useState(false);

  if (!team) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700/80 text-zinc-300 mb-3">
          <Users className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-tight">
          No Active Squad Linked
        </h3>
        <p className="mt-1 text-xs text-zinc-400 max-w-xs leading-relaxed">
          Assemble your hackathon crew or deploy a saved recurring squad with pre-assigned duties.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Link href="/dashboard/squad?action=create">
            <Button size="sm" variant="primary" className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create Squad</span>
            </Button>
          </Link>
          <Link href="/dashboard/squad?action=join">
            <Button size="sm" variant="outline">
              <span>Join with Code</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyInvite = () => {
    const inviteLink = `${window.location.origin}/join/${team.invite_code}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Squad invite link copied!", {
      description: `Share link to onboard a teammate into ${team.name}.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const maxSlots = team.max_members || team.hackathon?.max_team_size || 4;
  const membersCount = team.members?.length || 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>{team.name}</span>
                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.2 rounded">
                  {membersCount}/{maxSlots} {membersCount >= maxSlots ? "Full" : "Slots"}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Assigned Squad Roster
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyInvite}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-[11px] font-medium text-zinc-300 transition-colors"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 text-zinc-400" />
            )}
            <span>{copied ? "Copied" : "Invite"}</span>
          </button>
        </div>

        {/* Members List */}
        <div className="space-y-2.5">
          {team.members && team.members.length > 0 ? (
            team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-xs font-bold text-zinc-200">
                      {member.user?.full_name?.substring(0, 2).toUpperCase() || "MB"}
                    </div>
                    {member.is_captain && (
                      <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-zinc-950 shadow-sm">
                        <Crown className="h-2 w-2" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white block truncate">
                      {member.user?.full_name || "Squad Member"}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono block truncate">
                      {member.user?.email || "Teammate"}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-300">
                    {member.duty}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
              No members joined yet. Code: <span className="font-mono text-white">{team.invite_code}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Meta */}
      <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
        <span className="text-[11px] font-mono">Invite Code: {team.invite_code}</span>
        <Link
          href="/dashboard/squad"
          className="text-white hover:underline text-[11px] font-medium"
        >
          Manage Roles &rarr;
        </Link>
      </div>
    </div>
  );
}
