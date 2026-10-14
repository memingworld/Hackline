"use client";

import * as React from "react";
import { Team, TeamMember } from "@/types/database";
import {
  Users,
  Copy,
  Check,
  Crown,
  RefreshCw,
  UserMinus,
  Edit2,
  Share2,
  MessageCircle,
  ExternalLink,
  Shield,
  Plus,
  Minus,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  updateMemberDuty,
  removeMemberFromTeam,
  regenerateInviteCode,
  updateTeamCapacity,
} from "@/lib/actions/squads";

interface ActiveSquadRosterProps {
  team: Team | null;
  currentUserId?: string;
  onOpenCreateSquadModal?: () => void;
  onOpenJoinModal?: () => void;
}

const COMMON_DUTIES = [
  "Next.js Frontend",
  "FastAPI Backend",
  "AI / LLM Lead",
  "Pitch Deck & UI",
  "Full-Stack Developer",
  "DevOps & Cloud",
];

export function ActiveSquadRoster({
  team,
  currentUserId,
  onOpenCreateSquadModal,
  onOpenJoinModal,
}: ActiveSquadRosterProps) {
  const [copied, setCopied] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(null);
  const [selectedDuty, setSelectedDuty] = React.useState("");
  const [isUpdatingDuty, setIsUpdatingDuty] = React.useState(false);
  const [removingMemberId, setRemovingMemberId] = React.useState<string | null>(null);

  if (!team) {
    return (
      <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl">
        <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-8 flex flex-col items-center justify-center text-center min-h-[320px]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/5">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            No Active Squad Assembled
          </h3>
          <p className="mt-2 text-xs text-zinc-400 max-w-sm leading-relaxed">
            Form your 4-person dream crew for your upcoming hackathon or deploy one of your saved squad presets.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {onOpenCreateSquadModal && (
              <Button
                size="sm"
                variant="primary"
                onClick={onOpenCreateSquadModal}
                className="rounded-xl text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Saved Preset</span>
              </Button>
            )}
            {onOpenJoinModal && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenJoinModal}
                className="rounded-xl text-xs gap-1.5"
              >
                <span>Join with Code</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isCaptain = team.captain_id === currentUserId;
  const members = team.members || [];
  const membersCount = members.length;
  const minAllowed = team.hackathon?.min_team_size || 1;
  const maxAllowed = team.hackathon?.max_team_size || 6;
  const maxSlots = team.max_members || team.hackathon?.max_team_size || 4;
  const openSlotsCount = Math.max(0, maxSlots - membersCount);
  const [isUpdatingCapacity, setIsUpdatingCapacity] = React.useState(false);

  const handleAdjustCapacity = async (delta: number) => {
    const newCap = maxSlots + delta;
    if (newCap < membersCount) {
      toast.error(`Cannot reduce squad capacity below current member count (${membersCount}).`);
      return;
    }
    if (newCap < minAllowed || newCap > maxAllowed) {
      toast.error(`Team size must be between ${minAllowed} and ${maxAllowed} members for this hackathon.`);
      return;
    }
    setIsUpdatingCapacity(true);
    try {
      const res = await updateTeamCapacity(team.id, newCap);
      if (res.success) {
        toast.success(`Squad capacity updated to ${newCap} members.`);
      } else {
        toast.error(res.error || "Failed to update capacity");
      }
    } catch {
      toast.error("Error updating capacity");
    } finally {
      setIsUpdatingCapacity(false);
    }
  };

  const getInviteUrl = () => {
    if (typeof window === "undefined") return `/join/${team.invite_code}`;
    return `${window.location.origin}/join/${team.invite_code}`;
  };

  const handleCopyInvite = () => {
    const inviteLink = getInviteUrl();
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Squad invite link copied!", {
      description: `Share this link to onboard a teammate into ${team.name}.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = async () => {
    setIsRegenerating(true);
    try {
      const res = await regenerateInviteCode(team.id);
      if (res.success) {
        toast.success("Invite code refreshed!", {
          description: "Previous invite links have been invalidated.",
        });
      } else {
        toast.error("Failed to regenerate code", { description: res.error });
      }
    } catch {
      toast.error("Error refreshing code");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveDuty = async (memberId: string) => {
    if (!selectedDuty.trim()) return;
    setIsUpdatingDuty(true);
    try {
      const res = await updateMemberDuty(memberId, selectedDuty);
      if (res.success) {
        toast.success("Duty assignment updated");
        setEditingMemberId(null);
      } else {
        toast.error("Failed to update duty", { description: res.error });
      }
    } catch {
      toast.error("Error updating duty");
    } finally {
      setIsUpdatingDuty(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this squad?`)) {
      return;
    }
    setRemovingMemberId(memberId);
    try {
      const res = await removeMemberFromTeam(memberId);
      if (res.success) {
        toast.success(`${memberName} removed from squad roster.`);
      } else {
        toast.error("Failed to remove member", { description: res.error });
      }
    } catch {
      toast.error("Error removing member");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Join our hackathon squad "${team.name}" on Hackline! Accept invite: ${getInviteUrl()}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleShareTelegram = () => {
    const url = encodeURIComponent(getInviteUrl());
    const text = encodeURIComponent(`Join our hackathon squad "${team.name}" on Hackline!`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  return (
    <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl">
      <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-6 md:p-8">
        {/* Header & Meta */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">{team.name}</h2>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    {membersCount}/{maxSlots} {membersCount >= maxSlots ? "Full Roster" : "Recruiting"}
                  </span>

                  {isCaptain && (
                    <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800 rounded-lg p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleAdjustCapacity(-1)}
                        disabled={isUpdatingCapacity || maxSlots <= minAllowed || maxSlots <= membersCount}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Reduce squad capacity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-1.5 font-mono text-[11px] text-zinc-300">
                        Cap: {maxSlots}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdjustCapacity(1)}
                        disabled={isUpdatingCapacity || maxSlots >= maxAllowed}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Increase squad capacity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Assigned Hackathon:{" "}
                  <span className="text-zinc-200 font-medium">
                    {team.hackathon?.title || "Active Hackathon"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Invite Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInvite}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-zinc-400" />
              )}
              <span>{copied ? "Copied" : "Copy Invite Link"}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              title="Share on WhatsApp"
              className="p-2 h-9 w-9 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-emerald-950/40 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
            </button>

            <button
              onClick={handleShareTelegram}
              title="Share on Telegram"
              className="p-2 h-9 w-9 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-sky-950/40 hover:border-sky-500/30 text-zinc-400 hover:text-sky-400 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>

            {isCaptain && (
              <button
                onClick={handleRegenerateCode}
                disabled={isRegenerating}
                title="Regenerate invite link"
                className="p-2 h-9 w-9 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRegenerating ? "animate-spin text-indigo-400" : ""}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* 4-Person Roster Grid */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
              Squad Lineup & Role Specializations
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              Invite Code:{" "}
              <code className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                {team.invite_code}
              </code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Active Members */}
            {members.map((member) => {
              const isLead = member.is_captain;
              const isCurrentMember = member.user_id === currentUserId;
              const canEditThisMember = isCaptain || isCurrentMember;
              const isCurrentlyEditing = editingMemberId === member.id;

              return (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl border border-zinc-800/90 bg-zinc-950/60 hover:border-zinc-700/80 transition-all flex flex-col justify-between min-h-[110px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 font-mono text-sm font-bold text-white shadow-sm">
                          {member.user?.full_name?.substring(0, 2).toUpperCase() || "MB"}
                        </div>
                        {isLead && (
                          <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-black shadow-md">
                            <Crown className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {member.user?.full_name || "Teammate"}
                          </span>
                          {isLead && (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                              Captain
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500 font-mono block">
                          {member.user?.email || "Authenticated Member"}
                        </span>
                      </div>
                    </div>

                    {/* Member action icons */}
                    <div className="flex items-center gap-1">
                      {canEditThisMember && !isCurrentlyEditing && (
                        <button
                          onClick={() => {
                            setEditingMemberId(member.id);
                            setSelectedDuty(member.duty);
                          }}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                          title="Edit role/duty"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {isCaptain && !isLead && (
                        <button
                          onClick={() =>
                            handleRemoveMember(
                              member.id,
                              member.user?.full_name || "this teammate"
                            )
                          }
                          disabled={removingMemberId === member.id}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Remove from squad"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Duty Section */}
                  <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center justify-between">
                    {isCurrentlyEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <select
                          value={selectedDuty}
                          onChange={(e) => setSelectedDuty(e.target.value)}
                          className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1"
                        >
                          {COMMON_DUTIES.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSaveDuty(member.id)}
                          disabled={isUpdatingDuty}
                          className="h-8 px-2.5 text-[11px] rounded-lg"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingMemberId(null)}
                          className="h-8 px-2 text-[11px] rounded-lg"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-[11px] text-zinc-500 font-mono">Assigned Role:</span>
                        <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                          {member.duty}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: openSlotsCount }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="p-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20 flex flex-col items-center justify-center text-center min-h-[110px] hover:border-zinc-700/80 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 mb-2">
                  <Users className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  Open Slot #{membersCount + idx + 1}
                </span>
                <button
                  onClick={handleCopyInvite}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy Invite Link</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
