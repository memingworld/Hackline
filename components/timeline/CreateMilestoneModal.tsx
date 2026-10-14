"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, CalendarDays, Sparkles } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-2xl overflow-hidden">
        <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-950 p-6 md:p-7">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Add Milestone Gate
                </h2>
                <p className="text-xs text-zinc-400">
                  Track critical submission windows & team code freezes.
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
              <label className="text-xs font-medium text-zinc-300">Milestone Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Feature Freeze / Demo Video Export"
                required
                className="bg-zinc-900/60 border-zinc-800 text-xs focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Milestone Category</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as TimelineEventType)}
                className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Deadline (Date & Time)</label>
              <Input
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                type="datetime-local"
                required
                className="bg-zinc-900/60 border-zinc-800 text-xs font-mono focus:border-purple-500"
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
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Create Milestone</span>
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
