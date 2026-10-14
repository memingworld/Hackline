import * as React from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserCurrentTeam, getActiveHackathons } from "@/lib/data/hackathons";
import { getTeamTimelineEvents } from "@/lib/data/timeline";
import { TimelineManager } from "@/components/timeline/TimelineManager";
import Link from "next/link";
import { CalendarDays, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Timeline & GCal Sync | Hackline Command Center",
  description: "Track submission deadlines, pitch rehearsals, and 1-click sync to Google Calendar.",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [currentTeam, hackathons] = await Promise.all([
    getUserCurrentTeam(),
    getActiveHackathons(),
  ]);

  const activeHackathon = hackathons[0] || currentTeam?.hackathon || null;

  const events = activeHackathon
    ? await getTeamTimelineEvents(currentTeam?.id, activeHackathon.id)
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Sprint Timeline & Google Calendar Sync
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-purple-500/20 bg-purple-500/10 text-purple-400">
              Live Milestone Tracking
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 max-w-xl">
            Never miss a submission gate. Track registration deadlines, code freezes, and demo windows with 1-click Google Calendar sync.
          </p>
        </div>

        {activeHackathon && (
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-white font-medium truncate max-w-[220px]">
              {activeHackathon.title}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      {!activeHackathon ? (
        <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl">
          <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-3">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Active Hackathon Selected</h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm">
              Timeline gates and deadlines are generated when you scrape or register a hackathon. Select an event from your catalog first.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link href="/dashboard/hackathons">
                <Button size="sm" variant="primary" className="rounded-xl text-xs gap-1.5">
                  <span>Go to Hackathons Catalog</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <TimelineManager
          events={events}
          hackathonId={activeHackathon.id}
          teamId={currentTeam?.id}
          hackathonTitle={activeHackathon.title}
        />
      )}
    </div>
  );
}
