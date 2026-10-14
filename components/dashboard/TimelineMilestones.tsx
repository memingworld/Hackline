"use client";

import * as React from "react";
import { TimelineEvent } from "@/types/database";
import {
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Flag,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineProps {
  events: TimelineEvent[];
}

export function TimelineMilestones({ events }: TimelineProps) {
  return (
    <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl h-full flex flex-col justify-between">
      <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-6 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Timeline Milestone Gates
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Google Calendar Synchronized
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-md px-2 py-0.5">
              Next: T-12h
            </span>
          </div>

          {/* Stepper List */}
          {events.length > 0 ? (
            <div className="space-y-4 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
              {events.map((evt, idx) => {
                const isPast = evt.is_completed;
                const isNext = !isPast && (idx === 0 || events[idx - 1]?.is_completed);

                return (
                  <div key={evt.id} className="relative flex items-start gap-4">
                    {/* Status Indicator Icon */}
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all z-10",
                        isPast
                          ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/20"
                          : isNext
                          ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/40 animate-pulse"
                          : "border-zinc-800 bg-zinc-950 text-zinc-600"
                      )}
                    >
                      {isPast ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : isNext ? (
                        <Clock className="h-3.5 w-3.5" />
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
                              ? "text-zinc-400 line-through decoration-zinc-600"
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
                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              : "text-zinc-500"
                          )}
                        >
                          {new Date(evt.deadline).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
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
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <Clock className="h-8 w-8 mx-auto text-zinc-600" />
              <p className="text-xs">No milestone gates recorded yet for this event.</p>
              <p className="text-[11px] text-zinc-600 font-mono">Sync gates from Google Calendar or add milestones</p>
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>5/5 gates registered</span>
          <span className="text-emerald-400 font-medium">WhatsApp T-2h armed</span>
        </div>
      </div>
    </div>
  );
}
