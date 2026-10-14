"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Search,
  Plus,
  LogOut,
  User,
  Sparkles,
  Command,
  ChevronDown,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Hackathon } from "@/types/database";

interface DashboardHeaderProps {
  userEmail: string;
  userName: string;
  hackathons?: Hackathon[];
  activeHackathonId?: string;
  hackathonTitle?: string | null;
}

export function DashboardHeader({
  userEmail,
  userName,
  hackathons = [],
  activeHackathonId,
}: DashboardHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const currentHackathonId = searchParams.get("hackathon") || activeHackathonId || (hackathons[0]?.id ?? "");

  const handleSwitchHackathon = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (newId) {
      router.push(`/dashboard?hackathon=${newId}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      toast.error("Error signing out");
    }
  };

  const userInitials =
    userName.length >= 2
      ? userName.substring(0, 2).toUpperCase()
      : userName.toUpperCase() || "ME";

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left Hackathon Switcher & Context */}
      <div className="flex items-center gap-3">
        {hackathons.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="relative flex items-center">
              <select
                value={currentHackathonId}
                onChange={handleSwitchHackathon}
                className="appearance-none bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-white font-medium pl-3 pr-8 py-1.5 rounded-lg focus:outline-none focus:border-zinc-500 cursor-pointer max-w-[200px] sm:max-w-xs truncate"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title} ({h.source_platform.toUpperCase()})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <Trophy className="h-3.5 w-3.5 text-zinc-600" />
            <span>Command Center</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Trigger */}
        <button
          onClick={() => toast.info("Search index armed (Ctrl+K)")}
          className="hidden md:flex items-center gap-2.5 h-8 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
        >
          <Search className="h-3 w-3 text-zinc-500" />
          <span>Quick search...</span>
          <kbd className="inline-flex items-center gap-0.5 rounded bg-zinc-800 px-1 py-0.2 font-mono text-[10px] text-zinc-400 border border-zinc-700">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>

        {/* Magic Import CTA */}
        <Link href="/dashboard/hackathons?action=scrape">
          <Button
            size="sm"
            variant="primary"
            className="h-8 px-3 rounded-lg text-xs gap-1.5 font-medium"
          >
            <Sparkles className="h-3 w-3 text-zinc-900" />
            <span>Import Event</span>
          </Button>
        </Link>

        {/* Telegram Notifications Beacon */}
        <button
          onClick={() =>
            toast.info("Telegram notification dispatch armed for T-24h and T-2h milestone gates")
          }
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white transition-colors"
          title="Notification Gates"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-900 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800 border border-zinc-700 font-mono text-[11px] font-bold text-zinc-200">
              {userInitials}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                <span className="text-xs font-semibold text-white block truncate">
                  {userName}
                </span>
                <span className="text-[11px] text-zinc-500 block truncate font-mono">
                  {userEmail || "Hacker Profile"}
                </span>
              </div>

              <Link
                href="/dashboard/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                <span>Profile & Telegram Setup</span>
              </Link>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors mt-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
