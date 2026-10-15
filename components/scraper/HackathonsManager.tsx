"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
}

export function HackathonsManager({
  initialHackathons,
  savedSquadPresets = [],
}: HackathonsManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"magic" | "manual">("magic");
  const [extractedData, setExtractedData] = React.useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [editingHackathon, setEditingHackathon] = React.useState<Hackathon | null>(null);
  const [inspectingHackathon, setInspectingHackathon] = React.useState<Hackathon | null>(null);
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && inspectingHackathon) {
        setInspectingHackathon(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectingHackathon]);

  const handleScrapeSuccess = (data: any) => {
    setExtractedData(data);
    setIsConfirmOpen(true);
  };

  const handleOpenWorkspace = (hackathonId: string) => {
    router.push(`/dashboard/hackathons/${hackathonId}`);
  };

  const handleDelete = async (e: React.MouseEvent, hackathon: Hackathon) => {
    e.stopPropagation();
    e.preventDefault();
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
      {/* Hackathon Onboarding Card */}
      <div className="rounded-2xl border border-[rgba(229,169,60,0.20)] bg-[#1f1b16] p-5 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] shadow-sm">
              {activeTab === "magic" ? (
                <Sparkles className="h-5 w-5" />
              ) : (
                <PlusCircle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#fef3c7] tracking-tight font-mono">
                {activeTab === "magic"
                  ? "Magic Link Scraper"
                  : "Manual Hackathon Creation"}
              </h2>
              <p className="text-xs text-[#a89a8c]">
                {activeTab === "magic"
                  ? "Paste any URL from Devpost, Devfolio, Unstop, or Luma to extract prizes and deadlines."
                  : "Initialize custom, in-person, university, or private sprint workspaces without a URL."}
              </p>
            </div>
          </div>

          {/* Tab Switcher Pills */}
          <div className="flex items-center bg-[#181410] border border-[rgba(229,169,60,0.20)] p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("magic")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === "magic"
                  ? "bg-[#e5a93c]/15 text-[#fef3c7] border border-[#e5a93c]/35 font-semibold shadow-sm"
                  : "text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#e5a93c]" />
              <span>Magic Scraper</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeTab === "manual"
                  ? "bg-[#e5a93c]/15 text-[#fef3c7] border border-[#e5a93c]/35 font-semibold shadow-sm"
                  : "text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d]"
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5 text-[#e5a93c]" />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>

        <div className="pt-1">
          {activeTab === "magic" ? (
            <MagicLinkInput onScrapeSuccess={handleScrapeSuccess} />
          ) : (
            <ManualHackathonForm onSuccess={() => router.refresh()} />
          )}
        </div>
      </div>

      {/* Tracked Hackathons Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#fef3c7] tracking-tight font-mono">
              Tracked Hackathons ({initialHackathons.length})
            </h3>
            <p className="text-xs text-[#a89a8c] font-mono">
              Click any hackathon card to open its dedicated sprint workspace.
            </p>
          </div>
        </div>

        {initialHackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialHackathons.map((h) => {
              const remaining = getRemainingTime(h.ends_at);

              return (
                <div
                  key={h.id}
                  onClick={() => handleOpenWorkspace(h.id)}
                  className="rounded-2xl border border-[rgba(229,169,60,0.20)] bg-[#1f1b16] hover:border-[#e5a93c]/50 hover:bg-[#231e18] p-5 transition-all flex flex-col justify-between group shadow-lg cursor-pointer relative"
                >
                  <div>
                    {/* Top Row Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6] font-semibold">
                          {h.source_platform}
                        </span>

                        {(() => {
                          const now = Date.now();
                          const starts = new Date(h.starts_at).getTime();
                          const ends = new Date(h.ends_at).getTime();
                          if (!isNaN(starts) && !isNaN(ends) && starts <= now && now <= ends) {
                            return (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#e5a93c]/40 bg-[#e5a93c]/15 text-[#e5a93c] flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#e5a93c] animate-pulse" />
                                Live Sprint
                              </span>
                            );
                          }
                          if (!isNaN(starts) && starts > now) {
                            return (
                              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6]">
                                Upcoming
                              </span>
                            );
                          }
                          return (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[rgba(229,169,60,0.15)] bg-[#181410] text-[#a89a8c]">
                              Concluded
                            </span>
                          );
                        })()}
                      </div>

                      {h.prize_pool && (
                        <span className="text-[10px] font-mono font-bold text-[#e5a93c] bg-[#e5a93c]/10 border border-[#e5a93c]/25 px-2 py-0.5 rounded shrink-0">
                          {h.prize_pool}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-[#fef3c7] group-hover:text-[#e5a93c] transition-colors line-clamp-1 font-mono">
                      {h.title}
                    </h4>

                    {h.description && (
                      <p className="mt-1.5 text-xs text-[#a89a8c] line-clamp-2 leading-relaxed">
                        {h.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Footer Actions */}
                  <div className="mt-5 pt-3.5 border-t border-[rgba(229,169,60,0.12)] flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Clock className="h-3 w-3 text-[#e5a93c]" />
                      <span className={remaining.urgent ? "text-[#e5a93c] font-bold" : "text-[#a89a8c]"}>
                        {remaining.label}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleOpenWorkspace(h.id);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-[rgba(229,169,60,0.3)] bg-[#e5a93c]/15 text-[#fef3c7] hover:bg-[#e5a93c]/25 text-[11px] font-medium flex items-center gap-1 transition-colors active:scale-95"
                        title="Open Dedicated Workspace"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="h-3 w-3 text-[#e5a93c]" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setInspectingHackathon(h);
                        }}
                        className="p-1.5 rounded-lg border border-[rgba(229,169,60,0.20)] bg-[#28231d] text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#332c25] transition-colors active:scale-95"
                        title="Inspect Full Details"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setEditingHackathon(h);
                        }}
                        className="p-1.5 rounded-lg border border-[rgba(229,169,60,0.20)] bg-[#28231d] text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#332c25] transition-colors active:scale-95"
                        title="Edit Details & Milestones"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-[#e5a93c]" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDelete(e, h);
                        }}
                        disabled={isDeletingId === h.id}
                        className="p-1.5 rounded-lg border border-[rgba(229,169,60,0.20)] bg-[#28231d] text-[#a89a8c] hover:text-rose-400 hover:bg-rose-950/30 transition-colors active:scale-95"
                        title="Delete Hackathon"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {h.source_url && (
                        <a
                          href={h.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg border border-[rgba(229,169,60,0.20)] bg-[#28231d] text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#332c25] transition-colors"
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
          <div className="rounded-2xl border border-dashed border-[rgba(229,169,60,0.22)] bg-[#181410] p-12 text-center text-[#a89a8c] space-y-3">
            <Trophy className="h-9 w-9 mx-auto text-[#e5a93c]" />
            <h4 className="text-sm font-semibold text-[#fef3c7] font-mono">
              No hackathons saved yet
            </h4>
            <p className="text-xs text-[#a89a8c] max-w-sm mx-auto">
              Use the Magic Link Scraper above to paste a link from Devpost, Devfolio, or Unstop to initialize your workspace.
            </p>
          </div>
        )}
      </div>

      {/* Inspect Hackathon Details Modal */}
      {mounted && inspectingHackathon && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="fixed inset-0" onClick={() => setInspectingHackathon(null)} aria-hidden="true" />
          <div className="relative w-full max-w-lg max-h-[88vh] my-auto rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.25)] shadow-2xl overflow-hidden flex flex-col z-10 animate-fade-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-[rgba(229,169,60,0.18)] flex items-center justify-between shrink-0 bg-[#28231d]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f1b16] border border-[rgba(229,169,60,0.25)] text-[#e5a93c]">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#fef3c7] tracking-tight font-mono">
                    Hackathon Specification
                  </h2>
                  <p className="text-xs text-[#a89a8c]">
                    Platform metadata and sprint configuration.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingHackathon(null)}
                className="p-1.5 rounded-lg text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#181410] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0 custom-scrollbar">
              {/* Top Banner or Badges */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6] font-semibold">
                  {inspectingHackathon.source_platform}
                </span>
                {inspectingHackathon.prize_pool && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border border-[#e5a93c]/35 bg-[#e5a93c]/15 text-[#e5a93c]">
                    Prize: {inspectingHackathon.prize_pool}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-[#fef3c7] tracking-tight font-mono">
                  {inspectingHackathon.title}
                </h3>
                {inspectingHackathon.description && (
                  <p className="mt-2 text-xs text-[#fef3c7]/90 leading-relaxed whitespace-pre-line bg-[#181410] border border-[rgba(229,169,60,0.18)] p-3 rounded-xl">
                    {inspectingHackathon.description}
                  </p>
                )}
              </div>

              {/* Schedule Info */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-[#181410] border border-[rgba(229,169,60,0.18)]">
                  <span className="text-[#a89a8c] text-[10px] block uppercase">Starts</span>
                  <span className="text-[#fef3c7] mt-0.5 block font-semibold">
                    {new Date(inspectingHackathon.starts_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#181410] border border-[rgba(229,169,60,0.18)]">
                  <span className="text-[#a89a8c] text-[10px] block uppercase">Deadline</span>
                  <span className="text-[#fef3c7] mt-0.5 block font-semibold">
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
                <div className="p-3 rounded-xl bg-[#181410] border border-[rgba(229,169,60,0.18)] flex items-center justify-between text-xs">
                  <span className="text-[#a89a8c] truncate max-w-xs font-mono text-[11px]">
                    {inspectingHackathon.source_url}
                  </span>
                  <a
                    href={inspectingHackathon.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#e5a93c] hover:underline shrink-0"
                  >
                    <span>Open Portal</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-[rgba(229,169,60,0.18)] bg-[#28231d] flex items-center justify-between gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => handleDelete(e, inspectingHackathon)}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border-rose-500/30"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span>Delete Event</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
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
                  type="button"
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
        </div>,
        document.body
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
