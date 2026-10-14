"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Plus,
  LogOut,
  User,
  Sparkles,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface DashboardHeaderProps {
  userEmail: string;
  userName: string;
  hackathonTitle?: string | null;
}

export function DashboardHeader({
  userEmail,
  userName,
  hackathonTitle,
}: DashboardHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

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
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left Breadcrumb / Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Hackline
          </Link>
          <span className="text-zinc-600">/</span>
          {hackathonTitle ? (
            <>
              <span className="text-zinc-300 font-semibold truncate max-w-[140px] sm:max-w-xs">
                {hackathonTitle}
              </span>
              <span className="text-zinc-600">/</span>
            </>
          ) : null}
          <span className="text-indigo-400">Overview</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Search Trigger */}
        <button
          onClick={() => toast.info("Search shortcut active (Ctrl+K)")}
          className="hidden md:flex items-center gap-3 h-9 px-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
        >
          <Search className="h-3.5 w-3.5 text-zinc-500" />
          <span>Search tasks, assets, rules...</span>
          <kbd className="inline-flex items-center gap-0.5 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 border border-zinc-700/60">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>

        {/* Magic Scraper Action CTA Button */}
        <Link href="/dashboard/hackathons?action=scrape">
          <Button
            size="sm"
            variant="primary"
            className="h-9 px-3.5 rounded-xl text-xs gap-1.5 font-medium"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
            <span>Magic Import</span>
          </Button>
        </Link>

        {/* Notifications Beacon */}
        <button
          onClick={() =>
            toast.info("WhatsApp notifications active for T-24h and T-2h alerts")
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:text-white transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-zinc-900/60 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30 font-mono text-xs font-bold text-indigo-300">
              {userInitials}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl shadow-black/80 backdrop-blur-2xl z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
                <span className="text-xs font-semibold text-white block truncate">
                  {userName}
                </span>
                <span className="text-[11px] text-zinc-500 block truncate font-mono">
                  {userEmail || "Authenticated User"}
                </span>
              </div>

              <Link
                href="/dashboard/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900/80 rounded-lg transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                <span>Profile & Squad Role</span>
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
