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
    color: "text-[#fef3c7]",
    bg: "bg-[#28231d]",
    border: "border-[rgba(229,169,60,0.25)]",
  },
  figma: {
    label: "Figma Prototype",
    icon: Layers,
    color: "text-[#e5a93c]",
    bg: "bg-[#e5a93c]/15",
    border: "border-[rgba(229,169,60,0.35)]",
  },
  canva: {
    label: "Canva Design",
    icon: Sparkles,
    color: "text-[#7bb4d6]",
    bg: "bg-[#4a82a6]/15",
    border: "border-[rgba(74,130,166,0.35)]",
  },
  demo: {
    label: "Video Walkthrough",
    icon: Video,
    color: "text-[#e5a93c]",
    bg: "bg-[#e5a93c]/15",
    border: "border-[rgba(229,169,60,0.35)]",
  },
  pitch_deck: {
    label: "Pitch Presentation",
    icon: Presentation,
    color: "text-[#fef3c7]",
    bg: "bg-[#28231d]",
    border: "border-[rgba(229,169,60,0.25)]",
  },
  drive: {
    label: "Google Drive Folder",
    icon: HardDrive,
    color: "text-[#7bb4d6]",
    bg: "bg-[#4a82a6]/15",
    border: "border-[rgba(74,130,166,0.35)]",
  },
  other: {
    label: "External Deliverable",
    icon: Link2,
    color: "text-[#a89a8c]",
    bg: "bg-[#181410]",
    border: "border-[rgba(229,169,60,0.2)]",
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
    <div className="rounded-2xl border border-[rgba(229,169,60,0.2)] bg-[#1f1b16] p-5 hover:border-[rgba(229,169,60,0.38)] transition-all flex flex-col justify-between shadow-sm">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${config.bg} ${config.border} ${config.color}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#a89a8c] block">
                {config.label}
              </span>
              <h3 className="text-sm font-bold text-[#fef3c7] tracking-tight leading-snug">
                {asset.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(asset)}
              className="p-1.5 rounded-lg text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d] transition-colors"
              title="Edit asset"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-[#a89a8c] hover:text-[#e06c75] hover:bg-[#e06c75]/10 transition-colors flex items-center justify-center shrink-0"
              title="Delete asset"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {asset.description && (
          <p className="text-xs text-[#a89a8c] leading-relaxed mb-4 line-clamp-2">
            {asset.description}
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="mt-4 pt-3.5 border-t border-[rgba(229,169,60,0.15)] flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#a89a8c]/70 truncate max-w-[170px]">
          <span>{getDomain(asset.url)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-[rgba(229,169,60,0.2)] bg-[#181410] hover:bg-[#28231d] text-[11px] font-mono text-[#a89a8c] hover:text-[#fef3c7] transition-colors"
          >
            {copied ? (
              <Check className="h-3 w-3 text-[#e5a93c]" />
            ) : (
              <Copy className="h-3 w-3 text-[#a89a8c]" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-[rgba(229,169,60,0.3)] bg-[#28231d] hover:bg-[#e5a93c]/15 text-[11px] font-mono text-[#fef3c7] hover:border-[#e5a93c]/40 transition-colors"
          >
            <span>Launch</span>
            <ExternalLink className="h-3 w-3 text-[#e5a93c]" />
          </a>
        </div>
      </div>
    </div>
  );
}
