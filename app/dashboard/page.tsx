import { Metadata } from "next";
import Link from "next/link";
import {
  getActiveHackathons,
  getUserCurrentTeam,
  getTeamTimeline,
  getSubmissionChecklist,
} from "@/lib/data/hackathons";
import { HackathonCountdownBanner } from "@/components/dashboard/HackathonCountdownBanner";
import { TimelineMilestones } from "@/components/dashboard/TimelineMilestones";
import { SquadRosterWidget } from "@/components/dashboard/SquadRosterWidget";
import { ActiveHackathonsList } from "@/components/dashboard/ActiveHackathonsList";
import { SubmissionChecklistWidget } from "@/components/dashboard/SubmissionChecklistWidget";
import { Sparkles, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Command Center — Hackline",
  description: "Live hackathon sprint monitor, squad duties, and milestone gates.",
};

export default async function DashboardPage() {
  const [hackathons, currentTeam] = await Promise.all([
    getActiveHackathons(),
    getUserCurrentTeam(),
  ]);

  const activeHackathon = hackathons.length > 0 ? hackathons[0] : null;
  const teamId = currentTeam?.id;
  const hackathonId = activeHackathon?.id;

  const [timelineEvents, checklistItems] = await Promise.all([
    getTeamTimeline(teamId, hackathonId),
    teamId ? getSubmissionChecklist(teamId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Active Sprint Countdown & Progress Banner */}
      {activeHackathon ? (
        <HackathonCountdownBanner hackathon={activeHackathon} />
      ) : (
        <div className="rounded-[2rem] p-1.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 ring-1 ring-white/5 shadow-2xl">
          <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-0.5 text-xs font-mono text-indigo-300">
                <Sparkles className="h-3 w-3" />
                <span>Command Center Ready</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                No active hackathon sprint tracked yet
              </h2>
              <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
                Paste any link from Devfolio, Unstop, Devpost, or Luma to extract prize pools, milestone gates, and deploy your squad.
              </p>
            </div>
            <Link href="/dashboard/hackathons?action=scrape">
              <Button size="lg" variant="primary" className="rounded-xl text-xs gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Import via Magic Link</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Primary Bento Row: Timeline Gates & Squad Duties */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <TimelineMilestones events={timelineEvents} />
        </div>
        <div className="lg:col-span-5">
          <SquadRosterWidget team={currentTeam} />
        </div>
      </div>

      {/* Secondary Bento Row: Tracked Events Catalog & Pre-Flight Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <ActiveHackathonsList hackathons={hackathons} />
        </div>
        <div className="lg:col-span-6">
          <SubmissionChecklistWidget initialItems={checklistItems} />
        </div>
      </div>
    </div>
  );
}
