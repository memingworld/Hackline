"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  hackathons?: Hackathon[];
}

export function DashboardSidebar({
  activeHackathon,
  currentTeam,
  currentUserId,
  hackathons = [],
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchId = searchParams.get("hackathon");
  const effectiveHackathon =
    (searchId && hackathons.find((h) => h.id === searchId)) || activeHackathon;

  // Ensure current team actually belongs to the effective hackathon
  const effectiveTeam =
    currentTeam && effectiveHackathon && currentTeam.hackathon_id === effectiveHackathon.id
      ? currentTeam
      : null;

  // Dynamic countdown calculation
  const getSprintTag = () => {
    if (!effectiveHackathon) return null;
    const diffHours = Math.round(
      (new Date(effectiveHackathon.ends_at).getTime() - Date.now()) / (1000 * 60 * 60)
    );
    if (diffHours <= 0) return "Concluded";
    return `T-${diffHours}h`;
  };

  const isCaptain = effectiveTeam?.captain_id === currentUserId;
  const teamInitials = effectiveTeam
    ? effectiveTeam.name.substring(0, 2).toUpperCase()
    : null;

  return (
    <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-[#07080b]/90 backdrop-blur-2xl flex flex-col justify-between p-4 min-h-screen">
      <div>
        {/* Brand Header */}
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
              <span className="text-[9px] font-mono uppercase bg-white/[0.05] text-emerald-400 border border-emerald-500/20 px-1 rounded">
                PRO
              </span>
            </div>
            <span className="block text-[10px] text-zinc-500 font-mono">
              Sprint OS v1.0
            </span>
          </div>
        </Link>

        {/* Dynamic Active Sprint Beacon */}
        {effectiveHackathon ? (
          <div className="mx-0.5 mb-6 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-3.5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Active Sprint
              </span>
              <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                {getSprintTag()}
              </span>
            </div>
            <span className="text-xs font-semibold text-white block truncate tracking-tight">
              {effectiveHackathon.title}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-1 truncate font-mono">
              {effectiveTeam ? effectiveTeam.name : "Solo Hacker"}
            </span>
          </div>
        ) : (
          <div className="mx-0.5 mb-6 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-3.5 text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              No Active Sprint
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

        {/* Navigation Section */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-2 font-medium">
            Workspace Navigation
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
                  "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 relative group",
                  isActive
                    ? "bg-white/[0.08] text-white font-semibold border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
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

      {/* Dynamic Bottom Squad Badge */}
      <div className="pt-3 border-t border-white/[0.06]">
        {effectiveTeam ? (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] shadow-sm">
            <div className="flex items-center gap-2.5 truncate">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-white/[0.1] to-white/[0.02] border border-white/[0.08] font-mono text-[11px] font-bold text-zinc-200">
                {teamInitials}
              </div>
              <div className="truncate">
                <span className="text-xs font-medium text-white block truncate">
                  {effectiveTeam.name}
                </span>
                <span className="text-[10px] text-emerald-400 block font-mono">
                  {isCaptain ? "Captain" : "Squad"}
                </span>
              </div>
            </div>
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          </div>
        ) : (
          <Link
            href="/dashboard/squad"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.08] text-xs text-zinc-400 hover:text-white hover:border-white/[0.2] transition-colors"
          >
            <span>No Squad Joined</span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">+ Assemble</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
