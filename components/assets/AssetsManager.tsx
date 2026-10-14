"use client";

import * as React from "react";
import { Asset, AssetCategory } from "@/types/database";
import { FolderGit2, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetCard } from "./AssetCard";
import { CreateAssetModal } from "./CreateAssetModal";
import { useRouter } from "next/navigation";

interface AssetsManagerProps {
  assets: Asset[];
  teamId: string;
  hackathonId: string;
}

export function AssetsManager({ assets, teamId, hackathonId }: AssetsManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [assetToEdit, setAssetToEdit] = React.useState<Asset | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const categories = [
    { id: "all", label: "All Deliverables" },
    { id: "github", label: "GitHub Repos" },
    { id: "figma", label: "Figma Canvases" },
    { id: "demo", label: "Demo Videos" },
    { id: "pitch_deck", label: "Pitch Decks" },
    { id: "drive", label: "Cloud Drives" },
  ];

  const filteredAssets = React.useMemo(() => {
    if (selectedCategory === "all") return assets;
    return assets.filter((a) => a.category === selectedCategory);
  }, [assets, selectedCategory]);

  const handleOpenCreate = () => {
    setAssetToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setAssetToEdit(asset);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
          <Filter className="h-3.5 w-3.5 text-zinc-500 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "bg-zinc-950/60 text-zinc-400 border border-zinc-850 hover:text-zinc-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          className="rounded-xl text-xs gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Link Asset</span>
        </Button>
      </div>

      {/* Grid or Empty State */}
      {filteredAssets.length === 0 ? (
        <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl">
          <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/80 p-8 flex flex-col items-center justify-center text-center min-h-[260px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
              <FolderGit2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No Deliverables Linked Yet</h4>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm">
              Keep your GitHub repositories, Figma files, Pitch Slides, and Loom demos organized in one central squad hub.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenCreate}
              className="mt-5 rounded-xl text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Link First Deliverable</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onEdit={handleOpenEdit}
              onRefresh={() => router.refresh()}
            />
          ))}
        </div>
      )}

      <CreateAssetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        teamId={teamId}
        hackathonId={hackathonId}
        assetToEdit={assetToEdit}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
