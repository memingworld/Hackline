"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Lightbulb, Sparkles, Plus } from "lucide-react";
import { createProblemStatement, updateProblemStatement } from "@/lib/actions/vault";
import { ProblemStatement } from "@/types/database";

interface CreateProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  hackathonId: string;
  statementToEdit?: ProblemStatement | null;
  onSuccess?: () => void;
}

const COMMON_TRACKS = [
  "AI & Autonomous Agents",
  "FinTech & DeFi",
  "Healthcare & BioTech",
  "Developer Tooling & Infra",
  "Social & Consumer",
  "Web3 & Open Economy",
  "Open Innovation",
];

export function CreateProblemModal({
  isOpen,
  onClose,
  teamId,
  hackathonId,
  statementToEdit,
  onSuccess,
}: CreateProblemModalProps) {
  const isEditing = Boolean(statementToEdit);

  const [title, setTitle] = React.useState(statementToEdit?.title || "");
  const [description, setDescription] = React.useState(statementToEdit?.description || "");
  const [track, setTrack] = React.useState(statementToEdit?.track || "AI & Autonomous Agents");
  const [sourceUrl, setSourceUrl] = React.useState(statementToEdit?.source_url || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (statementToEdit) {
      setTitle(statementToEdit.title);
      setDescription(statementToEdit.description || "");
      setTrack(statementToEdit.track || "AI & Autonomous Agents");
      setSourceUrl(statementToEdit.source_url || "");
    } else {
      setTitle("");
      setDescription("");
      setTrack("AI & Autonomous Agents");
      setSourceUrl("");
    }
  }, [statementToEdit, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for the problem statement.");
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      if (isEditing && statementToEdit) {
        res = await updateProblemStatement(statementToEdit.id, {
          title,
          description,
          track,
          sourceUrl,
        });
      } else {
        res = await createProblemStatement({
          teamId,
          hackathonId,
          title,
          description,
          track,
          sourceUrl,
        });
      }

      if (res.success) {
        toast.success(
          isEditing ? "Problem statement updated" : "Idea added to Idea Vault!",
          {
            description: "Your squad can now review and blind-vote on this proposal.",
          }
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error("Failed to save idea", { description: res.error });
      }
    } catch {
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] my-auto rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.25)] shadow-2xl overflow-hidden flex flex-col z-10 text-[#fef3c7]">
        {/* Pinned Header */}
        <div className="p-5 border-b border-[rgba(229,169,60,0.2)] flex items-center justify-between shrink-0 bg-[#1f1b16]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c]">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#fef3c7] tracking-tight">
                {isEditing ? "Edit Problem Statement" : "Pitch New Problem Statement"}
              </h2>
              <p className="text-xs text-[#a89a8c]">
                Propose an idea or hackathon track for team blind voting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-[#fef3c7]">Problem Title / Hook</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Autonomous Multimodal Compliance Agent"
                required
                className="bg-[#181410] border-[rgba(229,169,60,0.2)] text-xs text-[#fef3c7] focus:border-[#e5a93c]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-[#fef3c7]">Category / Track</label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full h-10 rounded-xl border border-[rgba(229,169,60,0.2)] bg-[#181410] px-3 text-xs text-[#fef3c7] focus:outline-none focus:ring-1 focus:ring-[#e5a93c]"
              >
                {COMMON_TRACKS.map((t) => (
                  <option key={t} value={t} className="bg-[#1f1b16] text-[#fef3c7]">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-[#fef3c7]">Description / Rationale</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Why is this a winner? What is the edge or technical novelty?"
                className="w-full rounded-xl border border-[rgba(229,169,60,0.2)] bg-[#181410] p-3 text-xs text-[#fef3c7] placeholder-[#a89a8c]/50 focus:outline-none focus:border-[#e5a93c] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-[#fef3c7]">
                Source Document / Reference URL (Optional)
              </label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://devpost.com/software/... or notion doc"
                type="url"
                className="bg-[#181410] border-[rgba(229,169,60,0.2)] text-xs text-[#fef3c7] focus:border-[#e5a93c]"
              />
            </div>
          </div>

          {/* Pinned Footer */}
          <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-[rgba(229,169,60,0.2)] bg-[#1f1b16] shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs rounded-xl text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d]"
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
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14110e] animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14110e] animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14110e] animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isEditing ? "Update Problem" : "Propose Problem"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
