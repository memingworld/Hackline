"use client";

import * as React from "react";
import { Hackathon, SavedSquad } from "@/types/database";
import { MagicLinkInput } from "@/components/scraper/MagicLinkInput";
import { HackathonConfirmationModal } from "@/components/scraper/HackathonConfirmationModal";
import { EditHackathonDialog } from "@/components/dashboard/EditHackathonDialog";
import { ManualHackathonForm } from "@/components/scraper/ManualHackathonForm";
import { deleteHackathon } from "@/lib/actions/hackathons";
import {
  Trophy,
  Calendar,
  Sparkles,
  Edit3,
  ExternalLink,
  ArrowRight,
  Trash2,
  Clock,
  Info,
  X,
  CheckCircle2,
  Users,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface HackathonsManagerProps {
  initialHackathons: Hackathon[];
  savedSquadPresets?: SavedSquad[];
  activeHackathonId?: string;
}

export function HackathonsManager({
  initialHackathons,
  savedSquadPresets = [],
  activeHackathonId,
}: HackathonsManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"magic" | "manual">("magic");
  const [extractedData, setExtractedData] = React.useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [editingHackathon, setEditingHackathon] = React.useState<Hackathon | null>(null);
  const [inspectingHackathon, setInspectingHackathon] = React.useState<Hackathon | null>(null);
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);

  const handleScrapeSuccess = (data: any) => {
    setExtractedData(data);
    setIsConfirmOpen(true);
  };

  const handleOpenWorkspace = (hackathonId: string) => {
    router.push(`/dashboard/hackathons/${hackathonId}`);
  };

  const handleDelete = async (e: React.MouseEvent, hackathon: Hackathon) => {
    e.stopPropagation();
    if (
      !confirm(
        `Are you sure you want to delete "${hackathon.title}"? This will remove all associated sprint milestones and gates.`
      )
    ) {
      return;
    }

    setIsDeletingId(hackathon.id);
    try {
      const res = await deleteHackathon(hackathon.id);
      if (res.success) {
        toast.success("Hackathon removed successfully");
        if (inspectingHackathon?.id === hackathon.id) {
          setInspectingHackathon(null);
        }
        router.refresh();
      } else {
        toast.error("Failed to delete hackathon", { description: res.error });
      }
    } catch {
      toast.error("An error occurred while deleting hackathon");
    } finally {
      setIsDeletingId(null);
    }
  };

  const getRemainingTime = (endsAt: string) => {
    const diffHours = Math.round(
      (new Date(endsAt).getTime() - Date.now()) / (1000 * 60 * 60)
    );
    if (diffHours <= 0) return { label: "Concluded", urgent: false };
    if (diffHours <= 24) return { label: `T-${diffHours}h left`, urgent: true };
    const days = Math.round(diffHours / 24);
    return { label: `${days} days left`, urgent: false };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hackathon Onboarding Card with Doppelrand and Tab Switcher */}
      <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-[1px] shadow-2xl">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#090a0f]/95 p-6 sm:p-8 space-y-6 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-10 -translate-y-1/2 w-80 h-32 bg-emerald-500/[0.06] blur-[90px] pointer-events-none rounded-full" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 border border-white/[0.08] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                {activeTab === "magic" ? (
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                ) : (
                  <PlusCircle className="h-4 w-4 text-emerald-400" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  {activeTab === "magic"
                    ? "Magic Link Scraper"
                    : "Manual Hackathon Creation"}
                </h2>
                <p className="text-xs text-zinc-400">
                  {activeTab === "magic"
                    ? "Paste any URL from Devpost, Devfolio, Unstop, or Luma to extract prizes and deadlines."
                    : "Initialize custom, in-person, university, or private sprint workspaces without a URL."}
                </p>
              </div>
            </div>

            {/* Tab Switcher Pills */}
            <div className="flex items-center bg-zinc-900/90 border border-white/[0.08] p-1 rounded-2xl shrink-0 self-start sm:self-auto shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("magic")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === "magic"
                    ? "bg-white/10 text-white shadow-sm border border-white/10 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Magic Scraper</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === "manual"
                    ? "bg-white/10 text-white shadow-sm border border-white/10 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Manual Entry</span>
              </button>
            </div>
          </div>

          <div className="relative z-10 pt-1">
            {activeTab === "magic" ? (
              <MagicLinkInput onScrapeSuccess={handleScrapeSuccess} />
            ) : (
              <ManualHackathonForm onSuccess={() => router.refresh()} />
            )}
          </div>
        </div>
      </div>

      {/* Tracked Hackathons Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Tracked Hackathons ({initialHackathons.length})
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              Click any hackathon to inspect details or set as your active sprint command center.
            </p>
          </div>
        </div>

        {initialHackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialHackathons.map((h) => {
              const isActive = h.id === activeHackathonId;
              const remaining = getRemainingTime(h.ends_at);

              return (
                <div
                  key={h.id}
                  onClick={() => handleOpenWorkspace(h.id)}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between group shadow-sm cursor-pointer relative ${
                    isActive
                      ? "border-emerald-500/50 bg-gradient-to-b from-emerald-950/20 to-zinc-950/80 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                      : "border-white/[0.08] bg-zinc-950/60 hover:border-white/[0.2] hover:bg-zinc-900/60"
                  }`}
                >
                  <div>
                    {/* Top Row Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
                          {h.source_platform}
                        </span>

                        {isActive && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active Sprint
                          </span>
                        )}
                      </div>

                      {h.prize_pool && (
                        <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
                          {h.prize_pool}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors line-clamp-1">
                      {h.title}
                    </h4>

                    {h.description && (
                      <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {h.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Footer Actions */}
                  <div className="mt-5 pt-3.5 border-t border-zinc-900 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      <span className={remaining.urgent ? "text-amber-400 font-bold" : "text-zinc-400"}>
                        {remaining.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenWorkspace(h.id)}
                        className="px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-[11px] font-medium flex items-center gap-1 transition-colors"
                        title="Open Dedicated Workspace"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>

                      <button
                        onClick={() => setInspectingHackathon(h)}
                        className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Inspect Full Details"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setEditingHackathon(h)}
                        className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Edit Details"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(e, h)}
                        disabled={isDeletingId === h.id}
                        className="p-1.5 rounded-lg border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete Hackathon"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {h.source_url && (
                        <a
                          href={h.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Open Official Portal"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 space-y-3">
            <Trophy className="h-9 w-9 mx-auto text-zinc-600" />
            <h4 className="text-sm font-semibold text-zinc-300">
              No hackathons saved yet
            </h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Use the Magic Link Scraper above to paste a link from Devpost, Devfolio, or Unstop to initialize your workspace.
            </p>
          </div>
        )}
      </div>

      {/* Inspect Hackathon Details Modal */}
      {inspectingHackathon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-lg my-8 rounded-3xl bg-[#0a0b10]/95 border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-2xl ring-1 ring-white/[0.05]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-white/[0.08] text-amber-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    Hackathon Specification
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Platform metadata and sprint configuration.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingHackathon(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Top Banner or Badges */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
                  {inspectingHackathon.source_platform}
                </span>
                {inspectingHackathon.prize_pool && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    Prize: {inspectingHackathon.prize_pool}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {inspectingHackathon.title}
                </h3>
                {inspectingHackathon.description && (
                  <p className="mt-2 text-xs text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-900/40 border border-zinc-850 p-3 rounded-xl">
                    {inspectingHackathon.description}
                  </p>
                )}
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block uppercase">Starts</span>
                  <span className="text-zinc-200 mt-0.5 block">
                    {new Date(inspectingHackathon.starts_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block uppercase">Submission Deadline</span>
                  <span className="text-zinc-200 mt-0.5 block">
                    {new Date(inspectingHackathon.ends_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Official Link */}
              {inspectingHackathon.source_url && (
                <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-850 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 truncate max-w-xs font-mono text-[11px]">
                    {inspectingHackathon.source_url}
                  </span>
                  <a
                    href={inspectingHackathon.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-white hover:underline shrink-0"
                  >
                    <span>Open Portal</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-white/[0.06] bg-zinc-950/60 flex items-center justify-between gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleDelete(e, inspectingHackathon)}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border-zinc-800"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span>Delete Event</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const h = inspectingHackathon;
                    setInspectingHackathon(null);
                    setEditingHackathon(h);
                  }}
                  className="text-xs rounded-xl"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  <span>Edit</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleOpenWorkspace(inspectingHackathon.id);
                  }}
                  className="text-xs rounded-xl gap-1.5"
                >
                  <span>Open Dedicated Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && extractedData && (
        <HackathonConfirmationModal
          initialData={extractedData}
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          savedSquadPresets={savedSquadPresets}
        />
      )}

      {/* Edit/Delete Modal */}
      {editingHackathon && (
        <EditHackathonDialog
          hackathon={editingHackathon}
          isOpen={!!editingHackathon}
          onClose={() => setEditingHackathon(null)}
          onSuccess={() => {
            setEditingHackathon(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
