"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createHackathon } from "@/lib/actions/hackathons";
import { toast } from "sonner";
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

  // Helper for datetime-local ISO format
  const getDefaultDates = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const startStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    return { startStr, endStr };
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

  // Auto-sync squad name when title changes if user hasn't explicitly customized it
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
        min_team_size: 1,
        max_team_size: Math.max(1, Math.min(10, maxTeamSize)),
      });

      if (!res.success || !res.hackathonId) {
        throw new Error(res.error || "Failed to create hackathon.");
      }

      toast.success("Hackathon & Workspace Initialized!", {
        description: `Created "${title}" with command center ready.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      router.push(`/dashboard/hackathons/${res.hackathonId}`);
      router.refresh();
    } catch (err: any) {
      toast.error("Creation failed", {
        description: err.message || "Could not initialize hackathon.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      {/* Platform & Format Tag Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
          Event Format / Platform
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((opt) => {
            const isSelected = platform === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPlatform(opt.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-semibold shadow-sm ring-1 ring-emerald-500/20"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1">
            <span>Hackathon Title</span>
            <span className="text-emerald-400">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. TreeHacks 2026, AI Agents Sprint, Campus Hackathon"
            className="h-11 bg-zinc-900/60 border-zinc-800 text-sm focus:border-zinc-500 font-mono"
            required
          />
        </div>

        {/* Prize Pool */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1">
            <Trophy className="h-3 w-3 text-amber-400" />
            <span>Prize Pool</span>
          </label>
          <Input
            value={prizePool}
            onChange={(e) => setPrizePool(e.target.value)}
            placeholder="e.g. $25,000, ₹2,00,000, or TBA"
            className="h-10 bg-zinc-900/60 border-zinc-800 text-xs focus:border-zinc-500 font-mono"
          />
        </div>

        {/* Portal / Official Link */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1">
            <LinkIcon className="h-3 w-3 text-zinc-400" />
            <span>Website / Portal URL (Optional)</span>
          </label>
          <Input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://event.example.com"
            className="h-10 bg-zinc-900/60 border-zinc-800 text-xs focus:border-zinc-500 font-mono"
          />
        </div>

        {/* Start Time */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3 text-zinc-400" />
            <span>Start Date & Time</span>
          </label>
          <Input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="h-10 bg-zinc-900/60 border-zinc-800 text-xs focus:border-zinc-500 font-mono text-zinc-200"
            required
          />
        </div>

        {/* End Time */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1">
            <Calendar className="h-3 w-3 text-emerald-400" />
            <span>Submission Deadline</span>
          </label>
          <Input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="h-10 bg-zinc-900/60 border-zinc-800 text-xs focus:border-zinc-500 font-mono text-zinc-200"
            required
          />
        </div>

        {/* Squad Name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1">
            <Users className="h-3 w-3 text-zinc-400" />
            <span>Initial Squad Name</span>
          </label>
          <Input
            value={squadName}
            onChange={(e) => setSquadName(e.target.value)}
            placeholder="e.g. Apex Squad"
            className="h-10 bg-zinc-900/60 border-zinc-800 text-xs focus:border-zinc-500 font-mono"
          />
        </div>

        {/* Max Team Size */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
            Max Team Size
          </label>
          <Input
            type="number"
            min={1}
            max={10}
            value={maxTeamSize}
            onChange={(e) => setMaxTeamSize(Number(e.target.value) || 4)}
            className="h-10 bg-zinc-900/60 border-zinc-800 text-xs focus:border-zinc-500 font-mono"
          />
        </div>

        {/* Banner URL */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1">
            <ImageIcon className="h-3 w-3 text-zinc-400" />
            <span>Banner / Poster Image URL (Optional)</span>
          </label>
          <Input
            type="url"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder="https://images.unsplash.com/... or hosted poster link"
            className="h-10 bg-zinc-900/60 border-zinc-800 text-xs focus:border-zinc-500 font-mono"
          />
        </div>

        {/* Description / Problem Statement */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
            Description / Tracks Focus (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief overview of challenges, problem statements, track requirements, or team objectives..."
            className="w-full rounded-xl bg-zinc-900/60 border border-zinc-800 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30 transition-all font-mono resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
        <p className="text-[11px] text-zinc-500 font-mono">
          Will automatically generate captain workspace, timeline gates, and sprint checklist.
        </p>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={!title.trim() || isSubmitting}
          className="rounded-xl px-5 h-10 text-xs font-semibold gap-2 shadow-lg shadow-emerald-500/10"
        >
          <Rocket className="h-3.5 w-3.5" />
          <span>Deploy Hackathon</span>
        </Button>
      </div>
    </form>
  );
}
