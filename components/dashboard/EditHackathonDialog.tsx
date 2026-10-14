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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg my-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
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

        {/* Form Body */}
        <form onSubmit={handleUpdate} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
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
              placeholder="e.g. $50,000 or ₹10,00,000"
            />

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-medium text-zinc-400 tracking-wider uppercase">
                Description & Tracks
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-zinc-900/60 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 border border-zinc-800 outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {confirmDelete && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 font-mono">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Warning: Deleting this event removes all squads and timeline gates.
              </p>
            )}
          </div>

          {/* Actions Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                confirmDelete
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                  : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              }`}
            >
              <Trash2 className="h-3 w-3" />
              <span>{confirmDelete ? "Confirm Delete?" : "Delete Event"}</span>
            </button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                loadingText="Saving..."
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
