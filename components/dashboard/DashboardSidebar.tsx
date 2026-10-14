"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Terminal,
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
  hackathons?: Hackathon[];
  timelineEvents?: (TimelineEvent & { hackathon?: any })[];
  activeHackathon?: Hackathon | null;
  currentTeam?: Team | null;
}

export function DashboardSidebar({
  currentUserId,
  userEmail = "",
  userName = "",
  hackathons = [],
  timelineEvents = [],
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

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
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/login");
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

  return (
    <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-[#07080b]/90 backdrop-blur-2xl flex flex-col justify-between p-4 min-h-screen">
      <div>
        {/* Brand Header (PRO badge removed) */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-2 py-2 mb-6 rounded-2xl hover:bg-white/[0.02] transition-colors group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-white/[0.12] to-white/[0.02] border border-white/[0.1] text-white shadow-md transition-transform group-hover:scale-105">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white font-mono text-sm">
                HACK<span className="text-zinc-400">LINE</span>
              </span>
            </div>
            <span className="block text-[10px] text-zinc-500 font-mono">
              Sprint OS v1.0
            </span>
          </div>
        </Link>

        {/* Dynamic Next Closest Deadline Beacon */}
        {nextDeadline ? (
          <Link
            href={`/dashboard/hackathons/${nextDeadline.hackathonId}`}
            className="block mx-0.5 mb-6 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-3.5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-amber-400" />
                Next Deadline
              </span>
              <span className="text-[10px] font-mono text-zinc-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                {getDeadlineTag(nextDeadline.diffMs)}
              </span>
            </div>
            <span className="text-xs font-semibold text-white block truncate tracking-tight group-hover:text-amber-300 transition-colors">
              {nextDeadline.title}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-1 truncate font-mono">
              {nextDeadline.hackathonTitle}
            </span>
          </Link>
        ) : (
          <div className="mx-0.5 mb-6 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-3.5 text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              {hackathons && hackathons.length > 0 ? "All Sprints Concluded" : "No Active Sprints"}
            </span>
            <Link
              href="/dashboard/hackathons?action=scrape"
              className="text-xs text-white hover:underline font-medium inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Import Event</span>
            </Link>
          </div>
        )}

        {/* Primary Navigation Links */}
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
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group",
                  isActive
                    ? "bg-white/[0.08] text-white font-semibold shadow-inner border border-white/[0.06]"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-105",
                      isActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-zinc-200"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Profile & Direct Logout Button */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-white/[0.12] to-white/[0.02] border border-white/[0.08] font-mono text-[11px] font-bold text-zinc-200 shadow-sm">
            {userInitials}
          </div>
          <div className="min-w-0 truncate">
            <span className="text-xs font-semibold text-white block truncate">
              {displayName}
            </span>
            <span className="text-[10px] text-zinc-400 block truncate font-mono">
              {userEmail || "Hacker Account"}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          title="Sign Out"
          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/20 transition-colors shrink-0"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
