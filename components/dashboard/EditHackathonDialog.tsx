"use client";

import * as React from "react";
import { Hackathon } from "@/types/database";
import { updateHackathon, deleteHackathon } from "@/lib/actions/hackathons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Trash2, Edit3, AlertTriangle } from "lucide-react";

interface EditHackathonDialogProps {
  hackathon: Hackathon;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditHackathonDialog({
  hackathon,
  isOpen,
  onClose,
  onSuccess,
}: EditHackathonDialogProps) {
  const [title, setTitle] = React.useState(hackathon.title);
  const [prizePool, setPrizePool] = React.useState(hackathon.prize_pool || "");
  const [description, setDescription] = React.useState(hackathon.description || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (!isOpen) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await updateHackathon(hackathon.id, {
        title,
        prize_pool: prizePool,
        description,
      });

      if (res.success) {
        toast.success("Hackathon details updated successfully");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error("Failed to update hackathon", {
          description: res.error,
        });
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteHackathon(hackathon.id);
      if (res.success) {
        toast.success("Hackathon deleted", {
          description: "All associated squads and timeline gates have been cleaned up.",
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error("Failed to delete hackathon", {
          description: res.error,
        });
      }
    } catch {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-[2rem] p-1.5 bg-white/10 border border-white/10 ring-1 ring-white/10 shadow-2xl relative">
        <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-950 p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Edit3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Edit Hackathon Details
                </h3>
                <p className="text-[11px] font-mono text-zinc-500 uppercase">
                  Platform: {hackathon.source_platform}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Hackathon Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Input
              label="Prize Pool"
              value={prizePool}
              onChange={(e) => setPrizePool(e.target.value)}
              placeholder="e.g. $250,000 or ₹15,00,000"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wide">
                Description & Tracks
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-zinc-900/60 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 border border-zinc-800/80 outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  confirmDelete
                    ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                    : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{confirmDelete ? "Confirm Delete?" : "Delete Event"}</span>
              </button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  loadingText="Saving..."
                  className="text-xs"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            {confirmDelete && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1.5 mt-2 animate-fade-in font-mono">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Warning: Deleting this event removes all squads, timeline gates, and assets.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
