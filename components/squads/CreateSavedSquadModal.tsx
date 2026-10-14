"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Users, Sparkles, Plus, Trash2 } from "lucide-react";
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
    // Default 4 template slots, 1st slot is current user
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
  }, [savedSquadToEdit, currentUserName, currentUserEmail, isOpen]);

  if (!isOpen) return null;

  const handleMemberChange = (
    index: number,
    field: "name" | "email" | "duty",
    value: string
  ) => {
    setMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a squad preset name");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SavedSquadPayload = {
        name,
        description,
        members: members.filter((m) => m.name.trim() || m.email.trim()),
      };

      let res;
      if (isEditing && savedSquadToEdit) {
        res = await updateSavedSquad(savedSquadToEdit.id, payload);
      } else {
        res = await createSavedSquad(payload);
      }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isEditing ? "Edit Squad Preset" : "Create Reusable Squad Preset"}
              </h2>
              <p className="text-xs text-zinc-400">
                Pre-assemble your 4-person dream roster for 1-click deployment.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Squad Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Preset Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AI Speedrun Core"
                  required
                  className="bg-zinc-900/60 border-zinc-800 focus:border-indigo-500 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Description (Optional)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Agentic AI & Web3 stack crew"
                  className="bg-zinc-900/60 border-zinc-800 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>

            {/* 4-Person Member Roster */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                  4-Person Roster & Assigned Duties
                </label>
                <span className="text-[11px] font-mono text-zinc-500">Max 4 Members</span>
              </div>

              <div className="space-y-3">
                {members.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-medium text-zinc-200">
                          {idx === 0 ? "Captain / Lead" : `Teammate Slot #${idx + 1}`}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        {member.duty || "Custom"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        value={member.name}
                        onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                        placeholder="Full Name"
                        className="bg-zinc-950/80 border-zinc-800/90 text-xs h-9"
                      />
                      <Input
                        value={member.email}
                        onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                        placeholder="teammate@example.com"
                        type="email"
                        className="bg-zinc-950/80 border-zinc-800/90 text-xs h-9"
                      />
                      <select
                        value={member.duty}
                        onChange={(e) => handleMemberChange(idx, "duty", e.target.value)}
                        className="h-9 rounded-xl border border-zinc-800/90 bg-zinc-950/80 px-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {COMMON_DUTIES.map((duty) => (
                          <option key={duty} value={duty} className="bg-zinc-900 text-white">
                            {duty}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
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
                className="text-xs rounded-xl px-5 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
                    </span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{isEditing ? "Update Preset" : "Save Squad Preset"}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }
