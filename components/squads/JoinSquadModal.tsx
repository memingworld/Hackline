"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, UserPlus, KeyRound, Sparkles } from "lucide-react";
import { joinTeamByInviteCode } from "@/lib/actions/squads";
import { useRouter } from "next/navigation";

interface JoinSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_DUTIES = [
  "Next.js Frontend",
  "FastAPI Backend",
  "AI / LLM Lead",
  "Pitch Deck & UI",
  "Full-Stack Developer",
  "DevOps & Cloud",
];

export function JoinSquadModal({ isOpen, onClose, onSuccess }: JoinSquadModalProps) {
  const router = useRouter();
  const [inviteInput, setInviteInput] = React.useState("");
  const [duty, setDuty] = React.useState("Full-Stack Developer");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) {
      toast.error("Please enter an invite code or invite link.");
      return;
    }

    // Clean code if full link was pasted (e.g. http://localhost:3000/join/abcdef)
    let cleanCode = inviteInput.trim();
    if (cleanCode.includes("/join/")) {
      cleanCode = cleanCode.split("/join/")[1]?.split("?")[0]?.split("/")[0] || cleanCode;
    }

    setIsSubmitting(true);
    try {
      const res = await joinTeamByInviteCode(cleanCode, duty);

      if (res.success) {
        toast.success("Successfully joined the squad!", {
          description: "Your roster slot and duty assignment are now locked in.",
        });
        if (onSuccess) onSuccess();
        onClose();
        router.refresh();
      } else {
        toast.error("Could not join squad", {
          description: res.error,
        });
      }
    } catch {
      toast.error("An unexpected error occurred while joining.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-2xl overflow-hidden">
        <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-950 p-6 md:p-7">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Join Squad with Code
                </h2>
                <p className="text-xs text-zinc-400">
                  Enter the 6-12 character code or invite link.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Invite Code or URL</label>
              <Input
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="e.g. 7f9a2b or https://hackline.dev/join/7f9a2b"
                required
                className="bg-zinc-900/60 border-zinc-800 font-mono text-xs focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Your Hackathon Duty</label>
              <select
                value={duty}
                onChange={(e) => setDuty(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-800/90 bg-zinc-900/80 px-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {COMMON_DUTIES.map((d) => (
                  <option key={d} value={d} className="bg-zinc-900 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="text-xs rounded-xl px-4 gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
                    </span>
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Join Squad</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
