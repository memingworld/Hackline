"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Hackathon } from "@/types/database";
import { updateHackathon, deleteHackathon } from "@/lib/actions/hackathons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  X,
  Edit3,
  Trash2,
  AlertTriangle,
  Plus,
  Clock,
  Users,
  Trophy,
  Target,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { extractReservedMembers } from "@/lib/data/reserved-members";
import { toLocalDatetimeString, parseDateTimeInputToUtc } from "@/lib/utils";

interface EditHackathonDialogProps {
  hackathon: Hackathon;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface RoundItem {
  id?: string;
  title: string;
  deadline: string;
  eventType: string;
  assignedMemberId?: string | null;
  assignedMemberName?: string | null;
}

interface SquadMemberOption {
  id: string;
  name: string;
  duty: string;
  isCaptain?: boolean;
}

export function EditHackathonDialog({
  hackathon,
  isOpen,
  onClose,
  onSuccess,
}: EditHackathonDialogProps) {
  const [title, setTitle] = React.useState(hackathon.title);
  const [prizePool, setPrizePool] = React.useState(hackathon.prize_pool || "");
  const [description, setDescription] = React.useState(hackathon.description || "");
  const [bannerUrl, setBannerUrl] = React.useState(hackathon.banner_url || "");
  const [startsAt, setStartsAt] = React.useState(
    toLocalDatetimeString(hackathon.starts_at) || toLocalDatetimeString(new Date())
  );
  const [endsAt, setEndsAt] = React.useState(
    toLocalDatetimeString(hackathon.ends_at) ||
      toLocalDatetimeString(new Date(Date.now() + 1000 * 60 * 60 * 48))
  );
  const [rounds, setRounds] = React.useState<RoundItem[]>([]);
  const [squadMembers, setSquadMembers] = React.useState<SquadMemberOption[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(false);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isOpen && hackathon) {
      setTitle(hackathon.title);
      setPrizePool(hackathon.prize_pool || "");
      setDescription(hackathon.description || "");
      setBannerUrl(hackathon.banner_url || "");
      if (hackathon.starts_at) {
        setStartsAt(toLocalDatetimeString(hackathon.starts_at));
      }
      if (hackathon.ends_at) {
        setEndsAt(toLocalDatetimeString(hackathon.ends_at));
      }

      // Fetch existing timeline events & squad roster for this hackathon
      const loadRoundsAndRoster = async () => {
        setIsLoadingData(true);
        try {
          const supabase = createClient();

          // 1. Fetch timeline events
          const { data: eventsData } = await supabase
            .from("timeline_events")
            .select("*")
            .eq("hackathon_id", hackathon.id)
            .order("deadline", { ascending: true });

          if (eventsData) {
            const parsedRounds: RoundItem[] = eventsData.map((ev) => {
              let cleanTitle = ev.title;
              let assignedName: string | null = ev.assigned_member_name || null;
              let assignedId: string | null = ev.assigned_member_id || null;

              // Parse title tag if formatted like "Backend Ready [@Bob]"
              const tagMatch = ev.title.match(/\[@(.*?)\]/);
              if (tagMatch) {
                assignedName = tagMatch[1];
                cleanTitle = ev.title.replace(/\[@.*?\]/, "").trim();
              }

              return {
                id: ev.id,
                title: cleanTitle,
                deadline: toLocalDatetimeString(ev.deadline) || toLocalDatetimeString(new Date()),
                eventType: ev.event_type || "custom",
                assignedMemberId: assignedId,
                assignedMemberName: assignedName,
              };
            });
            setRounds(parsedRounds);
          }

          // 2. Fetch team members (safely, without maybeSingle to prevent PGRST116)
          const { data: teamsData } = await supabase
            .from("teams")
            .select(`
              id,
              description,
              members:team_members(
                id,
                user_id,
                duty,
                is_captain,
                user:profiles(id, full_name, email)
              )
            `)
            .eq("hackathon_id", hackathon.id);

          const teamData = teamsData && teamsData.length > 0 ? teamsData[0] : null;

          if (teamData) {
            const memberOptions: SquadMemberOption[] = [];
            (teamData.members || []).forEach((m: any) => {
              memberOptions.push({
                id: m.user_id || m.id,
                name: m.user?.full_name || m.user?.email || "Squad Member",
                duty: m.duty || "Core Contributor",
                isCaptain: m.is_captain,
              });
            });

            // Extract reserved placeholder members from metadata
            const { reservedMembers } = extractReservedMembers(teamData.description);
            reservedMembers.forEach((rm, idx) => {
              memberOptions.push({
                id: rm.id || `reserved-${idx}`,
                name: `${rm.name} (Reserved)`,
                duty: rm.duty || "Teammate",
                isCaptain: false,
              });
            });

            setSquadMembers(memberOptions);
          }
        } catch (err) {
          console.error("Error loading rounds and roster:", err);
        } finally {
          setIsLoadingData(false);
        }
      };

      loadRoundsAndRoster();
    }
  }, [isOpen, hackathon]);

  if (!isOpen || !hackathon || !mounted) return null;

  const handleAddRound = () => {
    setRounds((prev) => [
      ...prev,
      {
        title: "",
        deadline: endsAt || toLocalDatetimeString(new Date()),
        eventType: "custom",
        assignedMemberId: null,
        assignedMemberName: null,
      },
    ]);
  };

  const handleUpdateRound = (index: number, patch: Partial<RoundItem>) => {
    setRounds((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleDeleteRound = (index: number) => {
    setRounds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formattedRounds = rounds.map((r) => {
        const validIsoDeadline = parseDateTimeInputToUtc(r.deadline);

        return {
          id: r.id,
          title: r.title,
          deadline: validIsoDeadline,
          event_type: r.eventType,
          assigned_member_id: r.assignedMemberId || null,
          assigned_member_name: r.assignedMemberName || null,
        };
      });

      const parsedStarts = startsAt ? parseDateTimeInputToUtc(startsAt) : undefined;
      const parsedEnds = endsAt ? parseDateTimeInputToUtc(endsAt) : undefined;

      const res = await updateHackathon(hackathon.id, {
        title,
        prize_pool: prizePool,
        description,
        starts_at: parsedStarts,
        ends_at: parsedEnds,
        banner_url: bannerUrl.trim() || null,
        rounds: formattedRounds,
      });

      if (res.success) {
        toast.success("Hackathon & Milestones Updated!", {
          description: "Dates, rounds, and team work allocations have been synchronized.",
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error("Failed to update hackathon", {
          description: res.error,
        });
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteHackathon(hackathon.id);
      if (res.success) {
        toast.success("Hackathon deleted", {
          description: "All associated squads and timeline gates have been cleaned up.",
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error("Failed to delete hackathon", {
          description: res.error,
        });
      }
    } catch {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Background overlay click-to-close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Dialog Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] my-auto rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden flex flex-col z-10 text-parchment">
        {/* Pinned Header */}
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between shrink-0 bg-surface-elevated">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-canvas border border-surface-border text-mustard">
              <Edit3 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-parchment tracking-tight truncate font-mono">
                Edit Hackathon & Rounds
              </h3>
              <p className="text-[11px] font-mono text-clay uppercase truncate">
                Platform: <span className="text-mustard font-semibold">{hackathon.source_platform}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-clay hover:text-parchment rounded-lg hover:bg-canvas transition-colors shrink-0"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleUpdate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0 custom-scrollbar">
            {/* Event Basic Info */}
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
                required
              />
              <Input
                label="Final Submission Deadline"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                style={{ colorScheme: "dark" }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-medium text-clay tracking-wider uppercase">
                Description & Tracks
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-canvas p-3 text-xs text-parchment placeholder:text-clay/50 border border-surface-border outline-none focus:border-mustard transition-colors resize-none min-h-[76px]"
                placeholder="Brief summary of challenge, problem statement, or track rules..."
              />
            </div>

            {/* Banner Image URL & Live Preview */}
            <div className="space-y-1.5 font-mono">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono font-medium text-clay tracking-wider uppercase flex items-center gap-1.5">
                  <ImageIcon className="h-3 w-3 text-mustard" />
                  <span>Banner Image URL</span>
                </label>
                {bannerUrl && (
                  <button
                    type="button"
                    onClick={() => setBannerUrl("")}
                    className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Clear Image
                  </button>
                )}
              </div>
              <Input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://example.com/cover-banner.jpg"
              />
              {bannerUrl && (
                <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden bg-canvas border border-surface-border mt-1.5">
                  <img
                    src={bannerUrl}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement)?.classList.add("hidden");
                    }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
              )}
            </div>

            {/* Rounds & Divided Team Work Section */}
            <div className="rounded-xl border border-surface-border bg-canvas p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-parchment uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-mustard" />
                    <span>Sprint Rounds & Work Division ({rounds.length})</span>
                  </h4>
                  <p className="text-[11px] text-clay leading-snug">
                    Add custom middle rounds, screening stages, and assign tasks to teammates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddRound}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-mustard/30 bg-mustard/10 hover:bg-mustard/20 text-mustard text-xs font-medium transition-colors shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Round / Gate</span>
                </button>
              </div>

              {rounds.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-xl border border-dashed border-surface-border bg-surface-elevated/40 text-xs text-clay">
                  No middle rounds or internal deadlines configured. Tap &ldquo;Add Round / Gate&rdquo; to schedule one.
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {rounds.map((round, idx) => (
                    <div
                      key={round.id || `round-${idx}`}
                      className="p-3.5 rounded-xl border border-surface-border bg-surface-elevated space-y-3 hover:border-mustard/35 transition-colors"
                    >
                      {/* Top Header of Milestone: Badge on Left, Delete on Right */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-surface border border-surface-border text-parchment">
                          Milestone #{idx + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteRound(idx)}
                          className="h-7 w-7 inline-flex items-center justify-center text-clay hover:text-rose-400 hover:bg-rose-950/30 rounded-lg border border-transparent hover:border-rose-500/30 transition-colors shrink-0"
                          title="Delete this milestone"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Round Type & Milestone Title */}
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-mono text-clay mb-1 uppercase tracking-wider">
                            Round Category
                          </label>
                          <select
                            value={round.eventType}
                            onChange={(e) =>
                              handleUpdateRound(idx, { eventType: e.target.value })
                            }
                            className="w-full h-8 rounded-lg border border-surface-border bg-canvas px-2.5 text-xs text-parchment font-mono outline-none focus:border-mustard transition-colors"
                          >
                            <option value="pitch_session">🏆 Official Round (Screening/Pitch)</option>
                            <option value="submission_deadline">🏁 Submission Deadline</option>
                            <option value="custom">🎯 Team Work Deadline</option>
                            <option value="results_announcement">🎉 Results Announcement</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-clay mb-1 uppercase tracking-wider">
                            Milestone Title
                          </label>
                          <input
                            type="text"
                            value={round.title}
                            onChange={(e) =>
                              handleUpdateRound(idx, { title: e.target.value })
                            }
                            placeholder="e.g. Round 1: PPT Submission or FastAPI Endpoints Frozen"
                            className="w-full h-8 rounded-lg bg-canvas border border-surface-border px-3 text-xs text-parchment placeholder:text-clay/50 outline-none focus:border-mustard transition-colors"
                            required
                          />
                        </div>
                      </div>

                      {/* Date & Teammate Assignment (Clean 2-Column Grid) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-mono text-clay mb-1">
                            Target Deadline
                          </label>
                          <input
                            type="datetime-local"
                            value={round.deadline}
                            onChange={(e) =>
                              handleUpdateRound(idx, { deadline: e.target.value })
                            }
                            style={{ colorScheme: "dark" }}
                            className="w-full h-8 rounded-lg bg-canvas border border-surface-border px-2.5 text-xs text-parchment outline-none focus:border-mustard font-mono"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-clay mb-1">
                            Assigned Teammate
                          </label>
                          <select
                            value={round.assignedMemberId || ""}
                            onChange={(e) => {
                              const selId = e.target.value;
                              const member = squadMembers.find((m) => m.id === selId);
                              handleUpdateRound(idx, {
                                assignedMemberId: selId || null,
                                assignedMemberName: member ? member.name : null,
                              });
                            }}
                            className="w-full h-8 rounded-lg bg-canvas border border-surface-border px-2.5 text-[11px] text-parchment font-mono outline-none focus:border-mustard truncate"
                          >
                            <option value="">-- All Squad / Unassigned --</option>
                            {squadMembers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.duty})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {confirmDelete && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 font-mono">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Warning: Deleting this event permanently removes all squads and timeline gates.
              </p>
            )}
          </div>

          {/* Pinned Actions Footer */}
          <div className="px-5 py-3.5 border-t border-surface-border bg-surface-elevated flex items-center justify-between gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-medium border transition-colors shrink-0 ${
                confirmDelete
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                  : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{confirmDelete ? "Confirm Delete?" : "Delete Event"}</span>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                loadingText="Saving..."
                className="h-8 rounded-xl text-xs"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
