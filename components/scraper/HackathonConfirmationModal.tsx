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
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
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
      if (initialData.starts_at) {
        setStartsAt(new Date(initialData.starts_at).toISOString().slice(0, 16));
      }
      if (initialData.ends_at) {
        setEndsAt(new Date(initialData.ends_at).toISOString().slice(0, 16));
      }
      setMaxTeamSize(initialData.max_team_size || 4);
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
      // Redirect with active hackathon ID
      if (res.hackathonId) {
        router.push(`/dashboard?hackathon=${res.hackathonId}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error("Save failed", {
        description: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl my-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white tracking-tight truncate">
                Confirm Extracted Hackathon
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono truncate">
                Source:{" "}
                <span className="uppercase text-emerald-400 font-semibold">
                  {initialData.source_platform}
                </span>{" "}
                ({initialData.extraction_method || "Direct Engine"})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleConfirmAndSave} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Banner preview if available */}
            {bannerUrl && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <img
                  src={bannerUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-3 text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
                  Extracted Event Banner
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Hackathon Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                label="Prize Pool"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                placeholder="e.g. $50,000 or ₹10,00,000"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Default Squad Name"
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                placeholder="e.g. Alpha Squad"
                required
              />
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono font-medium text-zinc-400 tracking-wider uppercase">
                  Squad Capacity
                </label>
                <select
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                  className="w-full h-9 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
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
              <label className="block text-[11px] font-mono font-medium text-zinc-400 tracking-wider uppercase">
                Overview & Tracks
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-zinc-900/60 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 border border-zinc-800 outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {/* Extracted Gates Preview */}
            {initialData.timeline_gates && initialData.timeline_gates.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block tracking-wider font-semibold">
                  Detected Timeline Gates ({initialData.timeline_gates.length})
                </span>
                <div className="space-y-1.5">
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

          {/* Actions Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              loadingText="Deploying..."
              className="gap-2"
            >
              <span>Save & Launch Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
