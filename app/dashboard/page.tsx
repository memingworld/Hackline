import { Metadata } from "next";
import Link from "next/link";
import { getActiveHackathons } from "@/lib/data/hackathons";
import { getUserAllTeams } from "@/lib/data/squads";
import { getAllUserTimelineEvents } from "@/lib/data/timeline";
import { formatDateTimeIst } from "@/lib/utils";
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
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Top Welcome & Mission Control HUD Banner */}
      <div className="rounded-2xl border border-[rgba(229,169,60,0.20)] bg-[#1f1b16] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e5a93c]/35 bg-[#e5a93c]/15 px-3 py-1 text-xs font-mono text-[#e5a93c] mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e5a93c] animate-pulse" />
              <span>Mission Control &bull; Unified Sprints HUD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#fef3c7] tracking-tight font-mono">
              Hackathon Command Center
            </h1>
            <p className="text-xs text-[#a89a8c] mt-1 max-w-xl leading-relaxed">
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
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-[rgba(229,169,60,0.25)] text-[#fef3c7] hover:border-[#e5a93c]">
                <CalendarDays className="h-3.5 w-3.5 text-[#e5a93c]" />
                <span>Master Calendar</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick HUD Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 pt-6 border-t border-[rgba(229,169,60,0.15)] relative z-10">
          {/* Metric 1 */}
          <div className="rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#181410] p-4">
            <span className="text-[10px] font-mono uppercase text-[#a89a8c] block mb-1">
              Enrolled Sprints
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#fef3c7] font-mono">
                {hackathons.length}
              </span>
              <span className="text-[11px] text-[#e5a93c] font-mono font-bold">Active</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#181410] p-4">
            <span className="text-[10px] font-mono uppercase text-[#a89a8c] block mb-1">
              Squad Lineups
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#fef3c7] font-mono">
                {allTeams.length}
              </span>
              <span className="text-[11px] text-[#7bb4d6] font-mono">Formed</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#181410] p-4">
            <span className="text-[10px] font-mono uppercase text-[#a89a8c] block mb-1">
              Nearest Due Date
            </span>
            <div className="truncate">
              {nearestEvent ? (
                <>
                  <span className="text-sm font-bold text-[#e5a93c] block truncate font-mono">
                    {getNearestEventDiff()}
                  </span>
                  <span className="text-[10px] text-[#a89a8c] font-mono truncate block mt-0.5">
                    {nearestEvent.title}
                  </span>
                </>
              ) : (
                <span className="text-xs text-[#a89a8c] font-mono">No pending gates</span>
              )}
            </div>
          </div>

          {/* Metric 4 */}
          <div className="rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#181410] p-4">
            <span className="text-[10px] font-mono uppercase text-[#a89a8c] block mb-1">
              Global Deadlines
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#fef3c7] font-mono">
                {upcomingEvents.length}
              </span>
              <span className="text-[11px] text-[#a89a8c] font-mono">Upcoming</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Sprints Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#fef3c7] tracking-tight flex items-center gap-2 font-mono">
              <span>Your Enrolled Sprints</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#181410] text-[#e5a93c] border border-[rgba(229,169,60,0.25)]">
                {hackathons.length}
              </span>
            </h2>
            <p className="text-xs text-[#a89a8c] font-mono">
              Select any sprint to open its dedicated workspace, checklist, and squad duties.
            </p>
          </div>
          <Link
            href="/dashboard/hackathons"
            className="text-xs font-mono text-[#e5a93c] hover:underline flex items-center gap-1"
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
                  className="rounded-2xl border border-[rgba(229,169,60,0.20)] bg-[#1f1b16] p-5 hover:border-[#e5a93c]/50 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6] font-semibold">
                        {h.source_platform}
                      </span>
                      {h.prize_pool && (
                        <span className="text-[10px] font-mono font-bold text-[#e5a93c] bg-[#e5a93c]/10 border border-[#e5a93c]/25 px-2 py-0.5 rounded">
                          {h.prize_pool}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#fef3c7] group-hover:text-[#e5a93c] transition-colors line-clamp-1 font-mono">
                        {h.title}
                      </h3>
                      {h.description && (
                        <p className="mt-1 text-xs text-[#a89a8c] line-clamp-2 leading-relaxed">
                          {h.description}
                        </p>
                      )}
                    </div>

                    {/* Assigned Squad Info */}
                    <div className="pt-2 border-t border-[rgba(229,169,60,0.12)] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#fef3c7] truncate">
                        <Users className="h-3.5 w-3.5 text-[#e5a93c] shrink-0" />
                        <span className="font-medium truncate">
                          {team ? team.name : "Solo Hacker"}
                        </span>
                      </div>
                      {team && (
                        <span className="text-[10px] font-mono text-[#a89a8c] bg-[#181410] px-2 py-0.5 rounded border border-[rgba(229,169,60,0.15)]">
                          {team.members?.length || 1} {team.members?.length === 1 ? "member" : "members"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-5 pt-3.5 border-t border-[rgba(229,169,60,0.12)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Clock className="h-3 w-3 text-[#e5a93c]" />
                      <span className={isUrgent ? "text-[#e5a93c] font-bold" : "text-[#a89a8c]"}>
                        {remainingLabel}
                      </span>
                    </div>

                    <Link href={`/dashboard/hackathons/${h.id}`}>
                      <button className="px-3 py-1.5 rounded-xl border border-[rgba(229,169,60,0.30)] bg-[#e5a93c]/15 text-[#fef3c7] hover:bg-[#e5a93c]/25 text-xs font-medium flex items-center gap-1.5 transition-colors active:scale-95">
                        <span>Workspace</span>
                        <ArrowRight className="h-3 w-3 text-[#e5a93c]" />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[rgba(229,169,60,0.22)] bg-[#181410] p-12 text-center space-y-3">
            <Trophy className="h-10 w-10 mx-auto text-[#e5a93c]" />
            <h3 className="text-base font-bold text-[#fef3c7] font-mono">No Hackathons Tracked Yet</h3>
            <p className="text-xs text-[#a89a8c] max-w-sm mx-auto">
              Use our Magic Link Scraper to extract events from Devpost, Unstop, Devfolio, Devnovate, or Luma with 1 click.
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
      <div className="space-y-4 pt-4 border-t border-[rgba(229,169,60,0.15)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#fef3c7] tracking-tight flex items-center flex-wrap gap-2 font-mono">
              <span>Upcoming Milestones & Deadlines (All Sprints)</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#181410] text-[#e5a93c] border border-[rgba(229,169,60,0.25)] shrink-0">
                {upcomingEvents.length} Pending
              </span>
            </h2>
            <p className="text-xs text-[#a89a8c] font-mono leading-relaxed">
              Consolidated chronological deadline feed from all your active hackathons.
            </p>
          </div>
          <Link
            href="/dashboard/calendar"
            className="text-xs font-mono text-[#e5a93c] hover:underline inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0"
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
                  className="rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#181410] p-4 space-y-2 hover:border-[rgba(229,169,60,0.35)] transition-colors flex flex-col justify-between shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#28231d] text-[#fef3c7] truncate max-w-[140px] border border-[rgba(229,169,60,0.15)]">
                        {event.hackathon?.title || "Sprint"}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                          isUrgent
                            ? "bg-[#e5a93c]/15 border border-[#e5a93c]/30 text-[#e5a93c]"
                            : "bg-[#28231d] text-[#a89a8c]"
                        }`}
                      >
                        {diffHours <= 0
                          ? "Due Now"
                          : diffHours <= 24
                          ? `T-${diffHours}h`
                          : `${Math.round(diffHours / 24)}d left`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#fef3c7] line-clamp-1 font-mono">
                      {event.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-[rgba(229,169,60,0.12)] flex items-center justify-between text-[11px] text-[#a89a8c] font-mono">
                    <span>{formatDateTimeIst(event.deadline)}</span>
                    {event.hackathon_id && (
                      <Link
                        href={`/dashboard/hackathons/${event.hackathon_id}`}
                        className="text-[#e5a93c] hover:underline flex items-center gap-0.5 font-bold"
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
          <div className="rounded-xl border border-[rgba(229,169,60,0.15)] bg-[#181410] p-6 text-center text-xs text-[#a89a8c] font-mono">
            No upcoming milestones detected. Scrape or add a hackathon to generate milestone gates.
          </div>
        )}
      </div>

      {/* Quick Launch Control Strip */}
      <div className="pt-4 border-t border-[rgba(229,169,60,0.15)] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/dashboard/squad"
          className="rounded-2xl border border-[rgba(229,169,60,0.18)] bg-[#1f1b16] p-4 hover:border-[#e5a93c]/50 transition-all flex items-center gap-3 group shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(74,130,166,0.35)] text-[#7bb4d6] group-hover:scale-105 transition-transform">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#fef3c7] block font-mono">
              Squad & Preset Manager
            </span>
            <span className="text-[11px] text-[#a89a8c] block">
              Saved dream teams & duties
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/calendar"
          className="rounded-2xl border border-[rgba(229,169,60,0.18)] bg-[#1f1b16] p-4 hover:border-[#e5a93c]/50 transition-all flex items-center gap-3 group shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] group-hover:scale-105 transition-transform">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#fef3c7] block font-mono">
              Master Calendar & GCal
            </span>
            <span className="text-[11px] text-[#a89a8c] block">
              1-click universal export
            </span>
          </div>
        </Link>

        <Link
          href="/dashboard/assets"
          className="rounded-2xl border border-[rgba(229,169,60,0.18)] bg-[#1f1b16] p-4 hover:border-[#e5a93c]/50 transition-all flex items-center gap-3 group shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] text-[#e5a93c] group-hover:scale-105 transition-transform">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#fef3c7] block font-mono">
              Asset Hub & Repositories
            </span>
            <span className="text-[11px] text-[#a89a8c] block">
              Deliverables & pitch decks
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
