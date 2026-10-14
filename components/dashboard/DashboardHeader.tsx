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
import { Hackathon, Team } from "@/types/database";
import { CommandPalette } from "./CommandPalette";
import { NotificationsPopover } from "./NotificationsPopover";

interface DashboardHeaderProps {
  userEmail: string;
  userName: string;
  hackathons?: Hackathon[];
  activeHackathonId?: string;
  hackathonTitle?: string | null;
  currentTeam?: Team | null;
}

export function DashboardHeader({
  userEmail,
  userName,
  hackathons = [],
  activeHackathonId,
  currentTeam = null,
}: DashboardHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const currentHackathonId = searchParams.get("hackathon") || activeHackathonId || (hackathons[0]?.id ?? "");
  const activeHackathon = hackathons.find((h) => h.id === currentHackathonId) || hackathons[0] || null;

  React.useEffect(() => {
    const handleOpenCommand = () => setIsCommandPaletteOpen(true);
    window.addEventListener("open-command-palette", handleOpenCommand);
    return () => window.removeEventListener("open-command-palette", handleOpenCommand);
  }, []);

  const handleSwitchHackathon = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (newId) {
      document.cookie = `active_hackathon_id=${newId}; path=/; max-age=31536000`;
      router.push(`${pathname}?hackathon=${newId}`);
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
    <header className="h-14 border-b border-white/[0.06] bg-[#07080b]/90 backdrop-blur-2xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left Hackathon Switcher & Context */}
      <div className="flex items-center gap-3">
        {hackathons.length > 0 ? (
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <div className="relative flex items-center">
              <select
                value={currentHackathonId}
                onChange={handleSwitchHackathon}
                className="appearance-none bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.18] text-xs text-white font-medium pl-3 pr-8 py-1.5 rounded-xl focus:outline-none focus:border-white/30 cursor-pointer max-w-[200px] sm:max-w-xs truncate transition-colors shadow-sm"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id} className="bg-zinc-950 text-white">
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
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2.5 h-8 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/[0.18] transition-colors"
        >
          <Search className="h-3 w-3 text-zinc-400" />
          <span>Search command...</span>
          <kbd className="inline-flex items-center gap-0.5 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 border border-white/[0.08]">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>

        {/* Magic Import CTA */}
        <Link href="/dashboard/hackathons?action=scrape">
          <Button
            size="sm"
            variant="primary"
            className="h-8 px-3.5 rounded-xl text-xs gap-1.5 font-semibold shadow-md active:scale-[0.98]"
          >
            <Sparkles className="h-3 w-3 text-zinc-950" />
            <span>Import Event</span>
          </Button>
        </Link>

        {/* System Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/[0.18] transition-colors"
            title="System Alerts & Deadlines"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
          </button>

          <NotificationsPopover
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            activeHackathon={activeHackathon}
            currentTeam={currentTeam}
          />
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-b from-white/[0.12] to-white/[0.02] border border-white/[0.08] font-mono text-[11px] font-bold text-zinc-200 shadow-sm">
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

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        hackathons={hackathons}
        activeHackathonId={currentHackathonId}
      />
    </header>
  );
}
