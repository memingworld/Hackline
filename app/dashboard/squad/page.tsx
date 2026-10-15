import * as React from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserAllTeams, getUserSavedSquads } from "@/lib/data/squads";
import { getSubmissionChecklist } from "@/lib/data/hackathons";
import { ensureDefaultChecklistItems } from "@/lib/actions/checklist";
import { MultiSquadManager } from "@/components/squads/MultiSquadManager";
import { SavedSquadsManager } from "@/components/squads/SavedSquadsManager";
import { SquadPageClientHeader } from "@/components/squads/SquadPageClientHeader";

export const metadata: Metadata = {
  title: "Squad & Roles | Hackline Command Center",
  description: "Form dream crews, allocate duties, and manage reusable 4-person squad presets.",
};

export default async function SquadPage(props: {
  searchParams?: Promise<{ action?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const initialAction = searchParams?.action;

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

  const [allTeams, savedSquads] = await Promise.all([
    getUserAllTeams(),
    getUserSavedSquads(),
  ]);

  // Fetch checklist items for each team, ensuring defaults exist
  const teamsWithChecklists = await Promise.all(
    allTeams.map(async (team) => {
      await ensureDefaultChecklistItems(team.id);
      const checklistItems = await getSubmissionChecklist(team.id);
      return {
        ...team,
        checklistItems,
      };
    })
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Top Header with client-triggered modals */}
      <SquadPageClientHeader
        initialAction={initialAction}
        currentUserEmail={user.email}
        currentUserName={profile?.full_name || undefined}
      />

      {/* Multi-Squad Active Sprint Roster & Checklist Section */}
      <section className="space-y-4">
        <MultiSquadManager
          teams={teamsWithChecklists}
          currentUserId={user.id}
        />
      </section>

      {/* Saved Squad Presets Section */}
      <section className="space-y-4 pt-6 border-t border-[rgba(229,169,60,0.18)]">
        <SavedSquadsManager
          savedSquads={savedSquads}
          activeTeams={allTeams}
          currentUserEmail={user.email}
          currentUserName={profile?.full_name || undefined}
        />
      </section>
    </div>
  );
}
