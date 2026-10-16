"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  X,
  FolderGit2,
  Sparkles,
  Code2,
  Layers,
  Video,
  Presentation,
  HardDrive,
  Link2,
} from "lucide-react";
import { createAsset, updateAsset } from "@/lib/actions/assets";
import { Asset, AssetCategory } from "@/types/database";

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  hackathonId: string;
  assetToEdit?: Asset | null;
  onSuccess?: () => void;
}

const CATEGORIES: Array<{
  id: AssetCategory;
  label: string;
  icon: any;
}> = [
  { id: "github", label: "GitHub Repo", icon: Code2 },
  { id: "figma", label: "Figma Canvas", icon: Layers },
  { id: "demo", label: "Demo Video (Loom/YT)", icon: Video },
  { id: "pitch_deck", label: "Pitch Deck (Slides)", icon: Presentation },
  { id: "drive", label: "Google Drive", icon: HardDrive },
  { id: "canva", label: "Canva Design", icon: Sparkles },
  { id: "other", label: "Other Asset", icon: Link2 },
];

export function CreateAssetModal({
  isOpen,
  onClose,
  teamId,
  hackathonId,
  assetToEdit,
  onSuccess,
}: CreateAssetModalProps) {
  const isEditing = Boolean(assetToEdit);

  const [category, setCategory] = React.useState<AssetCategory>(
    assetToEdit?.category || "github"
  );
  const [title, setTitle] = React.useState(assetToEdit?.title || "");
  const [url, setUrl] = React.useState(assetToEdit?.url || "");
  const [description, setDescription] = React.useState(
    assetToEdit?.description || ""
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (assetToEdit) {
      setCategory(assetToEdit.category);
      setTitle(assetToEdit.title);
      setUrl(assetToEdit.url);
      setDescription(assetToEdit.description || "");
    } else {
      setCategory("github");
      setTitle("");
      setUrl("");
      setDescription("");
    }
  }, [assetToEdit, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      toast.error("Please enter a title and URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      if (isEditing && assetToEdit) {
        res = await updateAsset(assetToEdit.id, {
          category,
          title,
          url,
          description,
        });
      } else {
        res = await createAsset({
          teamId,
          hackathonId,
          category,
          title,
          url,
          description,
        });
      }

      if (res.success) {
        toast.success(
          isEditing ? "Asset updated" : "Asset registered to Asset Hub!",
          {
            description: "Your entire squad can now access and review this deliverable.",
          }
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error("Failed to save asset", { description: res.error });
      }
    } catch {
      toast.error("An unexpected error occurred while saving asset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] my-auto rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden flex flex-col z-10 text-parchment">
        {/* Pinned Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated border border-surface-border text-mustard">
              <FolderGit2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-parchment tracking-tight">
                {isEditing ? "Edit Asset" : "Link Project Deliverable"}
              </h2>
              <p className="text-xs text-clay">
                Connect code repos, design prototypes, pitch slides, or video demos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-clay hover:text-parchment hover:bg-surface-elevated transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-parchment">Deliverable Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-mono transition-all text-left ${
                        isSelected
                          ? "border-mustard bg-mustard/20 text-mustard font-semibold shadow-sm"
                          : "border-surface-border bg-canvas text-clay hover:border-mustard/40 hover:text-parchment"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-parchment">Title / Label</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Primary GitHub Monorepo or Figma System"
                required
                className="bg-canvas border-surface-border text-xs text-parchment focus:border-mustard"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-parchment">Target URL</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/..."
                type="url"
                required
                className="bg-canvas border-surface-border text-xs font-mono text-parchment focus:border-mustard"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-parchment">Notes / Instructions (Optional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Branch main contains the Next.js and FastAPI services"
                className="bg-canvas border-surface-border text-xs text-parchment focus:border-mustard"
              />
            </div>
          </div>

          {/* Pinned Footer */}
          <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-surface-border bg-surface shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs rounded-xl text-clay hover:text-parchment hover:bg-surface-elevated"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="text-xs rounded-xl px-4 gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-canvas animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-canvas animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-canvas animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isEditing ? "Update Asset" : "Save Deliverable"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
