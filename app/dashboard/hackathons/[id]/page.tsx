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
import { SquadRealtimeSync } from "@/components/squads/SquadRealtimeSync";
import {
  ArrowLeft,
  ExternalLink,
  Users,
} from "lucide-react";

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
    const seedRes = await ensureDefaultChecklistItems(teamId);
    if (seedRes.success && seedRes.items && seedRes.items.length > 0) {
      checklistItems = seedRes.items;
    } else {
      checklistItems = await getSubmissionChecklist(teamId);
    }
  }

  const timelineEvents = await getTeamTimelineEvents(teamId, hackathon.id);
  const isCaptain = currentTeam?.captain_id === user.id;

  return (
    <div className="space-y-6 pb-12 animate-fade-in w-full">
      {/* Silent Realtime Collab Sync */}
      <SquadRealtimeSync teamId={teamId} hackathonId={hackathon.id} />

      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(229,169,60,0.15)]">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap min-w-0">
          <Link
            href="/dashboard/hackathons"
            className="flex items-center gap-1.5 text-xs font-mono text-[#a89a8c] hover:text-[#fef3c7] transition-colors px-2.5 py-1.5 rounded-xl bg-[#1f1b16] border border-[rgba(229,169,60,0.2)] hover:border-[#e5a93c]/40 shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Hackathons</span>
          </Link>
          <span className="text-[#a89a8c]/40">/</span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6] font-semibold shrink-0">
            {hackathon.source_platform}
          </span>
          <span className="text-xs text-[#fef3c7] truncate max-w-xs font-medium">
            {hackathon.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hackathon.source_url && (
            <a
              href={hackathon.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[rgba(229,169,60,0.22)] bg-[#1f1b16] text-xs font-medium text-[#fef3c7] hover:border-[#e5a93c]/50 transition-colors shadow-sm"
            >
              <span>Official Event Portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#e5a93c]" />
            </a>
          )}
        </div>
      </div>

      {/* Countdown and Live Status Banner */}
      <HackathonCountdownBanner hackathon={hackathon} timelineEvents={timelineEvents} />

      {/* Primary Grid: Timeline Stepped Milestones & Squad Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <TimelineManager
            events={timelineEvents}
            hackathonId={hackathon.id}
            teamId={teamId}
            hackathonTitle={hackathon.title}
            isCaptain={isCaptain}
            isCreator={hackathon.created_by === user.id}
          />
        </div>
        <div className="lg:col-span-5 space-y-6 min-w-0">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#e5a93c]" />
                <h3 className="text-xs font-bold text-[#fef3c7] uppercase tracking-wider font-mono">
                  Assigned Sprint Squad
                </h3>
              </div>
              <span className="text-[11px] text-[#a89a8c] font-mono">
                {currentTeam ? currentTeam.name : "No squad"}
              </span>
            </div>
            <ActiveSquadRoster team={currentTeam} currentUserId={user.id} />
          </div>
        </div>
      </div>

      {/* Pre-Flight Submission Verification */}
      <div className="space-y-4 pt-4 border-t border-[rgba(229,169,60,0.15)]">
        <PreFlightGateManager
          activeTeam={currentTeam}
          checklistItems={checklistItems}
          isCaptain={isCaptain}
        />
      </div>
    </div>
  );
}
