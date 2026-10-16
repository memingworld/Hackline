"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Lightbulb,
  FolderGit2,
  CalendarDays,
  Settings,
  Plus,
  Clock,
  LogOut,
  X,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Hackathon, Team, TimelineEvent } from "@/types/database";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Hackathons",
    href: "/dashboard/hackathons",
    icon: Trophy,
  },
  {
    label: "Squad & Roles",
    href: "/dashboard/squad",
    icon: Users,
  },
  {
    label: "Idea Vault",
    href: "/dashboard/vault",
    icon: Lightbulb,
  },
  {
    label: "Asset Hub",
    href: "/dashboard/assets",
    icon: FolderGit2,
  },
  {
    label: "Timeline & GCal",
    href: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface DashboardSidebarProps {
  currentUserId?: string;
  userEmail?: string;
  userName?: string;
  avatarUrl?: string | null;
  hackathons?: Hackathon[];
  timelineEvents?: (TimelineEvent & { hackathon?: any })[];
}

export function DashboardSidebar({
  currentUserId,
  userEmail = "",
  userName = "",
  avatarUrl = null,
  hackathons = [],
  timelineEvents = [],
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Listen for mobile hamburger menu toggle events from DashboardHeader
  React.useEffect(() => {
    const handleToggleMobile = () => setIsMobileOpen((prev) => !prev);
    const handleCloseMobile = () => setIsMobileOpen(false);

    window.addEventListener("toggle-mobile-sidebar", handleToggleMobile);
    window.addEventListener("close-mobile-sidebar", handleCloseMobile);

    return () => {
      window.removeEventListener("toggle-mobile-sidebar", handleToggleMobile);
      window.removeEventListener("close-mobile-sidebar", handleCloseMobile);
    };
  }, []);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Next Closest Deadline across all hackathons and timeline events
  const nextDeadline = React.useMemo(() => {
    const now = Date.now();
    const candidateEvents: Array<{
      id: string;
      title: string;
      hackathonId: string;
      hackathonTitle: string;
      deadline: string;
      diffMs: number;
    }> = [];

    // 1. Check all specific timeline events across all enrolled sprints
    (timelineEvents || []).forEach((ev) => {
      const time = new Date(ev.deadline).getTime();
      if (!isNaN(time) && time > now) {
        candidateEvents.push({
          id: ev.id,
          title: ev.title.replace(/\[@.*?\]/, "").trim(),
          hackathonId: ev.hackathon_id,
          hackathonTitle: ev.hackathon?.title || "Hackathon Sprint",
          deadline: ev.deadline,
          diffMs: time - now,
        });
      }
    });

    // 2. Also check hackathon ends_at (final submission)
    (hackathons || []).forEach((h) => {
      const time = new Date(h.ends_at).getTime();
      if (!isNaN(time) && time > now) {
        candidateEvents.push({
          id: `h-end-${h.id}`,
          title: "Final Submission Gate",
          hackathonId: h.id,
          hackathonTitle: h.title,
          deadline: h.ends_at,
          diffMs: time - now,
        });
      }
    });

    if (candidateEvents.length === 0) return null;

    candidateEvents.sort((a, b) => a.diffMs - b.diffMs);
    return candidateEvents[0];
  }, [timelineEvents, hackathons]);

  const getDeadlineTag = (diffMs: number) => {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) return "Due Now";
    if (diffHours < 24) return `T-${diffHours}h`;
    const days = Math.round(diffHours / 24);
    return `T-${days}d`;
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Error signing out");
    }
  };

  const displayName = userName || (userEmail ? userEmail.split("@")[0] : "Builder");
  const userInitials =
    displayName.length >= 2
      ? displayName.substring(0, 2).toUpperCase()
      : displayName.toUpperCase() || "ME";

  // Reusable Sidebar Inner Content
  const renderSidebarContent = (isMobileDrawer = false) => (
    <div className="flex flex-col justify-between h-full p-4 select-none">
      <div>
        {/* Brand Header — Clean Typographic Mark */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-mustard/10 transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mustard text-canvas font-black text-sm shadow-md transition-transform group-hover:scale-105">
              H
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-parchment font-mono text-sm block">
                HACK<span className="text-mustard">LINE</span>
              </span>
            </div>
          </Link>

          {isMobileDrawer && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-lg text-clay hover:text-parchment hover:bg-surface-elevated transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Dynamic Next Closest Deadline Beacon */}
        {nextDeadline ? (
          <Link
            href={`/dashboard/hackathons/${nextDeadline.hackathonId}`}
            className="block mx-0.5 mb-6 rounded-2xl border border-surface-border bg-surface p-3.5 shadow-lg relative overflow-hidden group hover:border-mustard/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-mustard font-semibold flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-mustard" />
                Next Deadline
              </span>
              <span className="text-[10px] font-mono text-canvas bg-mustard px-2 py-0.5 rounded font-bold">
                {getDeadlineTag(nextDeadline.diffMs)}
              </span>
            </div>
            <span className="text-xs font-semibold text-parchment block truncate tracking-tight group-hover:text-mustard transition-colors">
              {nextDeadline.title}
            </span>
            <span className="text-[11px] text-clay block mt-1 truncate font-mono">
              {nextDeadline.hackathonTitle}
            </span>
          </Link>
        ) : (
          <div className="mx-0.5 mb-6 rounded-2xl border border-dashed border-surface-border bg-surface-sunken p-3.5 text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-clay block mb-1">
              {hackathons && hackathons.length > 0 ? "All Sprints Concluded" : "No Active Sprints"}
            </span>
            <Link
              href="/dashboard/hackathons?action=scrape"
              className="text-xs text-mustard hover:underline font-medium inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Import Event</span>
            </Link>
          </div>
        )}

        {/* Primary Navigation Links — No boxes on inactive items */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group border border-transparent",
                  isActive
                    ? "bg-mustard/15 text-parchment font-semibold border-mustard/35 shadow-sm"
                    : "text-clay hover:text-parchment hover:bg-surface-elevated/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-105",
                      isActive ? "text-mustard" : "text-clay group-hover:text-parchment"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-mustard shadow-[0_0_8px_var(--accent-mustard)]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Profile & Direct Logout Button */}
      <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-2">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 min-w-0 group hover:opacity-90 transition-opacity"
          title="Account & Profile Settings"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-8 w-8 shrink-0 rounded-xl object-cover border border-surface-border shadow-sm"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-elevated border border-surface-border font-mono text-[11px] font-bold text-mustard shadow-sm">
              {userInitials}
            </div>
          )}
          <div className="min-w-0 truncate">
            <span className="text-xs font-semibold text-parchment block truncate group-hover:text-mustard transition-colors">
              {displayName}
            </span>
            <span className="text-[10px] text-clay block truncate font-mono">
              {userEmail || "Hacker Account"}
            </span>
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          title="Sign Out"
          className="p-2 rounded-xl text-clay hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/20 transition-colors shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar (hidden on mobile < md) */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-surface-border bg-canvas flex-col justify-between min-h-screen sticky top-0 h-screen z-30">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Mobile Responsive Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-canvas border-r border-surface-border shadow-2xl z-10">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
