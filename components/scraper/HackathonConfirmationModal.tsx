"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createHackathonFromScraper } from "@/lib/actions/hackathons";
import { toast } from "sonner";
import { SavedSquad } from "@/types/database";
import { toLocalDatetimeString, parseDateTimeInputToUtc, formatDateTimeIst } from "@/lib/utils";
import {
  X,
  Sparkles,
  Calendar,
  Users,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface ConfirmationModalProps {
  initialData: any;
  isOpen: boolean;
  onClose: () => void;
  savedSquadPresets?: SavedSquad[];
}

export function HackathonConfirmationModal({
  initialData,
  isOpen,
  onClose,
  savedSquadPresets = [],
}: ConfirmationModalProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [prizePool, setPrizePool] = React.useState(initialData?.prize_pool || "TBA");
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [bannerUrl, setBannerUrl] = React.useState(initialData?.banner_url || "");
  const [selectedPresetId, setSelectedPresetId] = React.useState<string>("");
  const [squadName, setSquadName] = React.useState(
    initialData?.title ? `${initialData.title.trim().slice(0, 30)} Squad` : "Alpha Squad"
  );
  const [startsAt, setStartsAt] = React.useState(
    initialData?.starts_at
      ? toLocalDatetimeString(initialData.starts_at)
      : toLocalDatetimeString(new Date())
  );
  const [endsAt, setEndsAt] = React.useState(
    initialData?.ends_at
      ? toLocalDatetimeString(initialData.ends_at)
      : toLocalDatetimeString(new Date(Date.now() + 1000 * 60 * 60 * 48))
  );
  const [maxTeamSize, setMaxTeamSize] = React.useState(4);
  const [notifyTelegram, setNotifyTelegram] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setPrizePool(initialData.prize_pool || "TBA");
      setDescription(initialData.description || "");
      setBannerUrl(initialData.banner_url || "");
      setSquadName(
        initialData.title ? `${initialData.title.trim().slice(0, 30)} Squad` : "Alpha Squad"
      );
      if (initialData.starts_at) {
        setStartsAt(toLocalDatetimeString(initialData.starts_at));
      }
      if (initialData.ends_at) {
        setEndsAt(toLocalDatetimeString(initialData.ends_at));
      }
      setMaxTeamSize(initialData.max_team_size || 4);
      setSelectedPresetId("");
      setNotifyTelegram(true);
    }
  }, [initialData]);

  if (!isOpen || !initialData || !mounted) return null;

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId) {
      const preset = savedSquadPresets.find((p) => p.id === presetId);
      if (preset) {
        setSquadName(preset.name);
      }
    } else {
      setSquadName(
        initialData?.title ? `${initialData.title.trim().slice(0, 30)} Squad` : "Alpha Squad"
      );
    }
  };

  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await createHackathonFromScraper({
        title,
        source_platform: initialData.source_platform,
        source_url: initialData.source_url,
        banner_url: bannerUrl,
        prize_pool: prizePool,
        description,
        starts_at: parseDateTimeInputToUtc(startsAt),
        ends_at: parseDateTimeInputToUtc(endsAt),
        team_name: squadName,
        max_team_size: maxTeamSize,
        timeline_gates: initialData.timeline_gates,
        saved_squad_id: selectedPresetId || undefined,
        notify_telegram: notifyTelegram,
      });

      if (res.error) {
        throw new Error(res.error);
      }

      toast.success("Hackathon added to your dashboard!", {
        description: `Spawned ${title} workspace with initialized countdown.`,
      });

      onClose();
      if (res.hackathonId) {
        router.push(`/dashboard/hackathons/${res.hackathonId}`);
      }
      router.refresh();
    } catch (err: any) {
      toast.error("Save failed", {
        description: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] my-auto rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden flex flex-col z-10 text-parchment">
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between shrink-0 bg-surface-elevated">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface border border-surface-border text-mustard">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-parchment tracking-tight truncate font-mono">
                Confirm Extracted Hackathon
              </h3>
              <p className="text-[11px] text-clay font-mono truncate">
                Source:{" "}
                <span className="uppercase text-mustard font-semibold">
                  {initialData.source_platform}
                </span>{" "}
                ({initialData.extraction_method || "Direct Engine"})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-clay hover:text-parchment rounded-lg hover:bg-surface transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleConfirmAndSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0 custom-scrollbar">
            {/* Banner preview if available */}
            {bannerUrl && (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-surface-border bg-canvas flex items-center justify-center">
                <img
                  src={bannerUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
                />
                <div className="absolute inset-0 bg-canvas/50" />
                <img
                  src={bannerUrl}
                  alt={title}
                  className="relative z-10 max-h-32 max-w-full object-contain p-2 drop-shadow-md"
                />
                <span className="absolute bottom-2 left-3 z-20 text-[10px] font-mono text-parchment bg-canvas/90 px-2 py-0.5 rounded border border-surface-border">
                  Extracted Event Banner
                </span>
              </div>
            )}

            {/* Squad Preset Selector */}
            {savedSquadPresets.length > 0 && (
              <div className="rounded-xl border border-steel/35 bg-steel/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-medium text-steel tracking-wider uppercase flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-steel" />
                    <span>Deploy Saved Squad Preset (Optional)</span>
                  </label>
                  <span className="text-[10px] font-mono text-steel">
                    {savedSquadPresets.length} Presets Available
                  </span>
                </div>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full h-9 rounded-xl border border-steel/35 bg-surface px-3 text-xs text-parchment focus:outline-none focus:border-mustard font-mono"
                >
                  <option value="">-- No preset (Create fresh squad) --</option>
                  {savedSquadPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({preset.members?.length || 0} members)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-clay">
                  Selecting a preset will automatically import your dream team roster upon creation.
                </p>
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
                className="font-mono"
                required
              />
              <Input
                label="Submission Deadline"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="font-mono"
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
                <label className="block text-[11px] font-mono font-medium text-clay tracking-wider uppercase">
                  Squad Capacity
                </label>
                <select
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                  className="w-full h-9 rounded-xl border border-surface-border bg-surface px-3 text-xs text-parchment focus:outline-none focus:border-mustard font-mono"
                >
                  {[1, 2, 3, 4, 5, 6].map((size) => (
                    <option key={size} value={size}>
                      {size === 1 ? "Solo Hacker (1 member)" : `Up to ${size} Teammates`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Telegram Notification Toggle */}
            <div className="rounded-xl border border-surface-border bg-canvas p-3.5 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="notifyTelegram"
                  checked={notifyTelegram}
                  onChange={(e) => setNotifyTelegram(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-surface-border bg-surface text-mustard focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="notifyTelegram"
                  className="text-xs text-parchment select-none cursor-pointer flex flex-col"
                >
                  <span className="font-semibold text-parchment">
                    Ping squad members via Telegram upon deployment
                  </span>
                  <span className="text-[11px] text-clay mt-0.5">
                    Sends direct workspace links and assigned roles so teammates know they were added.
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-medium text-clay tracking-wider uppercase">
                Overview & Tracks
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-canvas p-3 text-xs text-parchment placeholder:text-clay/50 border border-surface-border outline-none focus:border-mustard transition-colors resize-none min-h-[76px]"
              />
            </div>

            {/* Extracted Gates Preview */}
            {initialData.timeline_gates && initialData.timeline_gates.length > 0 && (
              <div className="rounded-xl border border-surface-border bg-canvas p-3 space-y-2">
                <span className="text-[10px] font-mono uppercase text-clay block tracking-wider font-semibold">
                  Detected Timeline Gates ({initialData.timeline_gates.length})
                </span>
                <div className="space-y-1.5">
                  {initialData.timeline_gates.map((gate: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs text-parchment"
                    >
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-mustard" />
                        <span>{gate.title}</span>
                      </span>
                      <span className="text-clay font-mono text-[10px]">
                        {formatDateTimeIst(gate.deadline)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="px-5 py-3.5 border-t border-surface-border bg-surface-elevated flex items-center justify-between gap-3 shrink-0">
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
    </div>,
    document.body
  );
}
