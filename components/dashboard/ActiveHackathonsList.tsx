"use client";

import * as React from "react";
import { Hackathon } from "@/types/database";
import { Trophy, ArrowUpRight, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ListProps {
  hackathons: Hackathon[];
  activeHackathonId?: string;
}

export function ActiveHackathonsList({ hackathons, activeHackathonId }: ListProps) {
  const router = useRouter();

  const handleSetActive = (id: string) => {
    document.cookie = `active_hackathon_id=${id}; path=/; max-age=31536000`;
    router.push(`/dashboard?hackathon=${id}`);
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-[1px] shadow-xl h-full flex flex-col justify-between group">
      <div className="rounded-[calc(1.5rem-1px)] bg-[#090a0f]/95 p-6 backdrop-blur-xl flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 border border-white/[0.08] text-zinc-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Tracked Hackathons
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Multi-Platform Sync (Devpost, Devfolio, Unstop)
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/hackathons"
              className="text-xs text-zinc-400 hover:text-white font-medium transition-colors flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

        {/* List Cards */}
        {hackathons.length > 0 ? (
          <div className="space-y-2.5">
            {hackathons.map((h) => {
              const isActive = h.id === activeHackathonId || (!activeHackathonId && h === hackathons[0]);

              return (
                <div
                  key={h.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                    isActive
                      ? "border-zinc-700 bg-zinc-950/80 shadow-sm"
                      : "border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700/60"
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white group-hover:text-zinc-200 transition-colors truncate">
                        {h.title}
                      </span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                      <span className="uppercase text-zinc-400">
                        {h.source_platform}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">
                        {h.prize_pool || "TBA"}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(h.ends_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActive ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                        <Check className="h-2.5 w-2.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetActive(h.id)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                      >
                        Set Active
                      </button>
                    )}

                    {h.source_url && (
                      <a
                        href={h.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        title="Open portal"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center text-zinc-500 space-y-2">
            <Trophy className="h-7 w-7 mx-auto text-zinc-600" />
            <p className="text-xs">No hackathons tracked in your database yet.</p>
            <Link
              href="/dashboard/hackathons?action=scrape"
              className="inline-block text-xs font-medium text-white hover:underline"
            >
              + Scrape link from Devpost/Devfolio
            </Link>
          </div>
        )}
      </div>

        {/* Footer */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Instant platform parser</span>
          <span className="text-zinc-400">
            {hackathons.length} {hackathons.length === 1 ? "Event" : "Events"} Tracked
          </span>
        </div>
      </div>
    </div>
  );
}
