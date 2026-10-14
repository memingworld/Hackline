"use client";

import * as React from "react";
import { Asset, AssetCategory } from "@/types/database";
import {
  Code2,
  Layers,
  Video,
  Presentation,
  HardDrive,
  Link2,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteAsset } from "@/lib/actions/assets";

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onRefresh: () => void;
}

const CATEGORY_CONFIG: Record<
  AssetCategory,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  github: {
    label: "Code Repository",
    icon: Code2,
    color: "text-zinc-200",
    bg: "bg-zinc-800/60",
    border: "border-zinc-700/80",
  },
  figma: {
    label: "Figma Prototype",
    icon: Layers,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  canva: {
    label: "Canva Design",
    icon: Sparkles,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  demo: {
    label: "Video Walkthrough",
    icon: Video,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
  pitch_deck: {
    label: "Pitch Presentation",
    icon: Presentation,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  drive: {
    label: "Google Drive Folder",
    icon: HardDrive,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  other: {
    label: "External Link",
    icon: Link2,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
  },
};

export function AssetCard({ asset, onEdit, onRefresh }: AssetCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const config = CATEGORY_CONFIG[asset.category] || CATEGORY_CONFIG.other;
  const Icon = config.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(asset.url);
    setCopied(true);
    toast.success("Asset URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove "${asset.title}"?`)) return;
    setIsDeleting(true);
    try {
      const res = await deleteAsset(asset.id);
      if (res.success) {
        toast.success("Asset deleted");
        onRefresh();
      } else {
        toast.error("Failed to delete asset", { description: res.error });
      }
    } catch {
      toast.error("Error deleting asset");
    } finally {
      setIsDeleting(false);
    }
  };

  const getDomain = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  return (
    <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl hover:border-zinc-700/80 transition-all flex flex-col justify-between">
      <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-950 p-6 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${config.bg} ${config.border} ${config.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block">
                  {config.label}
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                  {asset.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(asset)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Edit asset"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                title="Delete asset"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {asset.description && (
            <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">
              {asset.description}
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3.5 border-t border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 truncate max-w-[170px]">
            <span>{getDomain(asset.url)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-[11px] font-mono text-zinc-300 transition-colors"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3 text-zinc-400" />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-[11px] font-mono text-indigo-300 transition-colors"
            >
              <span>Launch</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
