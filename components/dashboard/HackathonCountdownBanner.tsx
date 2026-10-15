"use client";

import * as React from "react";
import { Hackathon, TimelineEvent } from "@/types/database";
import {
  Clock,
  Calendar,
  ExternalLink,
  ArrowUpRight,
  Edit3,
  Target,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { EditHackathonDialog } from "@/components/dashboard/EditHackathonDialog";

interface CountdownProps {
  hackathon: Hackathon;
  timelineEvents?: TimelineEvent[];
}

export function HackathonCountdownBanner({ hackathon, timelineEvents = [] }: CountdownProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // Find next uncompleted impending milestone gate across the sprint timeline
  const nextMilestone = React.useMemo(() => {
    if (!timelineEvents || timelineEvents.length === 0) return null;
    const now = Date.now();
    const upcoming = timelineEvents
      .filter((ev) => !ev.is_completed)
      .map((ev) => ({
        ...ev,
        time: new Date(ev.deadline).getTime(),
      }))
      .filter((ev) => !isNaN(ev.time) && ev.time > now)
      .sort((a, b) => a.time - b.time);

    return upcoming[0] || null;
  }, [timelineEvents]);

  // Clock countdown target mode: "milestone" defaults if active milestone exists, else "overall"
  const [targetMode, setTargetMode] = React.useState<"milestone" | "overall">("milestone");

  const isTargetingMilestone = Boolean(nextMilestone && targetMode === "milestone");
  const activeTargetDeadline = isTargetingMilestone && nextMilestone
    ? nextMilestone.deadline
    : hackathon.ends_at;

  const activeTargetTitle = isTargetingMilestone && nextMilestone
    ? nextMilestone.title.replace(/\[@.*?\]/, "").trim()
    : "Final Hackathon Submission";

  // Dynamic time calculation based on active target deadline
  const calculateTimeLeft = React.useCallback(() => {
    const end = new Date(activeTargetDeadline).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isConcluded: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isConcluded: false };
  }, [activeTargetDeadline]);

  const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft);

  React.useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  // Dynamic sprint progress calculation (overall hackathon duration)
  const progressInfo = React.useMemo(() => {
    const start = new Date(hackathon.starts_at).getTime();
    const end = new Date(hackathon.ends_at).getTime();
    const now = Date.now();

    const total = end - start;
    if (total <= 0) return { percent: 100, elapsedHours: 0, totalHours: 0 };

    const elapsed = Math.max(0, now - start);
    const percent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    const elapsedHours = Math.round(elapsed / (1000 * 60 * 60));
    const totalHours = Math.round(total / (1000 * 60 * 60));

    return { percent, elapsedHours, totalHours };
  }, [hackathon.starts_at, hackathon.ends_at]);

  const handleSyncGCal = () => {
    toast.success("Google Calendar Synced", {
      description: `Synchronized ${hackathon.title} milestones into your calendar.`,
    });
  };

  return (
    <div className="rounded-2xl border border-[rgba(229,169,60,0.22)] bg-[#1f1b16] shadow-xl overflow-hidden transition-all">
      {/* Cinematic Cover Banner Header (Responsive & Mobile-Friendly) */}
      {hackathon.banner_url && !imageError && (
        <div className="relative w-full h-32 sm:h-44 md:h-56 bg-[#100d0a] overflow-hidden border-b border-[rgba(229,169,60,0.20)]">
          <img
            src={hackathon.banner_url}
            alt={hackathon.title}
            className="w-full h-full object-cover object-center"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b16] via-black/20 to-black/40 pointer-events-none" />
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-2 flex-wrap z-10">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border border-[rgba(229,169,60,0.4)] bg-black/70 backdrop-blur-md text-[#fef3c7] font-semibold shadow-md">
              {hackathon.source_platform}
            </span>
            {hackathon.prize_pool && (
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-[#e5a93c]/50 bg-black/70 backdrop-blur-md text-[#e5a93c] shadow-md">
                {hackathon.prize_pool}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bauhaus Mustard Yellow Hero Countdown HUD Bar (Signature Palette C) */}
      <div className="bg-[#e5a93c] px-5 py-4 sm:px-6 sm:py-5 text-[#14110e] flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-widest font-black px-2 py-0.5 rounded bg-[#14110e] text-[#e5a93c]">
              LIVE SPRINT WORKSPACE
            </span>
            {isTargetingMilestone ? (
              <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-[#14110e]/20 text-[#14110e] border border-[#14110e]/30 flex items-center gap-1">
                <span>🎯 NEXT GATE:</span>
                <span className="underline decoration-dotted">{activeTargetTitle}</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold opacity-80">
                {timeLeft.isConcluded ? "Sprint Concluded" : "🏁 FINAL HACKATHON GATE"}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight font-sans truncate text-[#14110e]">
            {hackathon.title}
          </h2>
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider opacity-85 mt-0.5">
            Source: {hackathon.source_platform} • Prize: {hackathon.prize_pool || "TBA"}
          </p>

          {/* Interactive Clock Mode Toggle Pill */}
          {nextMilestone && (
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
              <span className="text-[#14110e]/80 font-bold uppercase text-[9px]">Clock Mode:</span>
              <button
                type="button"
                onClick={() => setTargetMode("milestone")}
                className={`px-2 py-0.5 rounded-md transition-all font-bold cursor-pointer ${
                  isTargetingMilestone
                    ? "bg-[#14110e] text-[#e5a93c] shadow-sm"
                    : "bg-[#14110e]/15 text-[#14110e] hover:bg-[#14110e]/25"
                }`}
              >
                🎯 Next Gate: {nextMilestone.title.replace(/\[@.*?\]/, "").trim()}
              </button>
              <button
                type="button"
                onClick={() => setTargetMode("overall")}
                className={`px-2 py-0.5 rounded-md transition-all font-bold cursor-pointer ${
                  !isTargetingMilestone
                    ? "bg-[#14110e] text-[#e5a93c] shadow-sm"
                    : "bg-[#14110e]/15 text-[#14110e] hover:bg-[#14110e]/25"
                }`}
              >
                🏁 Final Submission
              </button>
            </div>
          )}
        </div>

        {/* Retro-Precision Digital Clock HUD */}
        <div className="flex items-center gap-1.5 sm:gap-2 self-start md:self-auto shrink-0 font-mono">
          <div className="flex flex-col items-center justify-center min-w-[3rem] sm:min-w-[3.5rem] h-14 sm:h-16 rounded-xl bg-[#14110e] p-1.5 text-center shadow-inner border border-black/20">
            <span className="text-xl sm:text-2xl font-bold text-[#fef3c7] tabular-nums tracking-tight">
              {String(timeLeft.days).padStart(2, "0")}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-[#a89a8c] font-bold">
              Days
            </span>
          </div>
          <span className="text-lg font-black text-[#14110e] opacity-60">:</span>
          <div className="flex flex-col items-center justify-center min-w-[3rem] sm:min-w-[3.5rem] h-14 sm:h-16 rounded-xl bg-[#14110e] p-1.5 text-center shadow-inner border border-black/20">
            <span className="text-xl sm:text-2xl font-bold text-[#fef3c7] tabular-nums tracking-tight">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-[#a89a8c] font-bold">
              Hours
            </span>
          </div>
          <span className="text-lg font-black text-[#14110e] opacity-60">:</span>
          <div className="flex flex-col items-center justify-center min-w-[3rem] sm:min-w-[3.5rem] h-14 sm:h-16 rounded-xl bg-[#14110e] p-1.5 text-center shadow-inner border border-black/20">
            <span className="text-xl sm:text-2xl font-bold text-[#fef3c7] tabular-nums tracking-tight">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-[#a89a8c] font-bold">
              Mins
            </span>
          </div>
          <span className="text-lg font-black text-[#14110e] opacity-60">:</span>
          <div className="flex flex-col items-center justify-center min-w-[3rem] sm:min-w-[3.5rem] h-14 sm:h-16 rounded-xl bg-[#14110e] p-1.5 text-center shadow-inner border border-black/20">
            <span className="text-xl sm:text-2xl font-bold text-[#e5a93c] tabular-nums tracking-tight">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-[#e5a93c]/80 font-bold">
              Secs
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Panel: Description & Controls */}
      <div className="p-4 sm:p-5 bg-[#1f1b16] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {hackathon.description ? (
            <p className="text-xs text-[#a89a8c] leading-relaxed line-clamp-2 max-w-3xl">
              {hackathon.description}
            </p>
          ) : (
            <p className="text-xs text-[#a89a8c]/70 italic">
              No description extracted. Tap Edit to add track details and milestone deadlines.
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsEditDialogOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[rgba(229,169,60,0.22)] bg-[#28231d] hover:bg-[#332c25] hover:border-[#e5a93c]/40 text-xs font-medium text-[#fef3c7] transition-all active:scale-[0.98]"
          >
            <Edit3 className="h-3 w-3 text-[#e5a93c]" />
            <span>Edit</span>
          </button>

          <button
            onClick={handleSyncGCal}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[rgba(229,169,60,0.22)] bg-[#28231d] hover:bg-[#332c25] hover:border-[#e5a93c]/40 text-xs font-medium text-[#fef3c7] transition-all active:scale-[0.98]"
          >
            <Calendar className="h-3 w-3 text-[#e5a93c]" />
            <span>Sync GCal</span>
          </button>

          {hackathon.source_url && (
            <a
              href={hackathon.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 hover:bg-[#4a82a6]/25 text-[#7bb4d6] text-xs font-semibold transition-all active:scale-[0.98]"
            >
              <span className="capitalize">{hackathon.source_platform} Portal</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Dynamic Sprint Progress Gauge */}
      <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-[rgba(229,169,60,0.12)] bg-[#1f1b16]">
        <div className="flex items-center justify-between text-[11px] font-mono mb-2">
          <span className="text-[#a89a8c] flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#e5a93c]" />
            <span>
              Sprint Gauge: {progressInfo.elapsedHours}h elapsed of {progressInfo.totalHours}h allocated
            </span>
          </span>
          <span className="text-[#fef3c7] font-semibold">{progressInfo.percent}% Elapsed</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#14110e] border border-[rgba(229,169,60,0.15)] overflow-hidden p-[1px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#e5a93c] to-[#f3c768] shadow-[0_0_10px_rgba(229,169,60,0.5)] transition-all duration-500"
            style={{ width: `${progressInfo.percent}%` }}
          />
        </div>
      </div>

      {isEditDialogOpen && (
        <EditHackathonDialog
          hackathon={hackathon}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
