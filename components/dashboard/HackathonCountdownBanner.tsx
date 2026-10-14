"use client";

import * as React from "react";
import { Hackathon } from "@/types/database";
import {
  Clock,
  Calendar,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  Flame,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { EditHackathonDialog } from "@/components/dashboard/EditHackathonDialog";

interface CountdownProps {
  hackathon: Hackathon;
}

export function HackathonCountdownBanner({ hackathon }: CountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState({
    hours: 18,
    minutes: 42,
    seconds: 15,
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSyncGCal = () => {
    toast.success("Google Calendar Synced", {
      description: "Added Code Freeze & Hard Submission gates to your calendar.",
    });
  };

  return (
    <div className="rounded-[2rem] p-1.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 ring-1 ring-white/5 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
      <div className="absolute right-40 bottom-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-6 md:p-8 backdrop-blur-2xl relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Context & Platform Badge */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-0.5 text-[11px] font-mono font-semibold text-rose-300">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
                Live Sprint Underway
              </span>
              <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400 uppercase">
                {hackathon.source_platform}
              </span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                Prize: {hackathon.prize_pool}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>{hackathon.title}</span>
                <a
                  href={hackathon.source_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ArrowUpRight className="h-5 w-5" />
                </a>
              </h2>
              <p className="mt-1 text-xs text-zinc-400 max-w-xl leading-relaxed">
                {hackathon.description}
              </p>
            </div>
          </div>

          {/* Right Countdown Clock & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center justify-center h-16 w-16 rounded-xl border border-zinc-800 bg-zinc-950/80 p-2 text-center">
                <span className="font-mono text-2xl font-bold text-white">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[9px] uppercase font-mono text-zinc-500">
                  Hours
                </span>
              </div>
              <span className="font-mono text-xl font-bold text-zinc-600">:</span>
              <div className="flex flex-col items-center justify-center h-16 w-16 rounded-xl border border-zinc-800 bg-zinc-950/80 p-2 text-center">
                <span className="font-mono text-2xl font-bold text-indigo-400">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[9px] uppercase font-mono text-zinc-500">
                  Mins
                </span>
              </div>
              <span className="font-mono text-xl font-bold text-zinc-600">:</span>
              <div className="flex flex-col items-center justify-center h-16 w-16 rounded-xl border border-zinc-800 bg-zinc-950/80 p-2 text-center">
                <span className="font-mono text-2xl font-bold text-rose-400">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[9px] uppercase font-mono text-zinc-500">
                  Secs
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
                title="Edit or Delete Hackathon"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleSyncGCal}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors"
              >
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                <span>Sync to GCal</span>
              </button>
              <a
                href={hackathon.source_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98]"
              >
                <span>Devfolio Portal</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <EditHackathonDialog
          hackathon={hackathon}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={() => window.location.reload()}
        />

        {/* Sprint Progress Bar (18h of 36h elapsed = 50%) */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Sprint Progress: 18h elapsed of 36h window</span>
            </span>
            <span className="text-indigo-400 font-semibold">50.0% Complete</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 transition-all duration-500"
              style={{ width: "50%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
