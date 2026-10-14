import * as React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-6 md:p-8 space-y-6">
        <div className="space-y-3">
          <div className="h-5 w-32 rounded-md bg-zinc-850" />
          <div className="h-8 w-72 rounded-lg bg-zinc-800" />
          <div className="h-4 w-96 rounded-md bg-zinc-850" />
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-850" />
      </div>

      {/* Middle Grid Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-6 space-y-4">
          <div className="h-6 w-40 rounded-md bg-zinc-800" />
          <div className="space-y-3 pt-3">
            <div className="h-14 w-full rounded-xl bg-zinc-900 border border-zinc-850" />
            <div className="h-14 w-full rounded-xl bg-zinc-900 border border-zinc-850" />
            <div className="h-14 w-full rounded-xl bg-zinc-900 border border-zinc-850" />
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-950 border border-zinc-800/80 p-6 space-y-4">
          <div className="h-6 w-40 rounded-md bg-zinc-800" />
          <div className="space-y-3 pt-3">
            <div className="h-14 w-full rounded-xl bg-zinc-900 border border-zinc-850" />
            <div className="h-14 w-full rounded-xl bg-zinc-900 border border-zinc-850" />
            <div className="h-14 w-full rounded-xl bg-zinc-900 border border-zinc-850" />
          </div>
        </div>
      </div>
    </div>
  );
}
