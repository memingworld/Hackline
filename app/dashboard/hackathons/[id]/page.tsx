import * as React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getHackathonById,
  getUserCurrentTeam,
  getSubmissionChecklist,
} from "@/lib/data/hackathons";
import { getTeamTimelineEvents } from "@/lib/data/timeline";
import { ensureDefaultChecklistItems } from "@/lib/actions/checklist";
import { HackathonCountdownBanner } from "@/components/dashboard/HackathonCountdownBanner";
import { TimelineManager } from "@/components/timeline/TimelineManager";
import { ActiveSquadRoster } from "@/components/squads/ActiveSquadRoster";
import { PreFlightGateManager } from "@/components/squads/PreFlightGateManager";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Trophy,
  Users,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const hackathon = await getHackathonById(id);
  return {
    title: hackathon
      ? `${hackathon.title} — Sprint Workspace | Hackline`
      : "Hackathon Workspace — Hackline",
    description:
      hackathon?.description || "Dedicated sprint workspace for hackathon management.",
  };
}

export default async function HackathonWorkspacePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hackathon = await getHackathonById(id);
  if (!hackathon) {
    notFound();
  }

  const currentTeam = await getUserCurrentTeam(hackathon.id);
  const teamId = currentTeam?.id;

  let checklistItems = teamId ? await getSubmissionChecklist(teamId) : [];
  if (teamId && checklistItems.length === 0) {
    await ensureDefaultChecklistItems(teamId);
    checklistItems = await getSubmissionChecklist(teamId);
  }

  const timelineEvents = await getTeamTimelineEvents(teamId, hackathon.id);
  const isCaptain = currentTeam?.captain_id === user.id;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/hackathons"
            className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Hackathons</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-xs font-mono uppercase px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-emerald-400 font-semibold">
            {hackathon.source_platform}
          </span>
          <span className="text-xs text-zinc-400 truncate max-w-xs font-medium">
            {hackathon.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hackathon.source_url && (
            <a
              href={hackathon.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <span>Official Event Portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
            </a>
          )}
        </div>
      </div>

      {/* Countdown and Live Status Banner */}
      <HackathonCountdownBanner hackathon={hackathon} />

      {/* Primary Grid: Squad Roster & Timeline Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 space-y-6">
          <TimelineManager
            events={timelineEvents}
            hackathonId={hackathon.id}
            teamId={teamId}
            hackathonTitle={hackathon.title}
          />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Assigned Sprint Squad
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {currentTeam ? currentTeam.name : "No squad"}
              </span>
            </div>
            <ActiveSquadRoster team={currentTeam} currentUserId={user.id} />
          </div>
        </div>
      </div>

      {/* Pre-Flight Submission Verification */}
      <div className="space-y-4 pt-4 border-t border-zinc-900">
        <PreFlightGateManager
          activeTeam={currentTeam}
          checklistItems={checklistItems}
          isCaptain={isCaptain}
        />
      </div>
    </div>
  );
}
