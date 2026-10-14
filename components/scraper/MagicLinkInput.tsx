"use client";

import * as React from "react";
import { Sparkles, ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MagicLinkInputProps {
  onScrapeSuccess: (data: any) => void;
}

const SUPPORTED_PLATFORMS = [
  { name: "Devpost", domain: "devpost.com" },
  { name: "Devfolio", domain: "devfolio.co" },
  { name: "Unstop", domain: "unstop.com" },
  { name: "Luma", domain: "lu.ma" },
  { name: "Hack2skill", domain: "hack2skill.com" },
];

export function MagicLinkInput({ onScrapeSuccess }: MagicLinkInputProps) {
  const [url, setUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingStep, setLoadingStep] = React.useState("");

  const detectedPlatform = React.useMemo(() => {
    const lower = url.toLowerCase();
    return SUPPORTED_PLATFORMS.find((p) => lower.includes(p.domain));
  }, [url]);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please enter a hackathon link.");
      return;
    }

    setIsLoading(true);
    setLoadingStep("Connecting to hackathon portal...");

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep("Parsing prize pool and schedule gates...");
      }, 700);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep("Formatting squad workspace payload...");
      }, 1500);

      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to extract hackathon details.");
      }

      toast.success("Hackathon extracted successfully!", {
        description: `Found "${data.title}" (${data.prize_pool || "TBA"}).`,
      });

      onScrapeSuccess(data);
    } catch (err: any) {
      toast.error("Extraction notice", {
        description: err.message || "Could not parse page. You can confirm or edit details.",
      });
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="w-full space-y-3">
      <form onSubmit={handleScrape} className="w-full">
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste URL from Devpost, Devfolio, Unstop, Luma..."
            disabled={isLoading}
            className="w-full h-12 pl-10 pr-36 rounded-xl bg-zinc-900/60 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 border border-zinc-800 shadow-sm focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/30 transition-all"
          />
          <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />

          {detectedPlatform && (
            <div className="absolute right-36 top-1/2 -translate-y-1/2 hidden sm:flex items-center pointer-events-none">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-emerald-400">
                {detectedPlatform.name}
              </span>
            </div>
          )}

          <Button
            type="submit"
            variant={url.trim() ? "primary" : "secondary"}
            size="sm"
            isLoading={isLoading}
            disabled={!url.trim()}
            className={cn(
              "absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-3.5 rounded-lg text-xs gap-1.5 font-semibold transition-all",
              !url.trim() && "opacity-50 cursor-not-allowed"
            )}
          >
            <span>{isLoading ? "Parsing" : "Magic Import"}</span>
            {!isLoading && <ArrowRight className="h-3 w-3" />}
          </Button>
        </div>
      </form>

      {/* Loading Step Progress Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono animate-fade-in pl-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{loadingStep}</span>
        </div>
      )}

      {/* Supported Platforms Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5 pl-0.5 text-[11px] text-zinc-500 font-mono">
        <span>Instant API parsing:</span>
        {SUPPORTED_PLATFORMS.map((p) => (
          <span
            key={p.name}
            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400"
          >
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
