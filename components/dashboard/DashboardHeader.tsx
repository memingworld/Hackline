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
  Menu,
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
  avatarUrl?: string | null;
  hackathons?: Hackathon[];
  activeHackathonId?: string;
  currentTeam?: Team | null;
}

export function DashboardHeader({
  userEmail,
  userName,
  avatarUrl,
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

  const [hasViewedAlerts, setHasViewedAlerts] = React.useState(false);

  React.useEffect(() => {
    try {
      const viewedTime = localStorage.getItem("hackline_alerts_viewed_at");
      if (viewedTime) {
        // If viewed within last 6 hours, treat as viewed
        if (Date.now() - parseInt(viewedTime, 10) < 6 * 60 * 60 * 1000) {
          setHasViewedAlerts(true);
        }
      }
    } catch {}
  }, []);

  const hasUrgentAlerts = React.useMemo(() => {
    if (hasViewedAlerts) return false;
    if (!activeHackathon || !activeHackathon.ends_at) return false;
    const endsTime = new Date(activeHackathon.ends_at).getTime();
    if (isNaN(endsTime)) return false;
    const diffHours = (endsTime - Date.now()) / (1000 * 60 * 60);
    // Only illuminate for actual critical deadline alerts: <= 24 hours remaining and > -6 hours (recent overdue)
    return diffHours <= 24 && diffHours >= -6;
  }, [activeHackathon, hasViewedAlerts]);

  const handleOpenAlerts = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNotificationsOpen((prev) => !prev);
    setHasViewedAlerts(true);
    try {
      localStorage.setItem("hackline_alerts_viewed_at", Date.now().toString());
    } catch {}
  };

  React.useEffect(() => {
    const handleOpenCommand = () => setIsCommandPaletteOpen(true);
    window.addEventListener("open-command-palette", handleOpenCommand);
    return () => window.removeEventListener("open-command-palette", handleOpenCommand);
  }, []);

  // Background non-blocking trigger to verify & dispatch pending Telegram deadline alerts
  React.useEffect(() => {
    const dispatchTimer = setTimeout(() => {
      fetch("/api/notifications/telegram/dispatch", {
        method: "POST",
        headers: { "x-internal-dispatch": "true" },
      }).catch(() => {
        // Non-blocking background ping
      });
    }, 2500);

    return () => clearTimeout(dispatchTimer);
  }, []);

  const isDedicatedWorkspace = pathname.startsWith("/dashboard/hackathons/") && pathname.split("/").length > 3;
  const currentWorkspaceHackathon = isDedicatedWorkspace
    ? hackathons.find((h) => h.id === pathname.split("/")[3])
    : null;

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      toast.error("Error signing out");
    }
  };

  const handleToggleMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"));
  };

  const userInitials =
    userName.length >= 2
      ? userName.substring(0, 2).toUpperCase()
      : userName.toUpperCase() || "ME";

  return (
    <header className="h-14 border-b border-[rgba(229,169,60,0.18)] bg-[#14110e]/95 backdrop-blur-2xl px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Drawer Hamburger Toggle + Context Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={handleToggleMobileSidebar}
          type="button"
          className="md:hidden p-2 rounded-xl border border-[rgba(229,169,60,0.22)] bg-[#1f1b16] text-[#a89a8c] hover:text-[#fef3c7] hover:border-[#e5a93c]/50 transition-colors shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {currentWorkspaceHackathon ? (
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-[#e5a93c] animate-pulse shadow-[0_0_8px_rgba(229,169,60,0.8)] shrink-0" />
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6] font-semibold shrink-0">
              {currentWorkspaceHackathon.source_platform}
            </span>
            <span className="text-xs font-semibold text-[#fef3c7] truncate max-w-[120px] sm:max-w-xs">
              {currentWorkspaceHackathon.title}
            </span>
          </div>
        ) : (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-mono text-[#a89a8c] hover:text-[#fef3c7] transition-colors group min-w-0"
          >
            <span className="flex h-2 w-2 rounded-full bg-[#e5a93c] animate-pulse shadow-[0_0_8px_rgba(229,169,60,0.8)] shrink-0" />
            <span className="font-bold tracking-tight text-[#fef3c7] group-hover:text-[#e5a93c] transition-colors whitespace-nowrap">
              MISSION CONTROL
            </span>
            {hackathons.length > 0 && (
              <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full border border-[rgba(229,169,60,0.18)] bg-[#1f1b16] text-[#a89a8c]">
                {hackathons.length} {hackathons.length === 1 ? "Sprint" : "Sprints"}
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Quick Search Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2.5 h-8 px-3 rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#1f1b16] text-xs text-[#a89a8c] hover:text-[#fef3c7] hover:border-[#e5a93c]/40 transition-colors"
        >
          <Search className="h-3 w-3 text-[#a89a8c]" />
          <span>Search command...</span>
          <kbd className="inline-flex items-center gap-0.5 rounded bg-[#28231d] px-1.5 py-0.5 font-mono text-[10px] text-[#fef3c7] border border-[rgba(229,169,60,0.22)]">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>

        {/* Magic Import CTA - Icon only on mobile, text on sm+ */}
        <Link href="/dashboard/hackathons?action=scrape">
          <Button
            size="sm"
            variant="primary"
            className="h-8 px-2.5 sm:px-3.5 rounded-xl text-xs gap-1.5 font-bold shadow-md active:scale-[0.98]"
            title="Import Hackathon"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#14110e]" />
            <span className="hidden sm:inline">Import Event</span>
          </Button>
        </Link>

        {/* System Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={handleOpenAlerts}
            className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#1f1b16] text-[#a89a8c] hover:text-[#fef3c7] hover:border-[#e5a93c]/40 transition-colors"
            title="System Alerts & Deadlines"
          >
            <Bell className="h-3.5 w-3.5" />
            {hasUrgentAlerts && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#e5a93c] shadow-[0_0_6px_rgba(229,169,60,0.9)]" />
            )}
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
            className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-[#1f1b16] transition-colors"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="h-8 w-8 rounded-xl object-cover border border-[rgba(229,169,60,0.25)] shadow-sm"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.25)] font-mono text-[11px] font-bold text-[#e5a93c] shadow-sm">
                {userInitials}
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[rgba(229,169,60,0.22)] bg-[#181410] p-1.5 shadow-2xl z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-[rgba(229,169,60,0.15)] mb-1">
                <span className="text-xs font-semibold text-[#fef3c7] block truncate">
                  {userName}
                </span>
                <span className="text-[11px] text-[#a89a8c] block truncate font-mono">
                  {userEmail || "Hacker Profile"}
                </span>
              </div>

              <Link
                href="/dashboard/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#1f1b16] rounded-lg transition-colors"
              >
                <User className="h-3.5 w-3.5 text-[#e5a93c]" />
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
