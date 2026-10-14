import * as React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="rounded-3xl bg-white/[0.04] p-[1px] shadow-2xl">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#090a0f]/95 p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            <div className="h-5 w-32 rounded-full bg-white/[0.05]" />
            <div className="h-8 w-72 rounded-xl bg-white/[0.08]" />
            <div className="h-4 w-96 rounded-md bg-white/[0.04]" />
          </div>
          <div className="h-2 w-full rounded-full bg-white/[0.04]" />
        </div>
      </div>

      {/* Middle Grid Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white/[0.04] p-[1px] shadow-xl">
          <div className="rounded-[calc(1.5rem-1px)] bg-[#090a0f]/95 p-6 space-y-4">
            <div className="h-6 w-40 rounded-lg bg-white/[0.08]" />
            <div className="space-y-3 pt-3">
              <div className="h-14 w-full rounded-2xl bg-white/[0.03] border border-white/[0.04]" />
              <div className="h-14 w-full rounded-2xl bg-white/[0.03] border border-white/[0.04]" />
              <div className="h-14 w-full rounded-2xl bg-white/[0.03] border border-white/[0.04]" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/[0.04] p-[1px] shadow-xl">
          <div className="rounded-[calc(1.5rem-1px)] bg-[#090a0f]/95 p-6 space-y-4">
            <div className="h-6 w-40 rounded-lg bg-white/[0.08]" />
            <div className="space-y-3 pt-3">
              <div className="h-14 w-full rounded-2xl bg-white/[0.03] border border-white/[0.04]" />
              <div className="h-14 w-full rounded-2xl bg-white/[0.03] border border-white/[0.04]" />
              <div className="h-14 w-full rounded-2xl bg-white/[0.03] border border-white/[0.04]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
