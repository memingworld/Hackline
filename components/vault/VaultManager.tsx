"use client";

import * as React from "react";
import { ProblemStatement } from "@/types/database";
import { Lightbulb, Plus, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProblemStatementCard } from "./ProblemStatementCard";
import { CreateProblemModal } from "./CreateProblemModal";
import { useRouter } from "next/navigation";

interface VaultManagerProps {
  statements: ProblemStatement[];
  teamId: string;
  hackathonId: string;
  isCaptain: boolean;
}

export function VaultManager({
  statements,
  teamId,
  hackathonId,
  isCaptain,
}: VaultManagerProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingStatement, setEditingStatement] = React.useState<ProblemStatement | null>(null);
  const [selectedTrack, setSelectedTrack] = React.useState<string>("All");

  const tracks = React.useMemo(() => {
    const set = new Set<string>();
    statements.forEach((s) => {
      if (s.track) set.add(s.track);
    });
    return ["All", ...Array.from(set)];
  }, [statements]);

  const filteredStatements = React.useMemo(() => {
    if (selectedTrack === "All") return statements;
    return statements.filter((s) => s.track === selectedTrack);
  }, [statements, selectedTrack]);

  const handleOpenCreate = () => {
    setEditingStatement(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (statement: ProblemStatement) => {
    setEditingStatement(statement);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Action bar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Track filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
          <Filter className="h-3.5 w-3.5 text-zinc-500 shrink-0 mr-1" />
          {tracks.map((track) => (
            <button
              key={track}
              onClick={() => setSelectedTrack(track)}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all shrink-0 ${
                selectedTrack === track
                  ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                  : "bg-zinc-950/60 text-zinc-400 border border-zinc-850 hover:text-zinc-200"
              }`}
            >
              {track}
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          className="rounded-xl text-xs gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Pitch Idea</span>
        </Button>
      </div>

      {/* Grid or Empty State */}
      {filteredStatements.length === 0 ? (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-8 flex flex-col items-center justify-center text-center min-h-[260px] shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 mb-3">
            <Lightbulb className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No Problem Statements Pitched</h4>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm">
            Propose your hackathon concept or problem track. The squad can blind-vote to lock in the winning idea.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenCreate}
            className="mt-5 rounded-xl text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Pitch First Idea</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStatements.map((statement) => (
            <ProblemStatementCard
              key={statement.id}
              statement={statement}
              teamId={teamId}
              isCaptain={isCaptain}
              onEdit={handleOpenEdit}
              onRefresh={() => router.refresh()}
            />
          ))}
        </div>
      )}

      <CreateProblemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        teamId={teamId}
        hackathonId={hackathonId}
        statementToEdit={editingStatement}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
