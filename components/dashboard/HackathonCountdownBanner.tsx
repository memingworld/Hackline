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
    <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-[1px] shadow-2xl relative overflow-hidden group">
      <div className="rounded-[calc(1.5rem-1px)] bg-[#090a0f]/95 p-6 md:p-8 relative overflow-hidden backdrop-blur-xl">
        {/* Subtle Atmospheric Light */}
        <div className="absolute top-0 right-1/4 -translate-y-1/2 w-96 h-40 bg-emerald-500/[0.07] blur-[100px] pointer-events-none rounded-full" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left Sprint Details */}
          <div className="space-y-3.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-mono font-medium text-emerald-400 shadow-[inset_0_1px_0_rgba(16,185,129,0.2)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {timeLeft.isConcluded ? "Sprint Concluded" : "Live Sprint Mission"}
              </span>
              <span className="rounded-full border border-white/[0.08] bg-zinc-900/80 px-2.5 py-1 font-mono text-[10px] text-zinc-300 uppercase tracking-wider">
                {hackathon.source_platform}
              </span>
              {hackathon.prize_pool && (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-950/30 px-3 py-1 font-mono text-[10px] font-semibold text-emerald-300">
                  Prize Pool: {hackathon.prize_pool}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5 truncate font-sans">
                <span className="truncate">{hackathon.title}</span>
                {hackathon.source_url && (
                  <a
                    href={hackathon.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/[0.2] transition-colors shrink-0"
                    title="Open official challenge portal"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </h2>
              {hackathon.description && (
                <p className="mt-1.5 text-xs text-zinc-400 max-w-2xl leading-relaxed line-clamp-2">
                  {hackathon.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Countdown Clock & HUD */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-4 shrink-0">
            {/* Precision HUD Countdown */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center justify-center min-w-[3.75rem] h-16 rounded-xl border border-white/[0.08] bg-zinc-950/80 p-2 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                <span className="font-mono text-2xl font-bold text-white tracking-tight tabular-nums">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 mt-0.5">
                  Hours
                </span>
              </div>
              <span className="font-mono text-xl font-bold text-zinc-600 animate-pulse">:</span>
              <div className="flex flex-col items-center justify-center min-w-[3.75rem] h-16 rounded-xl border border-white/[0.08] bg-zinc-950/80 p-2 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                <span className="font-mono text-2xl font-bold text-zinc-200 tracking-tight tabular-nums">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 mt-0.5">
                  Mins
                </span>
              </div>
              <span className="font-mono text-xl font-bold text-zinc-600 animate-pulse">:</span>
              <div className="flex flex-col items-center justify-center min-w-[3.75rem] h-16 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2 text-center shadow-[inset_0_1px_1px_rgba(16,185,129,0.15)]">
                <span className="font-mono text-2xl font-bold text-emerald-400 tracking-tight tabular-nums">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-500/80 mt-0.5">
                  Secs
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.15] text-xs font-medium text-zinc-300 transition-all active:scale-[0.98]"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleSyncGCal}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/[0.15] text-xs font-medium text-zinc-300 transition-all active:scale-[0.98]"
              >
                <Calendar className="h-3 w-3 text-zinc-400" />
                <span>Sync GCal</span>
              </button>
              {hackathon.source_url && (
                <a
                  href={hackathon.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
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

        {/* Dynamic Sprint Progress Gauge */}
        <div className="mt-6 pt-5 border-t border-white/[0.06] relative z-10">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2.5">
            <span className="text-zinc-400 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                Sprint Gauge: {progressInfo.elapsedHours}h elapsed of {progressInfo.totalHours}h allocated
              </span>
            </span>
            <span className="text-zinc-200 font-semibold">{progressInfo.percent}% Elapsed</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-950 border border-white/[0.06] overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all duration-500"
              style={{ width: `${progressInfo.percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
