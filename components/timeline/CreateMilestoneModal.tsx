"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, CalendarDays } from "lucide-react";
import { createTimelineEvent } from "@/lib/actions/timeline";
import { TimelineEventType } from "@/types/database";

interface CreateMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: string;
  teamId?: string;
  onSuccess?: () => void;
}

const EVENT_TYPES: Array<{ id: TimelineEventType; label: string }> = [
  { id: "custom", label: "Custom Team Checkpoint" },
  { id: "submission_deadline", label: "Final Submission Deadline" },
  { id: "pitch_session", label: "Pitch & Demo Session" },
  { id: "registration_deadline", label: "Registration Closes" },
  { id: "results_announcement", label: "Winner Announcement" },
];

export function CreateMilestoneModal({
  isOpen,
  onClose,
  hackathonId,
  teamId,
  onSuccess,
}: CreateMilestoneModalProps) {
  const [title, setTitle] = React.useState("");
  const [eventType, setEventType] = React.useState<TimelineEventType>("custom");
  const [deadline, setDeadline] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) {
      toast.error("Please enter a title and deadline timestamp.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createTimelineEvent({
        hackathonId,
        teamId,
        title,
        eventType,
        deadline,
      });

      if (res.success) {
        toast.success("Milestone gate created!", {
          description: "Sync it to Google Calendar or track it across your sprint.",
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error("Failed to add milestone", { description: res.error });
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md my-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Add Milestone Gate
              </h2>
              <p className="text-xs text-zinc-400">
                Track critical submission windows & code freezes.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input
            label="Milestone Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midnight Code Freeze / Video Export"
            required
            className="text-xs"
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-medium text-zinc-400 tracking-wider uppercase">
              Gate Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as TimelineEventType)}
              className="w-full h-9 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Deadline Date & Time"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={{ colorScheme: "dark" }}
            required
            className="text-xs font-mono"
          />

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
              loadingText="Creating..."
            >
              Add Milestone Gate
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
