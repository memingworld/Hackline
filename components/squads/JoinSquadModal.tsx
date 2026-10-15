"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, KeyRound, Sparkles } from "lucide-react";
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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) {
      toast.error("Please enter an invite code or invite link.");
      return;
    }

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
      toast.error("An unexpected error occurred while joining squad.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md max-h-[88vh] my-auto rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.25)] shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="p-5 border-b border-[rgba(229,169,60,0.18)] flex items-center justify-between shrink-0 bg-[#28231d]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f1b16] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] shadow-sm">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#fef3c7] tracking-tight font-mono">
                Join Squad with Code
              </h2>
              <p className="text-xs text-[#a89a8c]">
                Enter the invite code or link provided by your captain.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#181410] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <Input
            label="Invite Code or Link"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            placeholder="e.g. 7f9a2b or https://.../join/7f9a2b"
            required
            className="font-mono text-xs"
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-medium text-[#a89a8c] tracking-wider uppercase">
              Your Sprint Duty
            </label>
            <select
              value={duty}
              onChange={(e) => setDuty(e.target.value)}
              className="w-full h-9 rounded-xl border border-[rgba(229,169,60,0.20)] bg-[#181410] px-3 text-xs text-[#fef3c7] focus:outline-none focus:border-[#e5a93c] font-mono"
            >
              {COMMON_DUTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              loadingText="Joining..."
            >
              Join Squad
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
