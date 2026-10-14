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
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "Hackathons",
    href: "/dashboard/hackathons",
    icon: Trophy,
    badge: "3 Live",
  },
  {
    label: "Squad & Roles",
    href: "/dashboard/squad",
    icon: Users,
    badge: "4/4",
  },
  {
    label: "Idea Vault",
    href: "/dashboard/vault",
    icon: Lightbulb,
    badge: "5 Ideas",
  },
  {
    label: "Asset Hub",
    href: "/dashboard/assets",
    icon: FolderGit2,
    badge: null,
  },
  {
    label: "Timeline & GCal",
    href: "/dashboard/calendar",
    icon: CalendarDays,
    badge: "T-18h",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    badge: null,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

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

        {/* Active Sprint Live Beacon */}
        <div className="mx-2 mb-6 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Sprint
            </span>
            <span className="text-[10px] font-mono text-zinc-400">T-18h</span>
          </div>
          <span className="text-xs font-semibold text-white block truncate">
            ETHIndia 2026
          </span>
          <span className="text-[11px] text-zinc-400 block mt-0.5 truncate">
            Team Vanguard Alpha
          </span>
        </div>

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
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded-md",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-300"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Squad Badge */}
      <div className="pt-4 border-t border-zinc-900">
        <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 font-mono text-xs font-bold text-zinc-200">
              VA
            </div>
            <div>
              <span className="text-xs font-medium text-white block">
                Vanguard Alpha
              </span>
              <span className="text-[10px] text-emerald-400 block font-mono">
                Captain Role
              </span>
            </div>
          </div>
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
        </div>
      </div>
    </aside>
  );
}
