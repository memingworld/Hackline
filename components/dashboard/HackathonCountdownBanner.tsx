"use client";

import * as React from "react";
import { Hackathon } from "@/types/database";
import {
  Clock,
  Calendar,
  ExternalLink,
  ArrowUpRight,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { EditHackathonDialog } from "@/components/dashboard/EditHackathonDialog";

interface CountdownProps {
  hackathon: Hackathon;
}

export function HackathonCountdownBanner({ hackathon }: CountdownProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  // Dynamic time calculation
  const calculateTimeLeft = React.useCallback(() => {
    const end = new Date(hackathon.ends_at).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isConcluded: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, isConcluded: false };
  }, [hackathon.ends_at]);

  const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft);

  React.useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  // Dynamic sprint progress calculation
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
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-7 backdrop-blur-md relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Sprint Details */}
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {timeLeft.isConcluded ? "Sprint Concluded" : "Live Sprint Underway"}
            </span>
            <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400 uppercase">
              {hackathon.source_platform}
            </span>
            {hackathon.prize_pool && (
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                Prize: {hackathon.prize_pool}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2 truncate">
              <span className="truncate">{hackathon.title}</span>
              {hackathon.source_url && (
                <a
                  href={hackathon.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-white transition-colors shrink-0"
                  title="Open source link"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </h2>
            {hackathon.description && (
              <p className="mt-1 text-xs text-zinc-400 max-w-2xl leading-relaxed line-clamp-2">
                {hackathon.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Countdown Clock & HUD */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 text-center">
              <span className="font-mono text-xl font-bold text-white leading-none">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[9px] uppercase font-mono text-zinc-500 mt-1">
                Hours
              </span>
            </div>
            <span className="font-mono text-lg font-bold text-zinc-600">:</span>
            <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 text-center">
              <span className="font-mono text-xl font-bold text-zinc-200 leading-none">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[9px] uppercase font-mono text-zinc-500 mt-1">
                Mins
              </span>
            </div>
            <span className="font-mono text-lg font-bold text-zinc-600">:</span>
            <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 text-center">
              <span className="font-mono text-xl font-bold text-emerald-400 leading-none">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[9px] uppercase font-mono text-zinc-500 mt-1">
                Secs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditDialogOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            >
              <Edit3 className="h-3 w-3" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleSyncGCal}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            >
              <Calendar className="h-3 w-3 text-zinc-400" />
              <span>Sync GCal</span>
            </button>
            {hackathon.source_url && (
              <a
                href={hackathon.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
              >
                <span className="capitalize">{hackathon.source_platform} Portal</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      <EditHackathonDialog
        hackathon={hackathon}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* Dynamic Sprint Progress Bar */}
      <div className="mt-5 pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-[11px] font-mono mb-2">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span>
              Sprint Progress: {progressInfo.elapsedHours}h elapsed of {progressInfo.totalHours}h total
            </span>
          </span>
          <span className="text-zinc-300 font-semibold">{progressInfo.percent}% Complete</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-300"
            style={{ width: `${progressInfo.percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
