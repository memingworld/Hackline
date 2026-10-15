"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Users, Sparkles } from "lucide-react";
import { createSavedSquad, updateSavedSquad, SavedSquadPayload } from "@/lib/actions/squads";
import { SavedSquad } from "@/types/database";

interface CreateSavedSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSquadToEdit?: SavedSquad | null;
  onSuccess?: () => void;
  currentUserEmail?: string;
  currentUserName?: string;
}

const COMMON_DUTIES = [
  "Next.js Frontend",
  "FastAPI Backend",
  "AI / LLM Lead",
  "Pitch Deck & UI",
  "Full-Stack Developer",
  "DevOps & Cloud",
];

export function CreateSavedSquadModal({
  isOpen,
  onClose,
  savedSquadToEdit,
  onSuccess,
  currentUserEmail,
  currentUserName,
}: CreateSavedSquadModalProps) {
  const isEditing = Boolean(savedSquadToEdit);

  const [name, setName] = React.useState(savedSquadToEdit?.name || "");
  const [description, setDescription] = React.useState(savedSquadToEdit?.description || "");
  const [members, setMembers] = React.useState<
    Array<{ name: string; email: string; duty: string }>
  >(() => {
    if (savedSquadToEdit?.members && savedSquadToEdit.members.length > 0) {
      return savedSquadToEdit.members.map((m) => ({
        name: m.member_name,
        email: m.member_email,
        duty: m.default_duty,
      }));
    }
    return [
      {
        name: currentUserName || "Squad Lead",
        email: currentUserEmail || "",
        duty: "Next.js Frontend",
      },
      { name: "", email: "", duty: "FastAPI Backend" },
      { name: "", email: "", duty: "AI / LLM Lead" },
      { name: "", email: "", duty: "Pitch Deck & UI" },
    ];
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (savedSquadToEdit) {
      setName(savedSquadToEdit.name);
      setDescription(savedSquadToEdit.description || "");
      if (savedSquadToEdit.members && savedSquadToEdit.members.length > 0) {
        setMembers(
          savedSquadToEdit.members.map((m) => ({
            name: m.member_name,
            email: m.member_email,
            duty: m.default_duty,
          }))
        );
      }
    } else {
      setName("");
      setDescription("");
      setMembers([
        {
          name: currentUserName || "Squad Lead",
          email: currentUserEmail || "",
          duty: "Next.js Frontend",
        },
        { name: "", email: "", duty: "FastAPI Backend" },
        { name: "", email: "", duty: "AI / LLM Lead" },
        { name: "", email: "", duty: "Pitch Deck & UI" },
      ]);
    }
  }, [savedSquadToEdit, currentUserEmail, currentUserName]);

  if (!isOpen) return null;

  const handleMemberChange = (
    index: number,
    field: "name" | "email" | "duty",
    value: string
  ) => {
    setMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name for your squad preset.");
      return;
    }

    const validMembers = members.filter((m) => m.name.trim() || m.email.trim());
    if (validMembers.length === 0) {
      toast.error("Please add at least one member with a name or email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SavedSquadPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        members: validMembers.map((m, idx) => ({
          name: m.name.trim() || `Member ${idx + 1}`,
          email: m.email.trim() || `member${idx + 1}@hackline.local`,
          duty: m.duty || "Full-Stack Developer",
        })),
      };

      const res = isEditing
        ? await updateSavedSquad(savedSquadToEdit!.id, payload)
        : await createSavedSquad(payload);

      if (res.success) {
        toast.success(
          isEditing ? "Squad preset updated" : "Saved squad template created!",
          {
            description: "You can now 1-click deploy this 4-person crew to any active hackathon.",
          }
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error("Failed to save squad preset", {
          description: res.error,
        });
      }
    } catch {
      toast.error("An unexpected error occurred while saving squad.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-hidden animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.25)] shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Pinned Header */}
        <div className="px-5 py-4 border-b border-[rgba(229,169,60,0.18)] flex items-center justify-between shrink-0 bg-[#28231d]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1f1b16] border border-[rgba(229,169,60,0.25)] text-[#e5a93c]">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#fef3c7] tracking-tight font-mono truncate">
                {isEditing ? "Edit Squad Preset" : "Create Reusable Squad Preset"}
              </h2>
              <p className="text-xs text-[#a89a8c] truncate">
                Pre-assemble your 4-person dream roster for 1-click deployment.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-[#a89a8c] hover:text-[#fef3c7] rounded-lg hover:bg-[#181410] transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0 custom-scrollbar">
            {/* Squad Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a89a8c] font-mono">Preset Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AI Speedrun Core"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#a89a8c] font-mono">Description (Optional)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Agentic AI & Web3 stack crew"
                />
              </div>
            </div>

            {/* 4-Person Member Roster */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#fef3c7] uppercase tracking-wider font-mono">
                  4-Person Roster & Assigned Duties
                </label>
                <span className="text-[11px] font-mono text-[#a89a8c]">Max 4 Members</span>
              </div>

              <div className="space-y-3">
                {members.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#181410] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#28231d] text-[10px] font-mono font-bold text-[#e5a93c]">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-medium text-[#fef3c7]">
                          {idx === 0 ? "Captain / Lead" : `Teammate Slot #${idx + 1}`}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-medium text-[#7bb4d6] bg-[#4a82a6]/15 border border-[rgba(74,130,166,0.35)] px-2 py-0.5 rounded-md">
                        {member.duty || "Custom"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        value={member.name}
                        onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                        placeholder="Full Name"
                        className="text-xs h-9"
                      />
                      <Input
                        value={member.email}
                        onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                        placeholder="teammate@example.com"
                        type="email"
                        className="text-xs h-9 font-mono"
                      />
                      <select
                        value={member.duty}
                        onChange={(e) => handleMemberChange(idx, "duty", e.target.value)}
                        className="h-9 rounded-xl border border-[rgba(229,169,60,0.20)] bg-[#181410] px-2.5 text-xs text-[#fef3c7] font-mono focus:outline-none focus:border-[#e5a93c]"
                      >
                        {COMMON_DUTIES.map((duty) => (
                          <option key={duty} value={duty}>
                            {duty}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pinned Actions Footer */}
          <div className="px-5 py-3.5 border-t border-[rgba(229,169,60,0.18)] bg-[#28231d] flex items-center justify-end gap-3 shrink-0">
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
              disabled={isSubmitting}
              className="gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isEditing ? "Update Preset" : "Save Squad Preset"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
