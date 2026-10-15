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
  ExternalLink,
  Shield,
  Plus,
  Minus,
  Sparkles,
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
  const [isUpdatingCapacity, setIsUpdatingCapacity] = React.useState(false);

  if (!team) {
    return (
      <div className="rounded-2xl border border-dashed border-[rgba(229,169,60,0.25)] bg-[#181410] p-8 flex flex-col items-center justify-center text-center min-h-[260px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] mb-3.5 shadow-md">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-[#fef3c7] tracking-tight font-mono">
          No Active Squad Assembled
        </h3>
        <p className="mt-2 text-xs text-[#a89a8c] max-w-sm leading-relaxed">
          Form your dream crew for your upcoming hackathon or deploy one of your saved squad presets.
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
    );
  }

  const isCaptain = team.captain_id === currentUserId;
  const members = team.members || [];
  const membersCount = members.length;
  const minAllowed = team.hackathon?.min_team_size || 1;
  const maxAllowed = team.hackathon?.max_team_size || 6;
  const maxSlots = team.max_members || team.hackathon?.max_team_size || 4;
  const openSlotsCount = Math.max(0, maxSlots - membersCount);

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
      const res = await updateMemberDuty(memberId, selectedDuty, team.id);
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
      const res = await removeMemberFromTeam(memberId, team.id);
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

  const handleShareTelegram = () => {
    const url = encodeURIComponent(getInviteUrl());
    const text = encodeURIComponent(`Join our hackathon squad "${team.name}" on Hackline!`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  return (
    <div className="rounded-2xl border border-[rgba(229,169,60,0.20)] bg-[#1f1b16] p-5 sm:p-7 shadow-xl">
      {/* Header & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[rgba(229,169,60,0.15)]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-[#fef3c7] tracking-tight">{team.name}</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#e5a93c]/35 bg-[#e5a93c]/15 text-[#e5a93c]">
                  {membersCount}/{maxSlots} {membersCount >= maxSlots ? "Full Roster" : "Recruiting"}
                </span>

                {isCaptain && (
                  <div className="flex items-center gap-1 bg-[#181410] border border-[rgba(229,169,60,0.20)] rounded-lg p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleAdjustCapacity(-1)}
                      disabled={isUpdatingCapacity || maxSlots <= minAllowed || maxSlots <= membersCount}
                      className="p-1 rounded hover:bg-[#28231d] text-[#a89a8c] hover:text-[#fef3c7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Reduce squad capacity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-1.5 font-mono text-[11px] text-[#fef3c7]">
                      Cap: {maxSlots}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustCapacity(1)}
                      disabled={isUpdatingCapacity || maxSlots >= maxAllowed}
                      className="p-1 rounded hover:bg-[#28231d] text-[#a89a8c] hover:text-[#fef3c7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Increase squad capacity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#a89a8c] mt-0.5 font-mono">
                Sprint Workspace:{" "}
                <span className="text-[#fef3c7] font-medium">
                  {team.hackathon?.title || "Active Hackathon"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Invite Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyInvite}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[rgba(229,169,60,0.22)] bg-[#28231d] hover:bg-[#332c25] hover:border-[#e5a93c]/40 text-xs font-medium text-[#fef3c7] transition-all active:scale-[0.98]"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#e5a93c]" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-[#e5a93c]" />
            )}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </button>

          <button
            type="button"
            onClick={handleShareTelegram}
            title="Share on Telegram"
            className="p-1.5 h-8 w-8 flex items-center justify-center rounded-xl border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 hover:bg-[#4a82a6]/25 text-[#7bb4d6] transition-all active:scale-[0.98]"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>

          {isCaptain && (
            <button
              type="button"
              onClick={handleRegenerateCode}
              disabled={isRegenerating}
              title="Regenerate invite link"
              className="p-1.5 h-8 w-8 flex items-center justify-center rounded-xl border border-[rgba(229,169,60,0.22)] bg-[#28231d] hover:bg-[#332c25] hover:border-[#e5a93c]/40 text-[#a89a8c] hover:text-[#fef3c7] transition-all active:scale-[0.98]"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin text-[#e5a93c]" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Roster Section */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-xs font-semibold text-[#a89a8c] uppercase tracking-wider font-mono">
            Lineup & Role Specializations
          </span>
          <span className="text-xs text-[#a89a8c] font-mono">
            Invite Code:{" "}
            <code className="text-[#e5a93c] bg-[#e5a93c]/10 px-2 py-0.5 rounded border border-[#e5a93c]/25 font-bold">
              {team.invite_code}
            </code>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Active and Reserved Members */}
          {members.map((member) => {
            const isLead = member.is_captain;
            const isReserved = !!member.is_reserved;
            const isCurrentMember = !isReserved && member.user_id === currentUserId;
            const canEditThisMember = isCaptain || isCurrentMember;
            const isCurrentlyEditing = editingMemberId === member.id;
            const displayName = member.placeholder_name || member.user?.full_name || "Teammate";
            const displayEmail = member.placeholder_email || member.user?.email || "Pending Auth";
            const initials = displayName.substring(0, 2).toUpperCase() || "MB";

            return (
              <div
                key={member.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[120px] ${
                  isReserved
                    ? "border-[rgba(229,169,60,0.30)] bg-[#28231d]/60 hover:border-[#e5a93c]/50"
                    : "border-[rgba(229,169,60,0.18)] bg-[#181410] hover:border-[rgba(229,169,60,0.35)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {member.user?.avatar_url ? (
                        <img
                          src={member.user.avatar_url}
                          alt={displayName}
                          className="h-11 w-11 rounded-xl object-cover border border-[rgba(229,169,60,0.25)] shadow-md"
                        />
                      ) : (
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl font-mono text-xs font-black shadow-md ${
                            isReserved
                              ? "bg-[#28231d] border border-[rgba(229,169,60,0.35)] text-[#e5a93c]"
                              : "bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#fef3c7]"
                          }`}
                        >
                          {initials}
                        </div>
                      )}
                      {isLead && (
                        <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#e5a93c] text-[#14110e] shadow-md ring-2 ring-[#1f1b16]">
                          <Crown className="h-2.5 w-2.5 fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-[#fef3c7] truncate">
                          {displayName}
                        </span>
                        {isLead && (
                          <span className="text-[9px] font-mono font-bold text-[#e5a93c] bg-[#e5a93c]/15 border border-[#e5a93c]/30 px-1.5 py-0.2 rounded">
                            Captain
                          </span>
                        )}
                        {isReserved && (
                          <span className="text-[9px] font-mono text-[#e5a93c] bg-[#e5a93c]/15 border border-[#e5a93c]/30 px-1.5 py-0.2 rounded">
                            Reserved
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#a89a8c] font-mono block truncate">
                        {displayEmail} {isReserved ? "(Unclaimed)" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Member action icons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isReserved && (
                      <button
                        type="button"
                        onClick={() => {
                          handleCopyInvite();
                          toast.info(`Invite link copied! Share with ${displayName} to claim their reserved seat.`);
                        }}
                        className="p-1 rounded-lg text-[#e5a93c] hover:bg-[#e5a93c]/10 transition-colors"
                        title={`Copy invite link for ${displayName}`}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                    {canEditThisMember && !isCurrentlyEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMemberId(member.id);
                          setSelectedDuty(member.duty);
                        }}
                        className="p-1 rounded-lg text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d] transition-colors"
                        title="Edit role/duty"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                    {isCaptain && !isLead && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveMember(
                            member.id,
                            displayName
                          )
                        }
                        disabled={removingMemberId === member.id}
                        className="p-1 rounded-lg text-[#a89a8c] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title={isReserved ? "Release reserved seat" : "Remove from squad"}
                      >
                        <UserMinus className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Duty Section */}
                <div className="mt-3 pt-2.5 border-t border-[rgba(229,169,60,0.12)] flex items-center justify-between gap-2">
                  {isCurrentlyEditing ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <select
                        value={selectedDuty}
                        onChange={(e) => setSelectedDuty(e.target.value)}
                        className="h-7 rounded-lg border border-[rgba(229,169,60,0.25)] bg-[#181410] px-2 text-[11px] text-[#fef3c7] focus:outline-none focus:border-[#e5a93c] flex-1 font-mono"
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
                        className="h-7 px-2 text-[10px] rounded-lg"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingMemberId(null)}
                        className="h-7 px-1.5 text-[10px] rounded-lg text-[#a89a8c]"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] text-[#a89a8c] font-mono">Assigned Role:</span>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6] truncate max-w-[180px]">
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
              className="p-4 rounded-xl border border-dashed border-[rgba(229,169,60,0.22)] bg-[#181410]/50 flex flex-col items-center justify-center text-center min-h-[120px] hover:border-[rgba(229,169,60,0.40)] transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.20)] text-[#a89a8c] mb-2">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-[#a89a8c] font-mono">
                Open Slot #{membersCount + idx + 1}
              </span>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-mono text-[#e5a93c] hover:underline transition-colors"
              >
                <Copy className="h-3 w-3" />
                <span>Copy Invite Link</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
