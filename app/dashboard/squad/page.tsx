import * as React from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getActiveSquadRoster, getUserSavedSquads } from "@/lib/data/squads";
import { ActiveSquadRoster } from "@/components/squads/ActiveSquadRoster";
import { SavedSquadsManager } from "@/components/squads/SavedSquadsManager";
import { SquadPageClientHeader } from "@/components/squads/SquadPageClientHeader";

import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Squad & Roles | Hackline Command Center",
  description: "Form dream crews, allocate duties, and manage reusable 4-person squad presets.",
};

export default async function SquadPage(props: {
  searchParams?: Promise<{ action?: string; hackathon?: string }>;
}) {
  const searchParams = await props.searchParams;
  const initialAction = searchParams?.action;
  const cookieStore = await cookies();
  const activeHackathonId = searchParams?.hackathon || cookieStore.get("active_hackathon_id")?.value;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const [activeTeam, savedSquads] = await Promise.all([
    getActiveSquadRoster(activeHackathonId),
    getUserSavedSquads(),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header with client-triggered modals */}
      <SquadPageClientHeader
        initialAction={initialAction}
        currentUserEmail={user.email}
        currentUserName={profile?.full_name || undefined}
      />

      {/* Active Squad Lineup Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Active Sprint Squad
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {activeTeam ? "Synced with Supabase" : "No active team"}
          </span>
        </div>

        <ActiveSquadRoster
          team={activeTeam}
          currentUserId={user.id}
        />
      </section>

      {/* Saved Squad Presets Section */}
      <section className="space-y-4 pt-4 border-t border-zinc-900">
        <SavedSquadsManager
          savedSquads={savedSquads}
          activeTeam={activeTeam}
          currentUserEmail={user.email}
          currentUserName={profile?.full_name || undefined}
        />
      </section>
    </div>
  );
}
