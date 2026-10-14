"use client";

import * as React from "react";
import { Team } from "@/types/database";
import {
  Users,
  Copy,
  Check,
  Crown,
  UserPlus,
  ShieldAlert,
  ArrowRight,
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
      <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl h-full flex flex-col justify-between">
        <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            No Active Squad Assembled
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-xs leading-relaxed">
            Form your 4-person dream crew or deploy a saved recurring squad with pre-assigned duties.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Link href="/dashboard/squad?action=create">
              <Button size="sm" variant="primary" className="rounded-xl text-xs gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                <span>Create Squad</span>
              </Button>
            </Link>
            <Link href="/dashboard/squad?action=join">
              <Button size="sm" variant="outline" className="rounded-xl text-xs">
                <span>Join with Code</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyInvite = () => {
    const inviteLink = `${window.location.origin}/join/${team.invite_code}`;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Squad invite link copied!", {
      description: `Share ${inviteLink} to onboard a teammate directly into ${team.name}.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const membersCount = team.members?.length || 0;

  return (
    <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl h-full flex flex-col justify-between">
      <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-6 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{team.name}</span>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                    {membersCount}/4 {membersCount >= 4 ? "Locked" : "Slots Available"}
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Duty Assignments Active
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyInvite}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800 text-[11px] font-medium text-zinc-300 transition-colors"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3 text-zinc-400" />
              )}
              <span>{copied ? "Copied" : "Invite Link"}</span>
            </button>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {team.members && team.members.length > 0 ? (
              team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 hover:bg-zinc-950 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/60 font-mono text-xs font-bold text-zinc-200">
                        {member.user?.full_name?.substring(0, 2).toUpperCase() || "MB"}
                      </div>
                      {member.is_captain && (
                        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-black shadow-sm">
                          <Crown className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {member.user?.full_name || "Squad Member"}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {member.user?.email || "Pending verification"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block text-[11px] font-mono px-2 py-0.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 font-medium">
                      {member.duty}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                No members joined yet. Share your invite code: <span className="font-mono text-indigo-400">{team.invite_code}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Quick Action */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <span className="text-[11px] font-mono">Code: {team.invite_code}</span>
          <Link
            href="/dashboard/squad"
            className="text-indigo-400 text-[11px] hover:underline"
          >
            Manage Squad Duties
          </Link>
        </div>
      </div>
    </div>
  );
}
