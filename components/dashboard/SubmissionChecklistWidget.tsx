"use client";

import * as React from "react";
import { SubmissionChecklistItem } from "@/types/database";
import { CheckSquare, Square, ShieldCheck, Sparkles, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { toggleChecklistItem, createChecklistItem } from "@/lib/actions/checklist";
import { useRouter } from "next/navigation";

interface ChecklistProps {
  initialItems: SubmissionChecklistItem[];
  teamId?: string;
}

export function SubmissionChecklistWidget({ initialItems, teamId }: ChecklistProps) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialItems);
  const [isAdding, setIsAdding] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const toggleItem = async (id: string) => {
    const targetItem = items.find((i) => i.id === id);
    if (!targetItem) return;

    const newState = !targetItem.is_completed;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_completed: newState } : item))
    );

    try {
      const res = await toggleChecklistItem(id, newState);
      if (res.success) {
        toast.success(
          newState ? "Checklist gate verified" : "Checklist gate reopened",
          { description: targetItem.title }
        );
      } else {
        // Revert
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_completed: !newState } : item))
        );
        toast.error("Failed to update status");
      }
    } catch {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_completed: !newState } : item))
      );
    }
  };

  const handleAddCustomCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !teamId) return;

    setIsSubmitting(true);
    try {
      const res = await createChecklistItem(teamId, newTitle.trim());
      if (res.success) {
        toast.success("Custom verification gate added");
        setNewTitle("");
        setIsAdding(false);
        router.refresh();
      } else {
        toast.error("Failed to add gate", { description: res.error });
      }
    } catch {
      toast.error("Error creating gate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = items.filter((i) => i.is_completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const isReady = completedCount === items.length && items.length > 0;

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
                  Mandatory Verification Before Final Portal Submission
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                isReady
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  : "text-amber-400 bg-amber-500/10 border-amber-500/20"
              }`}
            >
              {completedCount} / {items.length} Cleared ({progressPercent}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full bg-zinc-950 rounded-full mb-5 border border-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isReady ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-gradient-to-r from-amber-500 to-indigo-500"
              }`}
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
              <p className="text-[11px] text-zinc-600 font-mono">
                Squad checklist activates when an active event is selected
              </p>
            </div>
          )}

          {/* Inline Add Form */}
          {isAdding && teamId && (
            <form onSubmit={handleAddCustomCheck} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter custom checkpoint title..."
                autoFocus
                className="flex-1 h-9 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="h-9 px-2 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Automated WhatsApp ping triggers at T-2h</span>
          {teamId && !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Gate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
