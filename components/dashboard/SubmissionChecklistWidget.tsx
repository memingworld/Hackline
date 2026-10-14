"use client";

import * as React from "react";
import { SubmissionChecklistItem } from "@/types/database";
import { CheckSquare, Square, ShieldCheck, Plus, X } from "lucide-react";
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
          newState ? "Checkpoint verified" : "Checkpoint reopened",
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
    <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-[1px] shadow-xl h-full flex flex-col justify-between group">
      <div className="rounded-[calc(1.5rem-1px)] bg-[#090a0f]/95 p-6 backdrop-blur-xl flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-white/[0.08] text-zinc-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Pre-Flight Submission Checklist
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Mandatory Verification Before Submission
                </p>
              </div>
            </div>

          <span
            className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
              isReady
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                : "text-zinc-300 bg-zinc-800 border-zinc-700"
            }`}
          >
            {completedCount}/{items.length} Cleared ({progressPercent}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-zinc-950 rounded-full mb-4 border border-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isReady ? "bg-emerald-400" : "bg-zinc-400"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Interactive Checklist items */}
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="flex items-start gap-2.5 p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900/60 hover:border-zinc-700 transition-colors cursor-pointer select-none group"
              >
                <div className="mt-0.5 shrink-0 text-zinc-400 group-hover:text-white transition-colors">
                  {item.is_completed ? (
                    <CheckSquare className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Square className="h-4 w-4 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-xs block ${
                      item.is_completed
                        ? "text-zinc-500 line-through decoration-zinc-700"
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
            <ShieldCheck className="h-7 w-7 mx-auto text-zinc-600" />
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
              placeholder="Enter custom gate requirement..."
              autoFocus
              className="flex-1 h-8 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-3 rounded-lg bg-white text-zinc-950 font-semibold hover:bg-zinc-200 text-xs transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="h-8 px-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>

        {/* Footer info */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Telegram alerts at T-24h and T-2h</span>
          {teamId && !isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-3 w-3" />
              <span>Add Custom Gate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
