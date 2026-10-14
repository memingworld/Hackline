import * as React from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserCurrentTeam } from "@/lib/data/hackathons";
import { getTeamProblemStatements } from "@/lib/data/vault";
import { VaultManager } from "@/components/vault/VaultManager";
import Link from "next/link";
import { Lightbulb, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Idea Vault | Hackline Command Center",
  description: "Track problem statements, align on hackathon tracks, and conduct team blind voting.",
};

export default async function IdeaVaultPage(props: {
  searchParams: Promise<{ hackathon?: string }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const requestedHackathonId =
    searchParams.hackathon || cookieStore.get("active_hackathon_id")?.value;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const currentTeam = await getUserCurrentTeam(requestedHackathonId);

  const statements = currentTeam
    ? await getTeamProblemStatements(currentTeam.id)
    : [];

  const isCaptain = currentTeam?.captain_id === user.id;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Idea Vault & Track Voting
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-400">
              Blind Voting Active
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 max-w-xl">
            Propose problem statements, debate technical feasibility, and conduct consensus voting to lock in your winning sprint submission.
          </p>
        </div>

        {currentTeam && (
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <span className="text-zinc-500">Squad:</span>
            <span className="text-white font-medium">{currentTeam.name}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      {!currentTeam ? (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-8 flex flex-col items-center justify-center text-center min-h-[300px] shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Active Squad Assigned</h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm">
            Idea Vault is collaborative and tied to your hackathon squad. Create or join a team first to start proposing and voting on ideas.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <Link href="/dashboard/squad">
              <Button size="sm" variant="primary" className="rounded-xl text-xs gap-1.5">
                <span>Go to Squad Management</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <VaultManager
          statements={statements}
          teamId={currentTeam.id}
          hackathonId={currentTeam.hackathon_id}
          isCaptain={isCaptain}
        />
      )}
    </div>
  );
}
