import * as React from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getActiveHackathons } from "@/lib/data/hackathons";
import { getAllUserTimelineEvents } from "@/lib/data/timeline";
import { UnifiedCalendarView } from "@/components/timeline/UnifiedCalendarView";
import Link from "next/link";
import { CalendarDays, Trophy, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Universal Sprint Calendar & GCal Sync | Hackline",
  description:
    "Aggregated timeline of all hackathon deadlines, submission gates, and 1-click universal Google Calendar / .ics export.",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [events, hackathons] = await Promise.all([
    getAllUserTimelineEvents(),
    getActiveHackathons(),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[rgba(229,169,60,0.18)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-[#fef3c7] font-mono">
              Sprint Timeline & Universal Calendar
            </h1>
            <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6]">
              Multi-Hackathon Sync
            </span>
          </div>
          <p className="mt-1 text-xs text-[#a89a8c] max-w-xl">
            View all submission gates, registration deadlines, and pitch demos across all your sprints on an interactive calendar. Export everything at once to your preferred calendar app.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/hackathons?action=scrape">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs border-[rgba(229,169,60,0.3)] text-[#fef3c7]">
              <Sparkles className="h-3.5 w-3.5 text-[#e5a93c]" />
              <span>Import Sprint</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Unified Interactive Calendar */}
      {hackathons.length === 0 ? (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-8 flex flex-col items-center justify-center text-center min-h-[300px] shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 mb-3">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Hackathons Enrolled</h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm">
            Milestone gates and deadlines will automatically populate here when you scrape or register hackathons.
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
      ) : (
        <UnifiedCalendarView events={events} hackathons={hackathons} />
      )}
    </div>
  );
}
