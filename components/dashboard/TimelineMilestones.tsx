"use client";

import * as React from "react";
import { TimelineEvent } from "@/types/database";
import {
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineProps {
  events: TimelineEvent[];
}

export function TimelineMilestones({ events }: TimelineProps) {
  const completedCount = events.filter((e) => e.is_completed).length;
  const nextGate = events.find((e) => !e.is_completed);

  const getNextGateTag = () => {
    if (!nextGate) {
      return completedCount > 0 ? "All Gates Cleared" : "No Gates Scheduled";
    }
    const diffHours = Math.max(
      0,
      Math.round((new Date(nextGate.deadline).getTime() - Date.now()) / (1000 * 60 * 60))
    );
    return `Next: T-${diffHours}h`;
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-md flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-300">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Timeline Milestone Gates
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Synchronized Sprint Deadlines
              </p>
            </div>
          </div>
          {events.length > 0 && (
            <span className="text-[10px] font-mono text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-0.5">
              {getNextGateTag()}
            </span>
          )}
        </div>

        {/* Stepper List */}
        {events.length > 0 ? (
          <div className="space-y-3.5 relative before:absolute before:left-3 before:top-2.5 before:bottom-2.5 before:w-px before:bg-zinc-800">
            {events.map((evt, idx) => {
              const isPast = evt.is_completed;
              const isNext = !isPast && (idx === 0 || events[idx - 1]?.is_completed);

              return (
                <div key={evt.id} className="relative flex items-start gap-3.5">
                  {/* Status Indicator Icon */}
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all z-10",
                      isPast
                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                        : isNext
                        ? "border-white bg-white text-zinc-950 font-bold"
                        : "border-zinc-800 bg-zinc-950 text-zinc-600"
                    )}
                  >
                    {isPast ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : isNext ? (
                      <Clock className="h-3 w-3" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </div>

                  {/* Content Block */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-xs font-semibold tracking-tight truncate",
                          isPast
                            ? "text-zinc-500 line-through decoration-zinc-700"
                            : isNext
                            ? "text-white"
                            : "text-zinc-300"
                        )}
                      >
                        {evt.title}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono shrink-0 px-2 py-0.5 rounded",
                          isNext
                            ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                            : "text-zinc-500"
                        )}
                      >
                        {new Date(evt.deadline).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(evt.deadline).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {isNext && (
                        <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                          <AlertCircle className="h-2.5 w-2.5" /> Upcoming Gate
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-zinc-500 space-y-2">
            <Clock className="h-7 w-7 mx-auto text-zinc-600" />
            <p className="text-xs">No milestone gates recorded yet for this event.</p>
            <p className="text-[11px] text-zinc-600 font-mono">Gates will appear when an event is tracked</p>
          </div>
        )}
      </div>

      {/* Footer Meta */}
      <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
        <span>{completedCount}/{events.length} gates cleared</span>
        <span className="text-emerald-400 font-medium">
          {events.length > 0 ? "Timeline armed" : "Awaiting gates"}
        </span>
      </div>
    </div>
  );
}
