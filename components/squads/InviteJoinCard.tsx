"use client";

import * as React from "react";
import { InviteTeamDetails } from "@/types/database";
import {
  Users,
  Trophy,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Crown,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { joinTeamByInviteCode } from "@/lib/actions/squads";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPlatformName } from "@/lib/utils";

interface InviteJoinCardProps {
  team: InviteTeamDetails;
  isAuthenticated: boolean;
  currentUserId?: string;
}

const COMMON_DUTIES = [
  "Next.js Frontend",
  "FastAPI Backend",
  "AI / LLM Lead",
  "Pitch Deck & UI",
  "Full-Stack Developer",
  "DevOps & Cloud",
];

export function InviteJoinCard({
  team,
  isAuthenticated,
  currentUserId,
}: InviteJoinCardProps) {
  const router = useRouter();
  const [selectedDuty, setSelectedDuty] = React.useState("Full-Stack Developer");
  const [customDuty, setCustomDuty] = React.useState("");
  const [isCustom, setIsCustom] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const members = team.members || [];
  const membersCount = members.length;
  const maxSlots = team.max_members || team.hackathon?.max_team_size || 4;
  const isFull = membersCount >= maxSlots;
  const isAlreadyMember = Boolean(
    currentUserId && members.some((m) => m.user_id === currentUserId)
  );

  const finalDuty = isCustom ? customDuty : selectedDuty;

  const handleJoin = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/join/${team.invite_code}`);
      return;
    }

    if (!finalDuty.trim()) {
      toast.error("Please choose or specify your hackathon duty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await joinTeamByInviteCode(team.invite_code, finalDuty);
      if (res.success) {
        toast.success(`You are now part of ${team.name}!`, {
          description: "Redirecting to your Hackline Command Center...",
        });
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      } else {
        toast.error("Could not join squad", {
          description: res.error,
        });
      }
    } catch {
      toast.error("An error occurred while joining the squad.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-[#1f1b16] border border-[rgba(229,169,60,0.22)] p-6 sm:p-10 shadow-2xl relative text-[#fef3c7]">
      <div>
        {/* Hackathon Badge & Platform */}
        <div className="flex items-center justify-between pb-6 border-b border-[rgba(229,169,60,0.18)]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#e5a93c] animate-pulse" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#e5a93c]">
              Official Squad Invitation
            </span>
          </div>
          <span translate="no" className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-steel/35 bg-steel/15 text-steel font-semibold notranslate">
            {formatPlatformName(team.hackathon.source_platform)}
          </span>
        </div>

        {/* Hackathon & Squad Title */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[#a89a8c]">
            <Trophy className="h-4 w-4 text-[#e5a93c]" />
            <span className="line-clamp-1">{team.hackathon.title}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fef3c7]">
            Join <span className="text-[#e5a93c] font-mono">{team.name}</span>
          </h1>

          {team.description && (
            <p className="text-xs sm:text-sm text-[#a89a8c] leading-relaxed pt-1">
              {team.description}
            </p>
          )}
        </div>

        {/* Dynamic Roster Status */}
        <div className="mt-6 p-4 rounded-2xl border border-[rgba(229,169,60,0.2)] bg-[#181410]">
          <div className="flex items-center justify-between text-xs mb-3 font-mono">
            <span className="text-[#a89a8c]">Squad Roster ({membersCount}/{maxSlots})</span>
            <span
              className={
                isFull
                  ? "text-[#e06c75] font-bold"
                  : "text-[#e5a93c] font-medium"
              }
            >
              {isFull ? "Roster Full" : `${maxSlots - membersCount} Spot(s) Open`}
            </span>
          </div>

          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-[rgba(229,169,60,0.2)] bg-[#28231d] text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1f1b16] border border-[rgba(229,169,60,0.25)] text-[10px] font-mono font-bold text-[#fef3c7]">
                      {member.user.full_name?.substring(0, 2).toUpperCase() || "MB"}
                    </div>
                    {member.is_captain && (
                      <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#e5a93c] text-[#14110e]">
                        <Crown className="h-2 w-2" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-[#fef3c7] block">
                      {member.user.full_name || "Teammate"}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#7bb4d6] bg-[#4a82a6]/15 border border-[rgba(74,130,166,0.35)] px-2 py-0.5 rounded-md font-medium">
                  {member.duty}
                </span>
              </div>
            ))}

            {Array.from({ length: Math.max(0, maxSlots - membersCount) }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-center p-2 rounded-xl border border-dashed border-[rgba(229,169,60,0.3)] bg-transparent text-xs text-[#a89a8c] font-mono"
              >
                + Open Slot #{membersCount + i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Role Selector */}
        {!isAlreadyMember && !isFull && (
          <div className="mt-6 space-y-3">
            <label className="text-xs font-semibold text-[#fef3c7] font-mono uppercase tracking-wider block">
              Claim Your Specialized Hackathon Duty:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_DUTIES.map((duty) => (
                <button
                  key={duty}
                  type="button"
                  onClick={() => {
                    setSelectedDuty(duty);
                    setIsCustom(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs font-mono transition-all ${
                    !isCustom && selectedDuty === duty
                      ? "border-[#e5a93c] bg-[#e5a93c]/20 text-[#e5a93c] font-semibold shadow-sm"
                      : "border-[rgba(229,169,60,0.2)] bg-[#181410] text-[#a89a8c] hover:border-[rgba(229,169,60,0.35)] hover:text-[#fef3c7]"
                  }`}
                >
                  {duty}
                </button>
              ))}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-[11px] font-mono text-[#e5a93c] hover:text-[#d99b2e] transition-colors"
              >
                {isCustom ? "Select from common roles" : "Or define a custom role..."}
              </button>
              {isCustom && (
                <input
                  type="text"
                  value={customDuty}
                  onChange={(e) => setCustomDuty(e.target.value)}
                  placeholder="e.g. Smart Contract Architect"
                  className="mt-2 w-full h-10 rounded-xl border border-[rgba(229,169,60,0.2)] bg-[#181410] px-3 text-xs text-[#fef3c7] placeholder-[#a89a8c]/50 focus:outline-none focus:border-[#e5a93c] font-mono"
                />
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 pt-6 border-t border-[rgba(229,169,60,0.18)]">
          {isAlreadyMember ? (
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#e5a93c] bg-[#e5a93c]/15 border border-[rgba(229,169,60,0.3)] px-3 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>You are already a member of this squad</span>
              </div>
              <Link href="/dashboard" className="block">
                <Button variant="primary" className="w-full rounded-xl py-5 text-sm gap-2">
                  <span>Enter Command Center</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : isFull ? (
            <div className="space-y-3 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#e06c75] bg-[#e06c75]/10 border border-[#e06c75]/20 px-3 py-1 rounded-full">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Squad roster is already filled (4/4 members)</span>
              </div>
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full rounded-xl py-5 text-sm">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-xs text-[#a89a8c] text-center">
                Sign in to your Hackline account or register to join this team.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={`/login?redirect=/join/${team.invite_code}`}
                  className="w-full"
                >
                  <Button variant="outline" className="w-full rounded-xl py-5 text-xs gap-1.5">
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Log In</span>
                  </Button>
                </Link>
                <Link
                  href={`/signup?redirect=/join/${team.invite_code}`}
                  className="w-full"
                >
                  <Button variant="primary" className="w-full rounded-xl py-5 text-xs gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Sign Up & Join</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Button
              variant="primary"
              onClick={handleJoin}
              disabled={isSubmitting}
              className="w-full rounded-xl py-6 text-sm font-bold gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14110e] animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14110e] animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14110e] animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span>Locking in squad slot...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Accept Invite & Lock Role ({finalDuty})</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
