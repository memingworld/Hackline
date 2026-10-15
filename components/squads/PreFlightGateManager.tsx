"use client";

import * as React from "react";
import { Team, SubmissionChecklistItem } from "@/types/database";
import { ShieldCheck, Plus, Trash2, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  createChecklistItem,
  deleteChecklistItem,
  ensureDefaultChecklistItems,
  toggleChecklistItem,
} from "@/lib/actions/checklist";
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
  const [items, setItems] = React.useState<SubmissionChecklistItem[]>(checklistItems || []);
  const [newGateTitle, setNewGateTitle] = React.useState("");
  const [isAddingGate, setIsAddingGate] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  // Sync state when props change from server
  React.useEffect(() => {
    setItems(checklistItems || []);
  }, [checklistItems]);

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
        if (res.item) {
          setItems((prev) => [...prev, res.item]);
        }
        toast.success("Checkpoint added", {
          description: `Added "${newGateTitle.trim()}" to pre-flight checklist.`,
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

  const handleInitializeDefaults = async () => {
    if (!activeTeam) return;
    setIsInitializing(true);
    try {
      const res = await ensureDefaultChecklistItems(activeTeam.id);
      if (res.success) {
        if (res.items && res.items.length > 0) {
          setItems(res.items);
        }
        toast.success("Default submission gates initialized!", {
          description: "Standard hackathon checkpoints (repo, demo, slides, team) have been deployed.",
        });
        router.refresh();
      } else {
        toast.error("Failed to initialize gates", { description: res.error });
      }
    } catch {
      toast.error("Error initializing submission gates");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleToggle = async (item: SubmissionChecklistItem) => {
    setTogglingId(item.id);
    const targetStatus = !item.is_completed;

    // Optimistic toggle
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_completed: targetStatus } : i))
    );

    try {
      const res = await toggleChecklistItem(item.id, targetStatus);
      if (res.success) {
        toast.success(
          targetStatus ? "Gate verified & cleared!" : "Gate marked pending"
        );
        router.refresh();
      } else {
        // Rollback on error
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, is_completed: item.is_completed } : i))
        );
        toast.error("Failed to update gate", { description: res.error });
      }
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_completed: item.is_completed } : i))
      );
      toast.error("Error toggling gate status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteGate = async (itemId: string, title: string) => {
    setDeletingId(itemId);
    const prevItems = [...items];

    // Optimistic delete
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    try {
      const res = await deleteChecklistItem(itemId);
      if (res.success) {
        toast.success("Checkpoint removed", {
          description: `Removed "${title}".`,
        });
        router.refresh();
      } else {
        // Rollback
        setItems(prevItems);
        toast.error("Failed to delete checkpoint", { description: res.error });
      }
    } catch {
      setItems(prevItems);
      toast.error("An error occurred while deleting checkpoint");
    } finally {
      setDeletingId(null);
    }
  };

  if (!activeTeam) {
    return (
      <div className="rounded-2xl border border-dashed border-[rgba(229,169,60,0.22)] bg-[#181410] p-8 text-center space-y-2">
        <ShieldCheck className="h-8 w-8 mx-auto text-[#a89a8c]" />
        <h4 className="text-sm font-semibold text-[#fef3c7] font-mono">
          No Squad Active for This Sprint
        </h4>
        <p className="text-xs text-[#a89a8c] max-w-sm mx-auto">
          Assemble or join a squad for your hackathon to unlock customizable pre-flight submission gates.
        </p>
      </div>
    );
  }

  const hasGates = items.length > 0;
  const completedCount = items.filter((i) => i.is_completed).length;
  const progressPercent = hasGates
    ? Math.round((completedCount / items.length) * 100)
    : 0;

  return (
    <div className="rounded-2xl border border-[rgba(229,169,60,0.20)] bg-[#1f1b16] p-5 sm:p-7 shadow-xl space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(229,169,60,0.15)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#fef3c7] tracking-tight font-mono">
                Pre-Flight Submission Gates
              </h3>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6]">
                Squad: {activeTeam.name}
              </span>
            </div>
            <p className="text-xs text-[#a89a8c] mt-0.5">
              Enforced checkpoints before your project is submitted to the portal.
            </p>
          </div>
        </div>

        {/* Readiness Pill (only rendered when gates exist, avoiding 0/0 glitch) */}
        {hasGates ? (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-[#181410] border border-[rgba(229,169,60,0.25)] px-3 py-1.5 rounded-xl font-mono text-xs">
            <span className="text-[#a89a8c]">Readiness:</span>
            <span className="text-[#e5a93c] font-bold">
              {completedCount}/{items.length} ({progressPercent}%)
            </span>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleInitializeDefaults}
            disabled={isInitializing}
            className="rounded-xl text-xs gap-1.5 border-[rgba(229,169,60,0.3)] hover:border-[#e5a93c] text-[#fef3c7]"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#e5a93c] ${isInitializing ? "animate-spin" : ""}`} />
            <span>{isInitializing ? "Initializing..." : "Auto-Seed 5 Gates"}</span>
          </Button>
        )}
      </div>

      {/* Checkpoints List or Empty Callout */}
      {!hasGates ? (
        <div className="rounded-xl border border-dashed border-[rgba(229,169,60,0.22)] bg-[#181410]/50 p-6 text-center space-y-3">
          <Sparkles className="h-6 w-6 mx-auto text-[#e5a93c]" />
          <div>
            <h4 className="text-xs font-bold text-[#fef3c7] font-mono uppercase tracking-wide">
              No Submission Gates Configured
            </h4>
            <p className="text-[11px] text-[#a89a8c] max-w-md mx-auto mt-1">
              Click &ldquo;Auto-Seed 5 Gates&rdquo; to deploy default hackathon checks (Public Repo, Pitch Deck, Video Demo, Architecture Diagram, Teammates Verified), or add custom checkpoints below.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleInitializeDefaults}
            disabled={isInitializing}
            className="rounded-xl text-xs gap-1.5 mx-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Deploy Standard Pre-Flight Checklist</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const isCustom = item.item_key.startsWith("custom_");
            const isPending = togglingId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer text-xs select-none ${
                  item.is_completed
                    ? "border-[rgba(229,169,60,0.15)] bg-[#181410]/60 opacity-80"
                    : "border-[rgba(229,169,60,0.22)] bg-[#181410] hover:border-[rgba(229,169,60,0.40)] shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                      item.is_completed
                        ? "border-[#e5a93c] bg-[#e5a93c] text-[#14110e]"
                        : "border-[rgba(229,169,60,0.3)] bg-[#28231d] text-transparent hover:border-[#e5a93c]"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
                  </div>
                  <span
                    className={`font-medium truncate ${
                      item.is_completed ? "text-[#a89a8c] line-through" : "text-[#fef3c7]"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                  {!isCustom ? (
                    <span className="text-[10px] font-mono uppercase text-[#a89a8c] px-2 py-0.5 rounded border border-[rgba(229,169,60,0.15)] bg-[#28231d]">
                      Standard Gate
                    </span>
                  ) : isCaptain ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteGate(item.id, item.title)}
                      disabled={deletingId === item.id}
                      className="p-1.5 rounded-lg text-[#a89a8c] hover:text-rose-400 hover:bg-rose-950/30 transition-colors flex items-center justify-center shrink-0"
                      title="Delete custom gate"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add custom checkpoint form */}
      <form onSubmit={handleAddGate} className="flex items-center gap-2.5 pt-1">
        <Input
          value={newGateTitle}
          onChange={(e) => setNewGateTitle(e.target.value)}
          placeholder="Add custom pre-flight checkpoint (e.g. Sepolia contract deployed, mobile responsive tested)..."
          className="h-10 text-xs font-mono"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={isAddingGate || !newGateTitle.trim()}
          className="h-10 px-4 rounded-xl text-xs gap-1.5 shrink-0 border-[rgba(229,169,60,0.25)] hover:border-[#e5a93c] text-[#fef3c7]"
        >
          <Plus className="h-3.5 w-3.5 text-[#e5a93c]" />
          <span>{isAddingGate ? "Adding..." : "Add Gate"}</span>
        </Button>
      </form>
    </div>
  );
}
