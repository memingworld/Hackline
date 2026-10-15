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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[rgba(229,169,60,0.18)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-[#fef3c7] font-mono">
              Squad & Role Matrix
            </h1>
            <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6]">
              Dream Crew Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-[#a89a8c] max-w-xl">
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
