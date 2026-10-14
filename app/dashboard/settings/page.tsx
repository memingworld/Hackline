import * as React from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserCurrentTeam, getSubmissionChecklist } from "@/lib/data/hackathons";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata: Metadata = {
  title: "Settings & Alerts | Hackline Command Center",
  description: "Configure profile credentials, WhatsApp automated notifications, and submission gates.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const currentTeam = await getUserCurrentTeam();

  const checklistItems = currentTeam
    ? await getSubmissionChecklist(currentTeam.id)
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              System Settings & Webhook Alerts
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              Notification Engine Ready
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 max-w-xl">
            Manage your developer profile, configure WhatsApp automated deadline warnings, and customize pre-flight submission gates.
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <SettingsForm
        profile={profile}
        activeTeam={currentTeam}
        checklistItems={checklistItems}
        userEmail={user.email || ""}
      />
    </div>
  );
}
