"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Terminal,
  LayoutDashboard,
  Trophy,
  Users,
  Lightbulb,
  FolderGit2,
  CalendarDays,
  Settings,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Hackathon, Team } from "@/types/database";

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
  activeHackathon: Hackathon | null;
  currentTeam: Team | null;
  currentUserId?: string;
}

export function DashboardSidebar({
  activeHackathon,
  currentTeam,
  currentUserId,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  // Dynamic countdown tag calculation
  const getSprintTag = () => {
    if (!activeHackathon) return null;
    const diffHours = Math.round(
      (new Date(activeHackathon.ends_at).getTime() - Date.now()) / (1000 * 60 * 60)
    );
    if (diffHours <= 0) return "Concluded";
    return `T-${diffHours}h`;
  };

  const isCaptain = currentTeam?.captain_id === currentUserId;
  const teamInitials = currentTeam
    ? currentTeam.name.substring(0, 2).toUpperCase()
    : null;

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl flex flex-col justify-between p-4 min-h-screen">
      <div>
        {/* Brand Header */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-3 mb-6 rounded-xl hover:bg-zinc-900/60 transition-colors group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-sm shadow-indigo-500/30 border border-indigo-400/30">
            <Terminal className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white font-mono text-sm">
                HACK<span className="text-indigo-400">LINE</span>
              </span>
              <span className="text-[9px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 rounded">
                v1.0
              </span>
            </div>
            <span className="block text-[10px] text-zinc-500 font-mono tracking-wider">
              Command Center
            </span>
          </div>
        </Link>

        {/* Dynamic Active Sprint Live Beacon */}
        {activeHackathon ? (
          <div className="mx-2 mb-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Sprint
              </span>
              <span className="text-[10px] font-mono text-zinc-400">{getSprintTag()}</span>
            </div>
            <span className="text-xs font-semibold text-white block truncate">
              {activeHackathon.title}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-0.5 truncate">
              {currentTeam ? currentTeam.name : "Solo Squad"}
            </span>
          </div>
        ) : (
          <div className="mx-2 mb-6 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-3 text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              No Active Sprint
            </span>
            <Link
              href="/dashboard/hackathons?action=scrape"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Import Event</span>
            </Link>
          </div>
        )}

        {/* Navigation Section */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-2">
            Navigation
          </span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform group-hover:scale-110",
                      isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Dynamic Bottom Squad Badge */}
      <div className="pt-4 border-t border-zinc-900">
        {currentTeam ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex items-center gap-2.5 truncate">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 font-mono text-xs font-bold text-zinc-200">
                {teamInitials}
              </div>
              <div className="truncate">
                <span className="text-xs font-medium text-white block truncate">
                  {currentTeam.name}
                </span>
                <span className="text-[10px] text-emerald-400 block font-mono">
                  {isCaptain ? "Captain Role" : "Squad Member"}
                </span>
              </div>
            </div>
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          </div>
        ) : (
          <Link
            href="/dashboard/squad"
            className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/20 border border-dashed border-zinc-800 text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
          >
            <span>No Squad Joined</span>
            <span className="text-[10px] font-mono text-indigo-400">+ Assemble</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
