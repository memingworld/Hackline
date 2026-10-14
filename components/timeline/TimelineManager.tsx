"use client";

import * as React from "react";
import { TimelineEvent, TimelineEventType } from "@/types/database";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Download,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  toggleTimelineEventCompletion,
  deleteTimelineEvent,
} from "@/lib/actions/timeline";
import {
  generateGoogleCalendarUrl,
  generateIcsContent,
} from "@/lib/utils/calendar";
import { CreateMilestoneModal } from "./CreateMilestoneModal";
import { useRouter } from "next/navigation";

interface TimelineManagerProps {
  events: TimelineEvent[];
  hackathonId: string;
  teamId?: string;
  hackathonTitle?: string;
}

const EVENT_TYPE_LABELS: Record<TimelineEventType, string> = {
  registration_deadline: "Registration Deadline",
  submission_deadline: "Final Submission Deadline",
  pitch_session: "Pitch & Demo Session",
  results_announcement: "Winner Announcement",
  custom: "Team Gate",
};

export function TimelineManager({
  events,
  hackathonId,
  teamId,
  hackathonTitle,
}: TimelineManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const completedCount = events.filter((e) => e.is_completed).length;
  const progressPercent = events.length > 0
    ? Math.round((completedCount / events.length) * 100)
    : 0;

  const handleToggleCompletion = async (event: TimelineEvent) => {
    setTogglingId(event.id);
    try {
      const res = await toggleTimelineEventCompletion(event.id, !event.is_completed);
      if (res.success) {
        toast.success(
          !event.is_completed ? "Milestone marked complete!" : "Milestone reopened"
        );
        router.refresh();
      } else {
        toast.error("Failed to update milestone", { description: res.error });
      }
    } catch {
      toast.error("Error updating milestone");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (event: TimelineEvent) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;
    setDeletingId(event.id);
    try {
      const res = await deleteTimelineEvent(event.id);
      if (res.success) {
        toast.success("Milestone removed from timeline");
        router.refresh();
      } else {
        toast.error("Failed to delete milestone", { description: res.error });
      }
    } catch {
      toast.error("Error deleting milestone");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadIcs = (event: TimelineEvent) => {
    const details = `Event for ${hackathonTitle || "Hackathon"}\nOrganized via Hackline Engine.`;
    const icsData = generateIcsContent(event.title, details, event.deadline);
    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("iCalendar file downloaded");
  };

  const handleDownloadAllIcs = () => {
    if (events.length === 0) return;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Hackline//Hackathon Calendar Sync//EN",
    ];

    events.forEach((event, idx) => {
      const startDate = new Date(event.deadline);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      const format = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      lines.push(
        "BEGIN:VEVENT",
        `UID:${Date.now()}_${idx}@hackline.dev`,
        `DTSTAMP:${format(new Date())}`,
        `DTSTART:${format(startDate)}`,
        `DTEND:${format(endDate)}`,
        `SUMMARY:[Hackline] ${event.title}`,
        `DESCRIPTION:Milestone for ${hackathonTitle || "Hackathon"}\\nTracked on Hackline.`,
        "END:VEVENT"
      );
    });

    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${(hackathonTitle || "hackathon").replace(/[^a-z0-9]/gi, "_")}_timeline.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("All timeline events exported to .ics");
  };

  const formatDeadlineDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDueStatus = (isoString: string, isCompleted: boolean) => {
    if (isCompleted) return { label: "Completed", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    const diffHours = Math.round((new Date(isoString).getTime() - Date.now()) / (1000 * 60 * 60));
    if (diffHours < 0) return { label: "Passed", color: "text-zinc-500 bg-zinc-900 border-zinc-800" };
    if (diffHours <= 6) return { label: `Due in ${diffHours}h`, color: "text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse" };
    if (diffHours <= 24) return { label: `Due in ${diffHours}h`, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    const days = Math.round(diffHours / 24);
    return { label: `In ${days} day${days > 1 ? "s" : ""}`, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" };
  };

  return (
    <div className="space-y-6">
      {/* Summary progress bar */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1.5 flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Sprint Milestone Execution</span>
            <span className="text-emerald-400 font-bold">
              {completedCount}/{events.length} Gates Cleared ({progressPercent}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAllIcs}
            disabled={events.length === 0}
            className="rounded-xl text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export .ICS</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="rounded-xl text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Milestone Gate</span>
          </Button>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-8 flex flex-col items-center justify-center text-center min-h-[260px] shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 mb-3">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No Timeline Gates Registered</h4>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm">
            Keep your team aligned on code freezes, pitch rehearsals, and submission deadlines.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="mt-5 rounded-xl text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create First Milestone</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const status = getDueStatus(event.deadline, event.is_completed);
            const isToggling = togglingId === event.id;
            const isDeleting = deletingId === event.id;

            const gcalUrl = generateGoogleCalendarUrl(
              event.title,
              `Milestone for ${hackathonTitle || "Hackathon"}\nManaged on Hackline.`,
              event.deadline
            );

            return (
              <div
                key={event.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  event.is_completed
                    ? "border-zinc-800/60 bg-zinc-950/40 opacity-75"
                    : "border-zinc-800 bg-zinc-950/80 hover:border-zinc-700/80 shadow-md"
                }`}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-center gap-3.5">
                  <button
                    onClick={() => handleToggleCompletion(event)}
                    disabled={isToggling}
                    className="p-1 rounded-lg text-zinc-500 hover:text-indigo-400 transition-colors"
                  >
                    {event.is_completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-zinc-600 hover:text-zinc-300" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold tracking-tight ${
                          event.is_completed ? "line-through text-zinc-500" : "text-white"
                        }`}
                      >
                        {event.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        <span>{formatDeadlineDate(event.deadline)}</span>
                      </span>
                      <span className="text-zinc-600">&bull;</span>
                      <span className="text-zinc-500 text-[11px]">
                        {EVENT_TYPE_LABELS[event.event_type] || "Checkpoint"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:self-center self-end">
                  <a
                    href={gcalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
                    title="Add directly to Google Calendar"
                  >
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Sync GCal</span>
                  </a>

                  <button
                    onClick={() => handleDownloadIcs(event)}
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
                    title="Download .ics file"
                  >
                    <Download className="h-3.5 w-3.5 text-zinc-400" />
                    <span>.ics</span>
                  </button>

                  <button
                    onClick={() => handleDelete(event)}
                    disabled={isDeleting}
                    className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Delete milestone"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateMilestoneModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        hackathonId={hackathonId}
        teamId={teamId}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
