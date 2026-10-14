import * as React from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserCurrentTeam } from "@/lib/data/hackathons";
import { getTeamAssets } from "@/lib/data/assets";
import { AssetsManager } from "@/components/assets/AssetsManager";
import Link from "next/link";
import { FolderGit2, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Asset Hub | Hackline Command Center",
  description: "Centralized repository for GitHub links, Figma boards, slide decks, and demo videos.",
};

export default async function AssetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const currentTeam = await getUserCurrentTeam();

  const assets = currentTeam ? await getTeamAssets(currentTeam.id) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Asset Hub & Deliverables
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
              Live Roster Assets
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 max-w-xl">
            Keep your repositories, design prototypes, pitch decks, and walkthrough videos unified and instantly accessible to the team.
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
        <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl">
          <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Active Squad Assigned</h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm">
              Deliverables and assets are scoped to your active hackathon squad. Create or join a team first to link repositories and slide decks.
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
        </div>
      ) : (
        <AssetsManager
          assets={assets}
          teamId={currentTeam.id}
          hackathonId={currentTeam.hackathon_id}
        />
      )}
    </div>
  );
}
