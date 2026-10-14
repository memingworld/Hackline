"use client";

import * as React from "react";
import { Team, SubmissionChecklistItem } from "@/types/database";
import { ShieldCheck, Plus, Trash2, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createChecklistItem, deleteChecklistItem } from "@/lib/actions/checklist";
import { useRouter } from "next/navigation";

interface PreFlightGateManagerProps {
  activeTeam: Team | null;
  checklistItems: SubmissionChecklistItem[];
  isCaptain?: boolean;
}

export function PreFlightGateManager({
  activeTeam,
  checklistItems,
  isCaptain = false,
}: PreFlightGateManagerProps) {
  const router = useRouter();
  const [newGateTitle, setNewGateTitle] = React.useState("");
  const [isAddingGate, setIsAddingGate] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleAddGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam) return;

    if (!newGateTitle.trim()) {
      toast.error("Please enter a checkpoint title.");
      return;
    }

    setIsAddingGate(true);
    try {
      const res = await createChecklistItem(activeTeam.id, newGateTitle.trim());
      if (res.success) {
        toast.success("Checkpoint added", {
          description: `Added "${newGateTitle.trim()}" to squad pre-flight checklist.`,
        });
        setNewGateTitle("");
        router.refresh();
      } else {
        toast.error("Failed to add checkpoint", { description: res.error });
      }
    } catch {
      toast.error("An error occurred while adding checkpoint");
    } finally {
      setIsAddingGate(false);
    }
  };

  const handleDeleteGate = async (itemId: string, title: string) => {
    setDeletingId(itemId);
    try {
      const res = await deleteChecklistItem(itemId);
      if (res.success) {
        toast.success("Checkpoint removed", {
          description: `Removed "${title}".`,
        });
        router.refresh();
      } else {
        toast.error("Failed to delete checkpoint", { description: res.error });
      }
    } catch {
      toast.error("An error occurred while deleting checkpoint");
    } finally {
      setDeletingId(null);
    }
  };

  if (!activeTeam) {
    return (
      <div className="rounded-3xl bg-zinc-950/60 border border-dashed border-zinc-800 p-8 text-center space-y-2">
        <ShieldCheck className="h-8 w-8 mx-auto text-zinc-600" />
        <h4 className="text-sm font-semibold text-zinc-300">
          No Squad Active for This Sprint
        </h4>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Assemble or join a squad for your active hackathon above to unlock customizable pre-flight submission gates.
        </p>
      </div>
    );
  }

  const completedCount = checklistItems.filter((i) => i.is_completed).length;
  const progressPercent =
    checklistItems.length > 0
      ? Math.round((completedCount / checklistItems.length) * 100)
      : 0;

  return (
    <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-[1px] shadow-2xl">
      <div className="rounded-[calc(1.5rem-1px)] bg-[#090a0f]/95 p-6 sm:p-8 space-y-6 backdrop-blur-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-10 -translate-y-1/2 w-80 h-32 bg-purple-500/[0.05] blur-[90px] pointer-events-none rounded-full" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06] relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 border border-white/[0.08] text-purple-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Pre-Flight Submission Gates
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
                  Squad: {activeTeam.name}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Mandatory checkpoints enforced on the sprint command center prior to portal submission.
              </p>
            </div>
          </div>

          {/* Progress Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-xl font-mono text-xs">
            <span className="text-zinc-400">Readiness:</span>
            <span className="text-emerald-400 font-bold">
              {completedCount}/{checklistItems.length} ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Checkpoints List */}
        <div className="space-y-2.5 relative z-10">
          {checklistItems.map((item) => {
            const isCustom = item.item_key.startsWith("custom_");
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-white/[0.06] bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border ${
                      item.is_completed
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-700 bg-zinc-800/60 text-transparent"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={`font-medium truncate ${
                      item.is_completed ? "text-zinc-400 line-through" : "text-zinc-200"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {!isCustom && (
                    <span className="text-[10px] font-mono uppercase text-zinc-500 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/80">
                      Standard Gate
                    </span>
                  )}

                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteGate(item.id, item.title)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Delete custom gate"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add custom checkpoint form */}
        <form onSubmit={handleAddGate} className="flex items-center gap-2.5 pt-2 relative z-10">
          <Input
            value={newGateTitle}
            onChange={(e) => setNewGateTitle(e.target.value)}
            placeholder="Add custom pre-flight checkpoint (e.g. Sepolia contract deployed, mobile responsive tested)..."
            className="h-10 bg-zinc-900/60 border-zinc-800 text-xs focus:border-purple-500 font-mono"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isAddingGate || !newGateTitle.trim()}
            className="h-10 px-4 rounded-xl text-xs gap-1.5 shrink-0 border-zinc-800 hover:border-purple-500/40 hover:text-purple-300"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isAddingGate ? "Adding..." : "Add Gate"}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
