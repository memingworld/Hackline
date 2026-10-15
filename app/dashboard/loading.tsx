import * as React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="rounded-3xl border border-[rgba(229,169,60,0.20)] bg-[#1f1b16] p-6 md:p-8 space-y-6 shadow-xl">
        <div className="space-y-3">
          <div className="h-5 w-32 rounded-full bg-[rgba(229,169,60,0.10)]" />
          <div className="h-8 w-72 rounded-xl bg-[rgba(229,169,60,0.15)]" />
          <div className="h-4 w-96 rounded-md bg-[rgba(229,169,60,0.08)]" />
        </div>
        <div className="h-2 w-full rounded-full bg-[rgba(229,169,60,0.10)]" />
      </div>

      {/* Middle Grid Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-[rgba(229,169,60,0.18)] bg-[#1f1b16] p-6 space-y-4 shadow-xl">
          <div className="h-6 w-40 rounded-lg bg-[rgba(229,169,60,0.15)]" />
          <div className="space-y-3 pt-3">
            <div className="h-14 w-full rounded-2xl bg-[#181410] border border-[rgba(229,169,60,0.15)]" />
            <div className="h-14 w-full rounded-2xl bg-[#181410] border border-[rgba(229,169,60,0.15)]" />
            <div className="h-14 w-full rounded-2xl bg-[#181410] border border-[rgba(229,169,60,0.15)]" />
          </div>
        </div>

        <div className="rounded-3xl border border-[rgba(229,169,60,0.18)] bg-[#1f1b16] p-6 space-y-4 shadow-xl">
          <div className="h-6 w-40 rounded-lg bg-[rgba(229,169,60,0.15)]" />
          <div className="space-y-3 pt-3">
            <div className="h-14 w-full rounded-2xl bg-[#181410] border border-[rgba(229,169,60,0.15)]" />
            <div className="h-14 w-full rounded-2xl bg-[#181410] border border-[rgba(229,169,60,0.15)]" />
            <div className="h-14 w-full rounded-2xl bg-[#181410] border border-[rgba(229,169,60,0.15)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
