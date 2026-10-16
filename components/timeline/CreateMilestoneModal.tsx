"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, CalendarDays } from "lucide-react";
import { createTimelineEvent } from "@/lib/actions/timeline";
import { TimelineEventType } from "@/types/database";
import { parseDateTimeInputToUtc } from "@/lib/utils";

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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

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
        deadline: parseDateTimeInputToUtc(deadline),
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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md max-h-[88vh] my-auto rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden flex flex-col z-10 text-parchment">
        {/* Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between shrink-0 bg-surface-elevated">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-surface-border text-mustard shadow-sm">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-parchment tracking-tight font-mono">
                Add Milestone Gate
              </h2>
              <p className="text-xs text-clay">
                Track critical submission windows & code freezes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-clay hover:text-parchment hover:bg-surface transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <Input
            label="Milestone Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Midnight Code Freeze / Video Export"
            required
            className="text-xs"
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono font-medium text-clay tracking-wider uppercase">
              Gate Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as TimelineEventType)}
              className="w-full h-9 rounded-xl border border-surface-border bg-canvas px-3 text-xs text-parchment focus:outline-none focus:border-mustard font-mono"
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
    </div>,
    document.body
  );
}
