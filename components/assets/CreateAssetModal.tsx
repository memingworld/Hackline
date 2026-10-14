"use client";

import * as React from "react";
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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg max-h-[86vh] rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col z-10">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <FolderGit2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {isEditing ? "Edit Asset" : "Link Project Deliverable"}
              </h2>
              <p className="text-xs text-zinc-400">
                Connect code repos, design prototypes, pitch slides, or video demos.
              </p>
            </div>
          </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Deliverable Category</label>
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
                          ? "border-indigo-500 bg-indigo-500/15 text-indigo-300 font-semibold shadow-sm shadow-indigo-500/20"
                          : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
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
              <label className="text-xs font-medium text-zinc-300">Title / Label</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Primary GitHub Monorepo or Figma System"
                required
                className="bg-zinc-900/60 border-zinc-800 text-xs focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Target URL</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/..."
                type="url"
                required
                className="bg-zinc-900/60 border-zinc-800 text-xs font-mono focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Notes / Instructions (Optional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Branch main contains the Next.js and FastAPI services"
                className="bg-zinc-900/60 border-zinc-800 text-xs focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs rounded-xl"
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
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
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
      </div>
    );
  }
