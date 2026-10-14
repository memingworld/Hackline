"use client";

import * as React from "react";
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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg max-h-[86vh] rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col z-10">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {isEditing ? "Edit Problem Statement" : "Pitch New Problem Statement"}
              </h2>
              <p className="text-xs text-zinc-400">
                Propose an idea or hackathon track for team blind voting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Problem Title / Hook</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Autonomous Multimodal Compliance Agent"
                required
                className="bg-zinc-900/60 border-zinc-800 text-xs focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Category / Track</label>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {COMMON_TRACKS.map((t) => (
                  <option key={t} value={t} className="bg-zinc-900 text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Description / Rationale</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Why is this a winner? What is the edge or technical novelty?"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Source Document / Reference URL (Optional)
              </label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://devpost.com/software/... or notion doc"
                type="url"
                className="bg-zinc-900/60 border-zinc-800 text-xs focus:border-amber-500"
              />
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
      </div>
    );
  }
