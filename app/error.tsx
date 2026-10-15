"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-[rgba(229,169,60,0.25)] bg-[#1f1b16] p-8 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#28231d] border border-[rgba(229,169,60,0.3)] text-[#e5a93c] mx-auto shadow-md">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#fef3c7] font-mono">
            Mission Control Reconnecting
          </h2>
          <p className="text-xs text-[#a89a8c] leading-relaxed">
            A temporary session or network hiccup occurred while loading this view.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => reset()}
            className="rounded-xl text-xs gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reload View</span>
          </Button>
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5 border-[rgba(229,169,60,0.25)] text-[#fef3c7]"
            >
              <Home className="h-3.5 w-3.5 text-[#e5a93c]" />
              <span>Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
