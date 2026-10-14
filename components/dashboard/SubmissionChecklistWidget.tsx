"use client";

import * as React from "react";
import { SubmissionChecklistItem } from "@/types/database";
import { CheckSquare, Square, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ChecklistProps {
  initialItems: SubmissionChecklistItem[];
}

export function SubmissionChecklistWidget({ initialItems }: ChecklistProps) {
  const [items, setItems] = React.useState(initialItems);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newState = !item.is_completed;
          toast.success(
            newState ? "Checklist item marked complete" : "Checklist item unmarked",
            {
              description: item.title,
            }
          );
          return { ...item, is_completed: newState };
        }
        return item;
      })
    );
  };

  const completedCount = items.filter((i) => i.is_completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl h-full flex flex-col justify-between">
      <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-6 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Pre-Flight Submission Checklist
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Mandatory Verification Before Final Submission
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {completedCount} / {items.length} Done ({progressPercent}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-zinc-950 rounded-full mb-5 border border-zinc-800 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Interactive Checklist items */}
          {items.length > 0 ? (
            <div className="space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-950 hover:border-zinc-700 transition-colors cursor-pointer select-none group"
                >
                  <div className="mt-0.5 text-indigo-400 group-hover:scale-110 transition-transform">
                    {item.is_completed ? (
                      <CheckSquare className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span
                      className={`text-xs block ${
                        item.is_completed
                          ? "text-zinc-400 line-through decoration-zinc-600"
                          : "text-zinc-200 group-hover:text-white"
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-zinc-500 space-y-2">
              <ShieldCheck className="h-8 w-8 mx-auto text-zinc-600" />
              <p className="text-xs">No checklist verification rules assigned yet.</p>
              <p className="text-[11px] text-zinc-600 font-mono">Squad checklist activates when an active event is selected</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Automated ping alert triggers at T-2h</span>
          <span className="text-indigo-400">Add Custom Check +</span>
        </div>
      </div>
    </div>
  );
}
