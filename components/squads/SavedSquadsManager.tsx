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
  activeTeam: Team | null;
  currentUserEmail?: string;
  currentUserName?: string;
}

export function SavedSquadsManager({
  savedSquads,
  activeTeam,
  currentUserEmail,
  currentUserName,
}: SavedSquadsManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [squadToEdit, setSquadToEdit] = React.useState<SavedSquad | null>(null);
  const [deployingSquadId, setDeployingSquadId] = React.useState<string | null>(null);
  const [deletingSquadId, setDeletingSquadId] = React.useState<string | null>(null);

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

  const handleDeploy = async (squad: SavedSquad) => {
    if (!activeTeam) {
      toast.error("No active hackathon team detected to deploy preset into.", {
        description: "Scrape or register a hackathon first from the Hackathons catalog.",
      });
      return;
    }

    setDeployingSquadId(squad.id);
    try {
      const res = await deploySavedSquadToActiveTeam(squad.id, activeTeam.id);
      if (res.success) {
        toast.success(`Deployed "${squad.name}" to active hackathon!`, {
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Saved Squad Presets</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {savedSquads.length} Presets
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
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
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 mb-3">
            <Users className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-white">No Saved Squad Presets Yet</h4>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm">
            Save your recurring teammates and their default roles (Frontend, Backend, AI, Pitch) to deploy in seconds.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenCreate}
            className="mt-4 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
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
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                          <span>{squad.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                            {memberCount}/4 Members
                          </span>
                        </h4>
                        {squad.description && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                            {squad.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(squad)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Edit preset"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(squad.id, squad.name)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
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
                            className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-300">
                                {i + 1}
                              </span>
                              <div>
                                <span className="text-zinc-200 font-medium block">
                                  {member.member_name}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono block">
                                  {member.member_email}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                              {member.default_duty}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-zinc-500">
                          No members configured in this preset.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deploy Action */}
                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {activeTeam ? "Target: " + activeTeam.name : "Deploy to Active Squad"}
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleDeploy(squad)}
                      disabled={isDeploying || !activeTeam}
                      className="rounded-xl text-xs gap-1.5"
                    >
                      {isDeploying ? (
                        <>
                          <span className="flex gap-1 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
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
