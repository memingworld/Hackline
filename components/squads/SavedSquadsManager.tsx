"use client";

import * as React from "react";
import { SavedSquad, Team } from "@/types/database";
import {
  Users,
  Plus,
  Rocket,
  Edit3,
  Trash2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  deleteSavedSquad,
  deploySavedSquadToActiveTeam,
} from "@/lib/actions/squads";
import { CreateSavedSquadModal } from "./CreateSavedSquadModal";
import { useRouter } from "next/navigation";

interface SavedSquadsManagerProps {
  savedSquads: SavedSquad[];
  activeTeam?: Team | null;
  activeTeams?: Team[];
  currentUserEmail?: string;
  currentUserName?: string;
}

export function SavedSquadsManager({
  savedSquads,
  activeTeam,
  activeTeams = [],
  currentUserEmail,
  currentUserName,
}: SavedSquadsManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [squadToEdit, setSquadToEdit] = React.useState<SavedSquad | null>(null);
  const [deployingSquadId, setDeployingSquadId] = React.useState<string | null>(null);
  const [deletingSquadId, setDeletingSquadId] = React.useState<string | null>(null);
  const [deployTargetModalSquad, setDeployTargetModalSquad] = React.useState<SavedSquad | null>(null);

  // Consolidated available teams list
  const availableTeams = React.useMemo(() => {
    if (activeTeams.length > 0) return activeTeams;
    if (activeTeam) return [activeTeam];
    return [];
  }, [activeTeams, activeTeam]);

  const handleOpenCreate = () => {
    setSquadToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (squad: SavedSquad) => {
    setSquadToEdit(squad);
    setModalOpen(true);
  };

  const handleDelete = async (squadId: string, squadName: string) => {
    if (!confirm(`Are you sure you want to delete the preset "${squadName}"?`)) {
      return;
    }

    setDeletingSquadId(squadId);
    try {
      const res = await deleteSavedSquad(squadId);
      if (res.success) {
        toast.success(`Preset "${squadName}" deleted`);
        router.refresh();
      } else {
        toast.error("Failed to delete preset", { description: res.error });
      }
    } catch {
      toast.error("Error deleting preset");
    } finally {
      setDeletingSquadId(null);
    }
  };

  const executeDeploy = async (squadId: string, targetTeamId: string, squadName: string) => {
    setDeployingSquadId(squadId);
    setDeployTargetModalSquad(null);
    try {
      const res = await deploySavedSquadToActiveTeam(squadId, targetTeamId);
      if (res.success) {
        toast.success(`Deployed "${squadName}" to active sprint!`, {
          description: "Roster pre-fills and team designations have been synchronized.",
        });
        router.refresh();
      } else {
        toast.error("Could not deploy squad", { description: res.error });
      }
    } catch {
      toast.error("Error deploying squad preset");
    } finally {
      setDeployingSquadId(null);
    }
  };

  const handleDeployClick = (squad: SavedSquad) => {
    if (availableTeams.length === 0) {
      toast.error("No active hackathon sprints found.", {
        description: "Join or scrape a hackathon event first to deploy this roster.",
      });
      return;
    }

    if (availableTeams.length === 1) {
      executeDeploy(squad.id, availableTeams[0].id, squad.name);
    } else {
      setDeployTargetModalSquad(squad);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h3 className="text-lg font-bold text-[#fef3c7] tracking-tight flex items-center gap-2 font-mono">
            <span>Saved Squad Presets</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-[rgba(229,169,60,0.30)] bg-[#e5a93c]/15 text-[#e5a93c]">
              Reusable 4-Person Lineups
            </span>
          </h3>
          <p className="text-xs text-[#a89a8c] mt-1 max-w-xl leading-relaxed">
            Configure reusable 4-person dream teams with default role assignments. 1-click deploy into any hackathon you register.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          className="rounded-xl text-xs gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Squad Preset</span>
        </Button>
      </div>

      {/* Preset Cards List */}
      {savedSquads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgba(229,169,60,0.22)] bg-[#181410] p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] mb-3.5 shadow-md">
            <Users className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-[#fef3c7] font-mono">No Saved Squad Presets Yet</h4>
          <p className="mt-1 text-xs text-[#a89a8c] max-w-sm">
            Save your recurring teammates and their default roles (Frontend, Backend, AI, Pitch) to deploy in seconds.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenCreate}
            className="mt-4 gap-1.5 border-[rgba(229,169,60,0.3)] text-[#fef3c7]"
          >
            <Plus className="h-3.5 w-3.5 text-[#e5a93c]" />
            <span>Create First Preset</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedSquads.map((squad) => {
            const memberCount = squad.members?.length || 0;
            const isDeploying = deployingSquadId === squad.id;
            const isDeleting = deletingSquadId === squad.id;

            return (
              <div
                key={squad.id}
                className="rounded-2xl border border-[rgba(229,169,60,0.20)] bg-[#1f1b16] p-5 hover:border-[rgba(229,169,60,0.38)] transition-colors flex flex-col justify-between shadow-lg"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h4 className="text-base font-bold text-[#fef3c7] tracking-tight flex items-center gap-2 font-mono">
                        <span>{squad.name}</span>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6]">
                          {memberCount}/4 Members
                        </span>
                      </h4>
                      {squad.description && (
                        <p className="text-xs text-[#a89a8c] mt-1 line-clamp-2">
                          {squad.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(squad)}
                        className="p-1.5 rounded-lg text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d] transition-colors"
                        title="Edit preset"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(squad.id, squad.name)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-[#a89a8c] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete preset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Member Slots */}
                  <div className="space-y-2 mb-6">
                    {squad.members && squad.members.length > 0 ? (
                      squad.members.map((member, i) => (
                        <div
                          key={member.id || i}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-[rgba(229,169,60,0.15)] bg-[#181410] text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#28231d] text-[10px] font-mono font-bold text-[#e5a93c]">
                              {i + 1}
                            </span>
                            <div>
                              <span className="text-[#fef3c7] font-medium block">
                                {member.member_name}
                              </span>
                              <span className="text-[10px] text-[#a89a8c] font-mono block">
                                {member.member_email}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-medium text-[#7bb4d6] bg-[#4a82a6]/15 border border-[rgba(74,130,166,0.35)] px-2 py-0.5 rounded-md">
                            {member.default_duty}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-[#a89a8c]">
                        No members configured in this preset.
                      </div>
                    )}
                  </div>
                </div>

                {/* Deploy Action */}
                <div className="pt-4 border-t border-[rgba(229,169,60,0.12)] flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] text-[#a89a8c] font-mono truncate max-w-[170px]">
                    {availableTeams.length === 1
                      ? "Target: " + availableTeams[0].name
                      : availableTeams.length > 1
                      ? `${availableTeams.length} Active Sprints`
                      : "No active sprint"}
                  </span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleDeployClick(squad)}
                    disabled={isDeploying || availableTeams.length === 0}
                    className="rounded-xl text-xs gap-1.5"
                  >
                    {isDeploying ? (
                      <>
                        <span className="flex gap-1 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#14110e] animate-bounce" />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#14110e] animate-bounce [animation-delay:0.2s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#14110e] animate-bounce [animation-delay:0.4s]" />
                        </span>
                        <span>Deploying...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="h-3.5 w-3.5" />
                        <span>1-Click Deploy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deploy Target Selection Modal (when multiple active teams exist) */}
      {deployTargetModalSquad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-hidden animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.25)] p-6 shadow-2xl space-y-4 z-10">
            <div>
              <h3 className="text-base font-bold text-[#fef3c7] tracking-tight font-mono">
                Deploy &ldquo;{deployTargetModalSquad.name}&rdquo;
              </h3>
              <p className="text-xs text-[#a89a8c] mt-1">
                Select which active sprint squad you want to synchronize with this preset.
              </p>
            </div>

            <div className="space-y-2 py-2">
              {availableTeams.map((team) => (
                <button
                  type="button"
                  key={team.id}
                  onClick={() =>
                    executeDeploy(deployTargetModalSquad.id, team.id, deployTargetModalSquad.name)
                  }
                  className="w-full text-left p-3.5 rounded-xl border border-[rgba(229,169,60,0.20)] bg-[#181410] hover:bg-[#28231d] hover:border-[#e5a93c]/50 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-bold text-[#fef3c7] block group-hover:text-[#e5a93c]">
                      {team.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#a89a8c] block mt-0.5">
                      {team.hackathon?.title || "Hackathon Sprint"} &bull; {team.members?.length || 1} members
                    </span>
                  </div>
                  <Rocket className="h-4 w-4 text-[#a89a8c] group-hover:text-[#e5a93c]" />
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeployTargetModalSquad(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating / Editing */}
      <CreateSavedSquadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        savedSquadToEdit={squadToEdit}
        onSuccess={() => router.refresh()}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUserName}
      />
    </div>
  );
}
