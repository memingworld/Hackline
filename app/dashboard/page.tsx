import { Metadata } from "next";
import Link from "next/link";
import { getActiveHackathons } from "@/lib/data/hackathons";
import { getUserAllTeams } from "@/lib/data/squads";
import { getAllUserTimelineEvents } from "@/lib/data/timeline";
import {
  Trophy,
  Users,
  CalendarDays,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FolderGit2,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Mission Control — Hackline",
  description: "Live multi-hackathon sprint monitor, squad line-ups, and aggregated milestone gates.",
};

export default async function DashboardPage() {
  const [hackathons, allTeams, allEvents] = await Promise.all([
    getActiveHackathons(),
    getUserAllTeams(),
    getAllUserTimelineEvents(),
  ]);

  // Find nearest upcoming deadline across all enrolled events
  const now = Date.now();
  const upcomingEvents = allEvents.filter(
    (e) => new Date(e.deadline).getTime() > now && !e.is_completed
  );
  const nearestEvent = upcomingEvents[0] || null;

  const getNearestEventDiff = () => {
    if (!nearestEvent) return null;
    const diffHours = Math.round(
      (new Date(nearestEvent.deadline).getTime() - now) / (1000 * 60 * 60)
    );
    if (diffHours <= 0) return "Due right now";
    if (diffHours <= 24) return `T-${diffHours} hours`;
    const days = Math.round(diffHours / 24);
    return `${days} days remaining`;
  };

  // Map teams to hackathon IDs
  const teamByHackathonId = new Map<string, (typeof allTeams)[0]>();
  allTeams.forEach((t) => {
    if (t.hackathon_id) {
      teamByHackathonId.set(t.hackathon_id, t);
    }
  });

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Welcome & Mission Control HUD Banner */}
      <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-[1px] shadow-2xl">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#090a0f]/95 p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-10 -translate-y-1/2 w-80 h-32 bg-emerald-500/[0.08] blur-[90px] pointer-events-none rounded-full" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Mission Control &bull; Unified Sprints HUD</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Hackathon Command Center
              </h1>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Aggregated overview of all your enrolled hackathons, active squads, and upcoming milestone gates in one single cockpit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard/hackathons?action=scrape">
                <Button size="sm" variant="primary" className="gap-1.5 rounded-xl font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Import Hackathon</span>
                </Button>
              </Link>
              <Link href="/dashboard/calendar">
                <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-zinc-300 hover:text-white">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Master Calendar</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick HUD Metrics Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/[0.08] relative z-10">
            {/* Metric 1 */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                Enrolled Sprints
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {hackathons.length}
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">Active</span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                Squad Lineups
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {allTeams.length}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">Formed</span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                Nearest Due Date
              </span>
              <div className="truncate">
                {nearestEvent ? (
                  <>
                    <span className="text-sm font-bold text-amber-400 block truncate">
                      {getNearestEventDiff()}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono truncate block mt-0.5">
                      {nearestEvent.title}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-zinc-500 font-mono">No pending gates</span>
                )}
              </div>
            </div>

            {/* Metric 4 */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">
                Global Deadlines
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {upcomingEvents.length}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">Upcoming</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Sprints Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Your Enrolled Sprints</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {hackathons.length}
              </span>
            </h2>
            <p className="text-xs text-zinc-500 font-mono">
              Select any sprint to open its dedicated workspace, checklist, and squad duties.
            </p>
          </div>
          <Link
            href="/dashboard/hackathons"
            className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Manage Catalog</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {hackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hackathons.map((h) => {
              const team = teamByHackathonId.get(h.id);
              const diffHours = Math.round(
                (new Date(h.ends_at).getTime() - now) / (1000 * 60 * 60)
              );
              const isUrgent = diffHours > 0 && diffHours <= 24;
              const remainingLabel =
                diffHours <= 0
                  ? "Concluded"
                  : diffHours <= 24
                  ? `T-${diffHours}h left`
                  : `${Math.round(diffHours / 24)} days left`;

              return (
                <div
                  key={h.id}
                  className="rounded-2xl border border-white/[0.08] bg-zinc-950/60 p-5 hover:border-white/[0.2] hover:bg-zinc-900/60 transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
                        {h.source_platform}
                      </span>
                      {h.prize_pool && (
                        <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {h.prize_pool}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {h.title}
                      </h3>
                      {h.description && (
                        <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {h.description}
                        </p>
                      )}
                    </div>

                    {/* Assigned Squad Info */}
                    <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-300 truncate">
                        <Users className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="font-medium truncate">
                          {team ? team.name : "Solo Hacker"}
                        </span>
                      </div>
                      {team && (
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          {team.members?.length || 1} {team.members?.length === 1 ? "member" : "members"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-5 pt-3.5 border-t border-zinc-900 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      <span className={isUrgent ? "text-amber-400 font-bold" : "text-zinc-400"}>
                        {remainingLabel}
                      </span>
                    </div>

                    <Link href={`/dashboard/hackathons/${h.id}`}>
                      <button className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors">
                        <span>Workspace</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-3">
            <Trophy className="h-10 w-10 mx-auto text-zinc-600" />
            <h3 className="text-base font-bold text-white">No Hackathons Tracked Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Use our Magic Link Scraper to extract events from Devpost, Unstop, Devfolio, or Luma with 1 click.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/hackathons?action=scrape">
                <Button size="sm" variant="primary" className="gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Import via Magic Link</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Aggregated Milestone Feed Across All Sprints */}
      <div className="space-y-4 pt-4 border-t border-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Upcoming Milestones & Deadlines (All Sprints)</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {upcomingEvents.length} Pending
              </span>
            </h2>
            <p className="text-xs text-zinc-500 font-mono">
              Consolidated chronological deadline feed from all your active hackathons.
            </p>
          </div>
          <Link
            href="/dashboard/calendar"
            className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Open Interactive Calendar</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingEvents.slice(0, 6).map((event) => {
              const eventTime = new Date(event.deadline).getTime();
              const diffHours = Math.round((eventTime - now) / (1000 * 60 * 60));
              const isUrgent = diffHours <= 24;

              return (
                <div
                  key={event.id}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-2 hover:border-zinc-700 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 truncate max-w-[140px]">
                        {event.hackathon?.title || "Sprint"}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                          isUrgent
                            ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                            : "bg-zinc-800/80 text-zinc-400"
                        }`}
                      >
                        {diffHours <= 0
                          ? "Due Now"
                          : diffHours <= 24
                          ? `T-${diffHours}h`
                          : `${Math.round(diffHours / 24)}d left`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1">
                      {event.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>
                      {new Date(event.deadline).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {event.hackathon_id && (
                      <Link
                        href={`/dashboard/hackathons/${event.hackathon_id}`}
                        className="text-emerald-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-850 bg-zinc-950/40 p-6 text-center text-xs text-zinc-500">
            No upcoming milestones detected. Scrape or add a hackathon to generate milestone gates.
          </div>
        )}
      </div>

      {/* Quick Launch Control Strip */}
      <div className="pt-4 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/squad"
          className="rounded-2xl border border-white/[0.06] bg-zinc-950/40 p-4 hover:border-white/[0.15] hover:bg-zinc-900/40 transition-all flex items-center gap-3 group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-indigo-400 group-hover:scale-105 transition-transform">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              Squad & Preset Manager
            </span>
            <span className="text-[11px] text-zinc-400 block">
              Saved dream teams & duties
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/calendar"
          className="rounded-2xl border border-white/[0.06] bg-zinc-950/40 p-4 hover:border-white/[0.15] hover:bg-zinc-900/40 transition-all flex items-center gap-3 group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 group-hover:scale-105 transition-transform">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              Master Calendar & GCal
            </span>
            <span className="text-[11px] text-zinc-400 block">
              1-click universal export
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/assets"
          className="rounded-2xl border border-white/[0.06] bg-zinc-950/40 p-4 hover:border-white/[0.15] hover:bg-zinc-900/40 transition-all flex items-center gap-3 group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-sky-400 group-hover:scale-105 transition-transform">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              Asset Hub & Repositories
            </span>
            <span className="text-[11px] text-zinc-400 block">
              Deliverables & pitch decks
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
