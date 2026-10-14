import { Metadata } from "next";
import Link from "next/link";
import {
  getActiveHackathons,
  getUserCurrentTeam,
  getTeamTimeline,
  getSubmissionChecklist,
} from "@/lib/data/hackathons";
import { ensureDefaultChecklistItems } from "@/lib/actions/checklist";
import { HackathonCountdownBanner } from "@/components/dashboard/HackathonCountdownBanner";
import { TimelineMilestones } from "@/components/dashboard/TimelineMilestones";
import { SquadRosterWidget } from "@/components/dashboard/SquadRosterWidget";
import { ActiveHackathonsList } from "@/components/dashboard/ActiveHackathonsList";
import { SubmissionChecklistWidget } from "@/components/dashboard/SubmissionChecklistWidget";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Command Center — Hackline",
  description: "Live hackathon sprint monitor, squad duties, and milestone gates.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ hackathon?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const selectedHackathonId =
    resolvedParams.hackathon || cookieStore.get("active_hackathon_id")?.value;

  const hackathons = await getActiveHackathons();

  const activeHackathon =
    (selectedHackathonId
      ? hackathons.find((h) => h.id === selectedHackathonId)
      : null) ||
    hackathons[0] ||
    null;

  const currentTeam = await getUserCurrentTeam(activeHackathon?.id);
  const teamId = currentTeam?.id;
  const hackathonId = activeHackathon?.id;

  let checklistItems = teamId ? await getSubmissionChecklist(teamId) : [];

  if (teamId && checklistItems.length === 0) {
    await ensureDefaultChecklistItems(teamId);
    checklistItems = await getSubmissionChecklist(teamId);
  }

  const timelineEvents = await getTeamTimeline(teamId, hackathonId);

  return (
    <div className="space-y-6 pb-12">
      {/* Active Sprint Countdown & Progress Banner */}
      {activeHackathon ? (
        <HackathonCountdownBanner hackathon={activeHackathon} />
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 sm:p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Workspace Ready</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              No active hackathons tracked yet
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Paste any URL from Devpost, Devfolio, Unstop, or Luma to extract prize pools, milestone gates, and deploy your squad.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/hackathons?action=scrape">
                <Button size="md" variant="primary" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Import via Magic Link</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Primary Row: Timeline Gates & Squad Duties */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <TimelineMilestones events={timelineEvents} />
        </div>
        <div className="lg:col-span-5">
          <SquadRosterWidget team={currentTeam} />
        </div>
      </div>

      {/* Secondary Row: Tracked Events Catalog & Pre-Flight Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <ActiveHackathonsList
            hackathons={hackathons}
            activeHackathonId={activeHackathon?.id}
          />
        </div>
        <div className="lg:col-span-6">
          <SubmissionChecklistWidget initialItems={checklistItems} teamId={teamId} />
        </div>
      </div>
    </div>
  );
}
