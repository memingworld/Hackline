"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createHackathon } from "@/lib/actions/hackathons";
import { toast } from "sonner";
import { toLocalDatetimeString } from "@/lib/utils";
import {
  Trophy,
  Calendar,
  Users,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  Rocket,
  Globe,
  Sparkles,
} from "lucide-react";

const PLATFORM_OPTIONS = [
  { id: "custom", label: "Custom / In-House", icon: "🏢" },
  { id: "in_person", label: "In-Person Meet", icon: "📍" },
  { id: "devpost", label: "Devpost", icon: "🌐" },
  { id: "devfolio", label: "Devfolio", icon: "⚡" },
  { id: "unstop", label: "Unstop", icon: "🎯" },
  { id: "luma", label: "Luma", icon: "✨" },
];

export function ManualHackathonForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();

  const getDefaultDates = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    return {
      startStr: toLocalDatetimeString(now),
      endStr: toLocalDatetimeString(end),
    };
  };

  const { startStr, endStr } = React.useMemo(() => getDefaultDates(), []);

  const [title, setTitle] = React.useState("");
  const [platform, setPlatform] = React.useState("custom");
  const [prizePool, setPrizePool] = React.useState("");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [bannerUrl, setBannerUrl] = React.useState("");
  const [startsAt, setStartsAt] = React.useState(startStr);
  const [endsAt, setEndsAt] = React.useState(endStr);
  const [squadName, setSquadName] = React.useState("");
  const [maxTeamSize, setMaxTeamSize] = React.useState(4);
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!squadName || squadName.endsWith("Squad")) {
      const clean = val.trim().slice(0, 16);
      setSquadName(clean ? `${clean} Squad` : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a hackathon title.");
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (endDate <= startDate) {
      toast.error("Submission deadline must be after the start time.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createHackathon({
        title: title.trim(),
        source_platform: platform === "in_person" ? "custom" : platform,
        source_url: sourceUrl.trim() || null,
        banner_url: bannerUrl.trim() || null,
        prize_pool: prizePool.trim() || "TBA",
        description: description.trim() || null,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        team_name: squadName.trim() || `${title.trim().slice(0, 15)} Squad`,
        max_team_size: maxTeamSize,
      });

      if (res.success && res.hackathonId) {
        toast.success("Hackathon workspace created!", {
          description: `Initialized ${title.trim()} and configured initial squad.`,
        });

        if (onSuccess) onSuccess();
        router.push(`/dashboard/hackathons/${res.hackathonId}`);
      } else {
        toast.error("Failed to create hackathon", {
          description: res.error || "An unknown error occurred.",
        });
      }
    } catch {
      toast.error("Error creating hackathon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Platform Selector Tabs */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono uppercase text-[#a89a8c] tracking-wider block">
          Event Category / Host Platform
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {PLATFORM_OPTIONS.map((p) => {
            const isSelected = platform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-mono transition-all text-left ${
                  isSelected
                    ? "bg-[#e5a93c]/15 text-[#fef3c7] border-[#e5a93c]/50 font-bold shadow-sm"
                    : "bg-[#181410] border-[rgba(229,169,60,0.18)] text-[#a89a8c] hover:text-[#fef3c7] hover:border-[rgba(229,169,60,0.35)]"
                }`}
              >
                <span>{p.icon}</span>
                <span className="truncate">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[11px] font-mono uppercase text-[#a89a8c] tracking-wider flex items-center gap-1">
            <Trophy className="h-3 w-3 text-[#e5a93c]" />
            <span>Hackathon Title</span>
          </label>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. ETHGlobal Hackathon or Unstop Tech Challenge"
            required
          />
        </div>

        {/* Prize Pool */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-[#a89a8c] tracking-wider">
            Prize Pool
          </label>
          <Input
            value={prizePool}
            onChange={(e) => setPrizePool(e.target.value)}
            placeholder="e.g. $50,000 or ₹10,00,000"
          />
        </div>

        {/* Source URL */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-[#a89a8c] tracking-wider flex items-center gap-1">
            <LinkIcon className="h-3 w-3 text-[#e5a93c]" />
            <span>Event Portal URL (Optional)</span>
          </label>
          <Input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://devpost.com/..."
            className="font-mono"
          />
        </div>

        {/* Start Time */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-[#a89a8c] tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[#a89a8c]" />
            <span>Start Date & Time</span>
          </label>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            style={{ colorScheme: "dark" }}
            className="font-mono"
            required
          />
        </div>

        {/* End Time */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-[#a89a8c] tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[#e5a93c]" />
            <span>Submission Deadline</span>
          </label>
          <Input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            style={{ colorScheme: "dark" }}
            className="font-mono"
            required
          />
        </div>

        {/* Squad Name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-[#a89a8c] tracking-wider flex items-center gap-1">
            <Users className="h-3 w-3 text-[#e5a93c]" />
            <span>Initial Squad Name</span>
          </label>
          <Input
            value={squadName}
            onChange={(e) => setSquadName(e.target.value)}
            placeholder="e.g. Apex Squad"
            className="font-mono"
          />
        </div>

        {/* Max Team Size */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-[#a89a8c] tracking-wider">
            Max Team Size
          </label>
          <Input
            type="number"
            min={1}
            max={10}
            value={maxTeamSize}
            onChange={(e) => setMaxTeamSize(Number(e.target.value) || 4)}
            className="font-mono"
          />
        </div>

        {/* Banner URL */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[11px] font-mono uppercase text-[#a89a8c] tracking-wider flex items-center gap-1">
            <ImageIcon className="h-3 w-3 text-[#a89a8c]" />
            <span>Banner / Poster Image URL (Optional)</span>
          </label>
          <Input
            type="url"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder="https://images.unsplash.com/... or hosted poster link"
            className="font-mono"
          />
        </div>

        {/* Description / Problem Statement */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[11px] font-mono uppercase text-[#a89a8c] tracking-wider">
            Description / Tracks Focus (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief overview of challenges, problem statements, track requirements, or team objectives..."
            className="w-full rounded-xl bg-[#181410] border border-[rgba(229,169,60,0.20)] p-3 text-xs text-[#fef3c7] placeholder:text-[#a89a8c]/50 focus:outline-none focus:border-[#e5a93c] transition-all font-mono resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(229,169,60,0.15)]">
        <p className="text-[11px] text-[#a89a8c] font-mono">
          Will automatically generate captain workspace, timeline gates, and sprint checklist.
        </p>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={!title.trim() || isSubmitting}
          className="rounded-xl px-5 h-10 text-xs font-semibold gap-2"
        >
          <Rocket className="h-3.5 w-3.5" />
          <span>Deploy Hackathon</span>
        </Button>
      </div>
    </form>
  );
}
