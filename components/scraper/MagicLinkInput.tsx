"use client";

import * as React from "react";
import { Sparkles, ArrowRight, Globe, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MagicLinkInputProps {
  onScrapeSuccess: (data: any) => void;
}

const SUPPORTED_PLATFORMS = [
  { name: "Devfolio", domain: "devfolio.co", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { name: "Unstop", domain: "unstop.com", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  { name: "Devpost", domain: "devpost.com", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  { name: "Luma", domain: "lu.ma", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  { name: "Hack2skill", domain: "hack2skill.com", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
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
      }, 1000);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep("Formatting squad workspace payload...");
      }, 2000);

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
        description: `Found "${data.title}" (${data.prize_pool || "TBA"}). Review details below.`,
      });

      onScrapeSuccess(data);
    } catch (err: any) {
      toast.error("Extraction error", {
        description: err.message || "Could not parse page. You can enter details manually.",
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
            placeholder="Paste URL from Devfolio, Unstop, Devpost, Luma, Hack2skill..."
            disabled={isLoading}
            className="w-full h-14 pl-11 pr-44 rounded-2xl bg-zinc-900/90 text-sm text-zinc-100 placeholder:text-zinc-500 border border-zinc-800 shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all"
          />
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 pointer-events-none" />

          {detectedPlatform && (
            <div className="absolute right-44 top-1/2 -translate-y-1/2 hidden md:flex items-center pointer-events-none">
              <span
                className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border ${detectedPlatform.color}`}
              >
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
              "absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl text-xs gap-1.5 font-medium transition-all",
              !url.trim() && "bg-zinc-800/60 text-zinc-500 border border-zinc-800 shadow-none hover:bg-zinc-800/60 cursor-not-allowed opacity-60"
            )}
          >
            <span>{isLoading ? "Extracting" : "Magic Import"}</span>
            {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </form>

      {/* Loading Step Progress Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono animate-fade-in pl-2">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
          <span>{loadingStep}</span>
        </div>
      )}

      {/* Supported Platforms Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-1 text-[11px] text-zinc-500 font-mono">
        <span>Instant extraction:</span>
        {SUPPORTED_PLATFORMS.map((p) => (
          <span
            key={p.name}
            className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800/80 text-zinc-400"
          >
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
