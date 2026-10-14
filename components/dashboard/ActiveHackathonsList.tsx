"use client";

import * as React from "react";
import { Hackathon } from "@/types/database";
import { Trophy, ArrowUpRight, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";

interface ListProps {
  hackathons: Hackathon[];
}

export function ActiveHackathonsList({ hackathons }: ListProps) {
  return (
    <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/10 ring-1 ring-white/5 shadow-xl h-full flex flex-col justify-between">
      <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-6 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Trophy className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Tracked Hackathons
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Multi-Platform Sync (Unstop, Devfolio, Devpost)
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/hackathons"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* List Cards */}
          {hackathons.length > 0 ? (
            <div className="space-y-3">
              {hackathons.map((h, index) => {
                const isFirst = index === 0;

                return (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {h.title}
                        </span>
                        {isFirst && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
                        <span className="uppercase text-zinc-400">
                          {h.source_platform}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">
                          {h.prize_pool}
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

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          isFirst
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {isFirst ? "Active" : "Upcoming"}
                      </span>
                      <a
                        href={h.source_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-zinc-500 space-y-2">
              <Trophy className="h-8 w-8 mx-auto text-zinc-600" />
              <p className="text-xs">No hackathons tracked in your database yet.</p>
              <Link
                href="/dashboard/hackathons?action=scrape"
                className="inline-block text-xs font-medium text-indigo-400 hover:underline"
              >
                + Scrape from Devfolio/Unstop
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Auto-scraped via FastAPI engine</span>
          <span className="text-zinc-400">
            {hackathons.length} {hackathons.length === 1 ? "Event" : "Events"} Tracked
          </span>
        </div>
      </div>
    </div>
  );
}
