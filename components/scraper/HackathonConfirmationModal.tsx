"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createHackathonFromScraper } from "@/lib/actions/hackathons";
import { toast } from "sonner";
import {
  X,
  Sparkles,
  Trophy,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface ConfirmationModalProps {
  initialData: any;
  isOpen: boolean;
  onClose: () => void;
}

export function HackathonConfirmationModal({
  initialData,
  isOpen,
  onClose,
}: ConfirmationModalProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [prizePool, setPrizePool] = React.useState(initialData?.prize_pool || "TBA");
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [bannerUrl, setBannerUrl] = React.useState(initialData?.banner_url || "");
  const [squadName, setSquadName] = React.useState(
    initialData?.title ? `${initialData.title.slice(0, 16)} Squad` : "Alpha Squad"
  );
  const [startsAt, setStartsAt] = React.useState(
    initialData?.starts_at
      ? new Date(initialData.starts_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [endsAt, setEndsAt] = React.useState(
    initialData?.ends_at
      ? new Date(initialData.ends_at).toISOString().slice(0, 16)
      : new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().slice(0, 16)
  );
  const [maxTeamSize, setMaxTeamSize] = React.useState(4);

  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setPrizePool(initialData.prize_pool || "TBA");
      setDescription(initialData.description || "");
      setBannerUrl(initialData.banner_url || "");
      setSquadName(
        initialData.title ? `${initialData.title.slice(0, 16)} Squad` : "Alpha Squad"
      );
      setMaxTeamSize(4);
    }
  }, [initialData]);

  if (!isOpen || !initialData) return null;

  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await createHackathonFromScraper({
        title,
        source_platform: initialData.source_platform || "custom",
        source_url: initialData.source_url,
        banner_url: bannerUrl || null,
        prize_pool: prizePool,
        description,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        team_name: squadName,
        min_team_size: 1,
        max_team_size: maxTeamSize,
        timeline_gates: initialData.timeline_gates || [],
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to save hackathon.");
      }

      toast.success("Hackathon & Squad Initialized!", {
        description: `Deployed "${title}" with captain squad "${squadName}".`,
      });

      onClose();
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("Save failed", {
        description: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[2rem] p-1.5 bg-gradient-to-b from-white/15 to-white/5 border border-white/10 ring-1 ring-white/10 shadow-2xl relative my-auto">
        <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-950 p-5 sm:p-7 flex flex-col max-h-[calc(92vh-12px)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/30 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Confirm Extracted Hackathon
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Extracted via {initialData.extraction_method || "Magic Engine"} (
                  <span className="uppercase text-indigo-400">
                    {initialData.source_platform}
                  </span>
                  )
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleConfirmAndSave} className="flex flex-col overflow-hidden flex-1 pt-4">
            <div className="overflow-y-auto space-y-4 pr-1.5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Hackathon Name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <Input
                  label="Prize Pool"
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  placeholder="e.g. $100,000 or ₹5,00,000"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Sprint Starts At"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  required
                />
                <Input
                  label="Submission Deadline"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  style={{ colorScheme: "dark" }}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Default Squad Name"
                  value={squadName}
                  onChange={(e) => setSquadName(e.target.value)}
                  placeholder="e.g. Vanguard Alpha"
                  required
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wide">
                    Max Team Capacity
                  </label>
                  <select
                    value={maxTeamSize}
                    onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {[1, 2, 3, 4, 5, 6].map((size) => (
                      <option key={size} value={size}>
                        {size === 1 ? "Solo Hacker (1 member)" : `Up to ${size} Teammates`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wide">
                  Overview & Tracks
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900/60 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 border border-zinc-800/80 outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Extracted Milestone Gates Preview */}
              {initialData.timeline_gates && initialData.timeline_gates.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 space-y-2">
                  <span className="text-[11px] font-mono uppercase text-zinc-400 block tracking-wider font-semibold">
                    Detected Timeline Gates ({initialData.timeline_gates.length})
                  </span>
                  <div className="space-y-1">
                    {initialData.timeline_gates.map((gate: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs text-zinc-300"
                      >
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{gate.title}</span>
                        </span>
                        <span className="text-zinc-500 font-mono text-[10px]">
                          {new Date(gate.deadline).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0 mt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
                loadingText="Deploying Command Center..."
                className="text-xs gap-2"
              >
                <span>Save & Launch Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
