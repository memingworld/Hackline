import * as React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/5 h-64">
        <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/60 h-full p-8 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-6 w-36 rounded-full bg-zinc-800" />
            <div className="h-9 w-72 rounded-xl bg-zinc-800" />
            <div className="h-4 w-96 rounded-lg bg-zinc-800/80" />
          </div>
          <div className="h-3 w-full rounded-full bg-zinc-800" />
        </div>
      </div>

      {/* Middle Grid Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/5 h-96">
          <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/60 h-full p-6 space-y-4">
            <div className="h-8 w-44 rounded-xl bg-zinc-800" />
            <div className="space-y-3 pt-4">
              <div className="h-12 w-full rounded-xl bg-zinc-800/60" />
              <div className="h-12 w-full rounded-xl bg-zinc-800/60" />
              <div className="h-12 w-full rounded-xl bg-zinc-800/60" />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] p-1.5 bg-white/5 border border-white/5 h-96">
          <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/60 h-full p-6 space-y-4">
            <div className="h-8 w-44 rounded-xl bg-zinc-800" />
            <div className="space-y-3 pt-4">
              <div className="h-12 w-full rounded-xl bg-zinc-800/60" />
              <div className="h-12 w-full rounded-xl bg-zinc-800/60" />
              <div className="h-12 w-full rounded-xl bg-zinc-800/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
