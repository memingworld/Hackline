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
  ExternalLink,
  Users,
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
import { formatDateTimeIst } from "@/lib/utils";
import { CreateMilestoneModal } from "./CreateMilestoneModal";
import { useRouter } from "next/navigation";

interface TimelineManagerProps {
  events: TimelineEvent[];
  hackathonId: string;
  teamId?: string | null;
  hackathonTitle?: string;
}

const EVENT_TYPE_LABELS: Record<TimelineEventType, string> = {
  registration_deadline: "Registration Deadline",
  submission_deadline: "Final Submission",
  pitch_session: "Pitch & Presentation",
  results_announcement: "Results Announcement",
  custom: "Checkpoint",
};

export function TimelineManager({
  events = [],
  hackathonId,
  teamId,
  hackathonTitle = "",
}: TimelineManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const formatDeadlineDate = (isoString: string) => {
    return formatDateTimeIst(isoString);
  };

  const getDueStatus = (isoDeadline: string, isCompleted: boolean) => {
    if (isCompleted) {
      return {
        label: "Cleared",
        color: "text-[#e5a93c] bg-[#e5a93c]/15 border-[#e5a93c]/40",
      };
    }
    const now = Date.now();
    const deadlineTime = new Date(isoDeadline).getTime();
    const diffHours = Math.round((deadlineTime - now) / (1000 * 60 * 60));

    if (diffHours < 0) {
      return {
        label: "Overdue",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      };
    }
    if (diffHours <= 24) {
      return {
        label: `Due in ${diffHours}h`,
        color: "text-[#e5a93c] bg-[#e5a93c]/10 border-[#e5a93c]/30 animate-pulse",
      };
    }
    const days = Math.round(diffHours / 24);
    return {
      label: `In ${days} days`,
      color: "text-[#a89a8c] bg-[#1f1b16] border-[rgba(229,169,60,0.2)]",
    };
  };

  const handleToggleCompletion = async (event: TimelineEvent) => {
    setTogglingId(event.id);
    const newStatus = !event.is_completed;
    try {
      const res = await toggleTimelineEventCompletion(event.id, newStatus);
      if (res.success) {
        toast.success(
          newStatus ? "Gate marked as cleared" : "Gate reset to pending"
        );
        router.refresh();
      } else {
        toast.error("Failed to update status", { description: res.error });
      }
    } catch {
      toast.error("An error occurred while updating status");
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
    link.setAttribute("download", `${hackathonTitle.replace(/[^a-z0-9]/gi, "_") || "sprint"}_timeline.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Complete sprint calendar (.ics) exported");
  };

  const completedCount = events.filter((e) => e.is_completed).length;
  const progressPercent = events.length > 0
    ? Math.round((completedCount / events.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Execution Header Card (Palette C Bauhaus Theme) */}
      <div className="rounded-2xl border border-[rgba(229,169,60,0.22)] bg-[#1f1b16] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-[#fef3c7] uppercase font-mono tracking-wider truncate">
              Multi-Round Timeline Execution Gates
            </h3>
            {events.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#e5a93c]/30 bg-[#e5a93c]/15 text-[#e5a93c] font-bold shrink-0">
                {completedCount}/{events.length} Cleared ({progressPercent}%)
              </span>
            )}
          </div>
          {events.length > 0 && (
            <div className="mt-2.5 h-1.5 w-48 max-w-full rounded-full bg-[#14110e] border border-[rgba(229,169,60,0.15)] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#e5a93c] to-[#f3c768] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(229,169,60,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {events.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAllIcs}
              className="text-xs gap-1.5"
              title="Export all gates to Apple, Google or Outlook calendar"
            >
              <Download className="h-3.5 w-3.5 text-[#e5a93c]" />
              <span className="hidden sm:inline">Export .ICS</span>
              <span className="sm:hidden">.ICS</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="text-xs gap-1.5 font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>Add Milestone Gate</span>
          </Button>
        </div>
      </div>

      {/* Stepped Roadmap Execution Timeline */}
      {events.length === 0 ? (
        <div className="rounded-2xl bg-[#1f1b16] border border-dashed border-[rgba(229,169,60,0.20)] p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] mb-3">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-[#fef3c7]">No Timeline Gates Registered</h4>
          <p className="mt-1 text-xs text-[#a89a8c] max-w-sm">
            Keep your team aligned on code freezes, pitch rehearsals, and submission deadlines.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="mt-4 rounded-xl text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create First Milestone</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {events.map((event, idx) => {
            const status = getDueStatus(event.deadline, event.is_completed);
            const isToggling = togglingId === event.id;
            const isDeleting = deletingId === event.id;

            const gcalUrl = generateGoogleCalendarUrl(
              event.title,
              `Milestone for ${hackathonTitle || "Hackathon"}\nManaged on Hackline.`,
              event.deadline
            );

            const tagMatch = event.title.match(/\[@(.*?)\]/);
            const assignedTag = event.assigned_member_name || (tagMatch ? tagMatch[1] : null);
            const displayTitle = event.title.replace(/\[@.*?\]/, "").trim();

            return (
              <div key={event.id} className="relative flex items-start gap-3 sm:gap-4 group">
                {/* Stepped Timeline Vertical Connector */}
                {idx < events.length - 1 && (
                  <div className="absolute left-[1.125rem] sm:left-5 top-10 bottom-0 w-[2px] bg-[rgba(229,169,60,0.22)] -mb-3 z-0" />
                )}

                {/* Step Square Indicator Badge */}
                <div
                  className={`relative z-10 flex flex-col items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl border transition-all shrink-0 ${
                    event.is_completed
                      ? "border-[#e5a93c] bg-[#e5a93c] text-[#14110e] font-black shadow-[0_0_10px_rgba(229,169,60,0.5)]"
                      : "border-[rgba(229,169,60,0.35)] bg-[#28231d] text-[#e5a93c] font-bold"
                  }`}
                >
                  <span className="text-[7px] uppercase font-mono tracking-widest opacity-80">STEP</span>
                  <span className="text-xs sm:text-sm font-black -mt-0.5">{idx + 1}</span>
                </div>

                {/* Step Content Card */}
                <div
                  className={`flex-1 min-w-0 p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
                    event.is_completed
                      ? "border-[rgba(229,169,60,0.2)] bg-[#1f1b16]/70 opacity-80"
                      : "border-[rgba(229,169,60,0.22)] bg-[#1f1b16] hover:border-[#e5a93c]/45"
                  }`}
                >
                  {/* Left: Completion Toggle & Title Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleCompletion(event)}
                      disabled={isToggling}
                      className="p-0.5 rounded-lg text-[#a89a8c] hover:text-[#e5a93c] transition-colors shrink-0 mt-0.5"
                      title={event.is_completed ? "Mark pending" : "Mark completed"}
                    >
                      {event.is_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-[#e5a93c]" />
                      ) : (
                        <Circle className="h-5 w-5 text-[#a89a8c]/50 hover:text-[#fef3c7]" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs sm:text-sm font-bold tracking-tight ${
                            event.is_completed ? "line-through text-[#a89a8c]" : "text-[#fef3c7]"
                          }`}
                        >
                          {displayTitle}
                        </span>

                        {assignedTag && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6] flex items-center gap-1 font-semibold">
                            <Users className="h-3 w-3 text-[#7bb4d6]" />
                            <span>{assignedTag}</span>
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-[#a89a8c] mt-1 font-mono flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#e5a93c]" />
                          <span>{formatDeadlineDate(event.deadline)}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="text-[#a89a8c]/80">
                          {EVENT_TYPE_LABELS[event.event_type] || "Checkpoint"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 sm:self-center self-end shrink-0">
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl border border-[rgba(229,169,60,0.22)] bg-[#28231d] hover:bg-[#332c25] text-xs font-mono text-[#fef3c7] transition-colors"
                      title="Add directly to Google Calendar"
                    >
                      <Calendar className="h-3.5 w-3.5 text-[#e5a93c]" />
                      <span className="hidden sm:inline">Sync GCal</span>
                      <span className="sm:hidden">GCal</span>
                    </a>

                    <button
                      onClick={() => handleDownloadIcs(event)}
                      className="inline-flex items-center gap-1 h-7 sm:h-8 px-2 rounded-xl border border-[rgba(229,169,60,0.22)] bg-[#28231d] hover:bg-[#332c25] text-xs font-mono text-[#a89a8c] hover:text-[#fef3c7] transition-colors"
                      title="Download .ics file"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>.ics</span>
                    </button>

                    <button
                      onClick={() => handleDelete(event)}
                      disabled={isDeleting}
                      className="h-7 sm:h-8 w-7 sm:w-8 inline-flex items-center justify-center rounded-xl border border-transparent hover:border-rose-500/30 text-[#a89a8c] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Delete milestone"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
        teamId={teamId || undefined}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
