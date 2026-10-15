import * as React from "react";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata: Metadata = {
  title: "Settings & Alerts | Hackline Command Center",
  description: "Configure profile credentials and Telegram automated notifications.",
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

  const oauthAvatar =
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    null;
  const initialAvatarUrl = profile?.avatar_url || oauthAvatar || null;
  const isOauthAvatar = !profile?.avatar_url && !!oauthAvatar;

  const authProvider = user?.app_metadata?.provider || "email";
  const providers = (user?.app_metadata?.providers as string[]) || [authProvider];
  const hasExistingPassword = providers.includes("email") || authProvider === "email";
  const oauthProvider = !hasExistingPassword
    ? authProvider === "google"
      ? "Google"
      : authProvider === "github"
      ? "GitHub"
      : authProvider.toUpperCase()
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[rgba(229,169,60,0.18)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-[#fef3c7] font-mono">
              System Settings & Alerts
            </h1>
            <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6]">
              Alert Engine Active
            </span>
          </div>
          <p className="mt-1 text-xs text-[#a89a8c] max-w-xl">
            Manage your developer profile credentials and configure Telegram automated deadline warnings.
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <SettingsForm
        profile={profile}
        userEmail={user.email || ""}
        defaultAvatarUrl={initialAvatarUrl}
        isOauthAvatar={isOauthAvatar}
        hasExistingPassword={hasExistingPassword}
        oauthProvider={oauthProvider}
      />
    </div>
  );
}
