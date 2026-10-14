"use client";

import * as React from "react";
import { Hackathon } from "@/types/database";
import { updateHackathon, deleteHackathon } from "@/lib/actions/hackathons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  X,
  Trash2,
  Edit3,
  AlertTriangle,
  Plus,
  Clock,
  Users,
  Trophy,
  Target,
  Calendar,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { extractReservedMembers } from "@/lib/data/reserved-members";

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
  const [startsAt, setStartsAt] = React.useState(
    hackathon.starts_at
      ? new Date(hackathon.starts_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [endsAt, setEndsAt] = React.useState(
    hackathon.ends_at
      ? new Date(hackathon.ends_at).toISOString().slice(0, 16)
      : new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString().slice(0, 16)
  );
  const [rounds, setRounds] = React.useState<RoundItem[]>([]);
  const [squadMembers, setSquadMembers] = React.useState<SquadMemberOption[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(false);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && hackathon) {
      setTitle(hackathon.title);
      setPrizePool(hackathon.prize_pool || "");
      setDescription(hackathon.description || "");
      if (hackathon.starts_at) {
        setStartsAt(new Date(hackathon.starts_at).toISOString().slice(0, 16));
      }
      if (hackathon.ends_at) {
        setEndsAt(new Date(hackathon.ends_at).toISOString().slice(0, 16));
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
                deadline: ev.deadline
                  ? new Date(ev.deadline).toISOString().slice(0, 16)
                  : new Date().toISOString().slice(0, 16),
                eventType: ev.event_type || "custom",
                assignedMemberId: assignedId,
                assignedMemberName: assignedName,
              };
            });
            setRounds(parsedRounds);
          }

          // 2. Fetch team members (including reserved members)
          const { data: teamData } = await supabase
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
            .eq("hackathon_id", hackathon.id)
            .maybeSingle();

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

            // Add reserved members from description metadata
            const { reservedMembers } = extractReservedMembers(teamData.description);
            reservedMembers.forEach((rm, idx) => {
              memberOptions.push({
                id: rm.id || `reserved-${idx}`,
                name: `${rm.name} (Reserved)`,
                duty: rm.duty || "Core Contributor",
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

  if (!isOpen) return null;

  const handleAddRound = () => {
    setRounds((prev) => [
      ...prev,
      {
        title: "",
        deadline: endsAt || new Date().toISOString().slice(0, 16),
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
      const formattedRounds = rounds.map((r) => ({
        id: r.id,
        title: r.title,
        deadline: new Date(r.deadline).toISOString(),
        event_type: r.eventType,
        assigned_member_id: r.assignedMemberId || null,
        assigned_member_name: r.assignedMemberName || null,
      }));

      const res = await updateHackathon(hackathon.id, {
        title,
        prize_pool: prizePool,
        description,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Edit Hackathon & Rounds
              </h3>
              <p className="text-[11px] font-mono text-zinc-500 uppercase">
                Platform: {hackathon.source_platform}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUpdate} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
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
              <label className="block text-[11px] font-mono font-medium text-zinc-400 tracking-wider uppercase">
                Description & Tracks
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-zinc-900/60 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 border border-zinc-800 outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {/* Rounds & Divided Team Work Section */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Sprint Rounds & Team Work Division ({rounds.length})</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Add custom middle rounds, screening stages, and assign tasks to teammates.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddRound}
                  className="rounded-xl text-[11px] h-8 px-2.5 gap-1 shrink-0"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Round / Deadline</span>
                </Button>
              </div>

              {isLoadingData ? (
                <div className="p-4 text-center text-xs text-zinc-500 font-mono">
                  Loading sprint milestones...
                </div>
              ) : rounds.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                  No middle rounds or internal deadlines configured. Tap &ldquo;Add Round&rdquo; to schedule one.
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {rounds.map((round, idx) => (
                    <div
                      key={round.id || `round-${idx}`}
                      className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/70 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-zinc-500">
                          Milestone #{idx + 1}
                        </span>

                        <div className="flex items-center gap-2">
                          <select
                            value={round.eventType}
                            onChange={(e) =>
                              handleUpdateRound(idx, { eventType: e.target.value })
                            }
                            className="h-7 rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-[11px] text-zinc-300 font-mono"
                          >
                            <option value="pitch_session">🏆 Official Round (Screening/Pitch)</option>
                            <option value="submission_deadline">🏁 Submission Deadline</option>
                            <option value="custom">🎯 Team Work Division</option>
                            <option value="results_announcement">🎉 Results Announcement</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteRound(idx)}
                            className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                            title="Delete this round"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        {/* Title */}
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            value={round.title}
                            onChange={(e) =>
                              handleUpdateRound(idx, { title: e.target.value })
                            }
                            placeholder="e.g. Round 1: PPT Submission or API Frozen"
                            className="w-full h-8 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        {/* Deadline Date */}
                        <div className="sm:col-span-4">
                          <input
                            type="datetime-local"
                            value={round.deadline}
                            onChange={(e) =>
                              handleUpdateRound(idx, { deadline: e.target.value })
                            }
                            style={{ colorScheme: "dark" }}
                            className="w-full h-8 rounded-lg bg-zinc-900 border border-zinc-800 px-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                            required
                          />
                        </div>

                        {/* Assign to Teammate */}
                        <div className="sm:col-span-3">
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
                            className="w-full h-8 rounded-lg bg-zinc-900 border border-zinc-800 px-2 text-[11px] text-zinc-300 font-mono outline-none focus:border-indigo-500 truncate"
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
              <p className="text-[11px] text-rose-400 flex items-center gap-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 font-mono">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Warning: Deleting this event removes all squads and timeline gates.
              </p>
            )}
          </div>

          {/* Actions Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                confirmDelete
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                  : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              }`}
            >
              <Trash2 className="h-3 w-3" />
              <span>{confirmDelete ? "Confirm Delete?" : "Delete Event"}</span>
            </button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                loadingText="Saving..."
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
