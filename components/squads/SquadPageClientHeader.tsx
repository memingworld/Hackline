"use client";

import * as React from "react";
import { Users, Plus, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateSavedSquadModal } from "./CreateSavedSquadModal";
import { JoinSquadModal } from "./JoinSquadModal";
import { useRouter } from "next/navigation";

interface SquadPageClientHeaderProps {
  initialAction?: string;
  currentUserEmail?: string;
  currentUserName?: string;
}

export function SquadPageClientHeader({
  initialAction,
  currentUserEmail,
  currentUserName,
}: SquadPageClientHeaderProps) {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = React.useState(
    initialAction === "create"
  );
  const [joinModalOpen, setJoinModalOpen] = React.useState(
    initialAction === "join"
  );

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Squad & Role Matrix
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
              4-Person Team Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 max-w-xl">
            Coordinate your dream squad lineup, assign specialized duties, and manage reusable crew presets for instant deployment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setJoinModalOpen(true)}
            className="rounded-xl text-xs gap-1.5"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Join with Code</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-xl text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Squad Preset</span>
          </Button>
        </div>
      </div>

      <CreateSavedSquadModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => router.refresh()}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUserName}
      />

      <JoinSquadModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
