"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  Trophy,
  LayoutDashboard,
  Users,
  Lightbulb,
  FolderGit2,
  CalendarDays,
  Settings,
  Sparkles,
  ArrowRight,
  Plus,
  X,
  Command,
} from "lucide-react";
import { Hackathon } from "@/types/database";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  hackathons: Hackathon[];
  activeHackathonId?: string;
}

export function CommandPalette({
  isOpen,
  onClose,
  hackathons,
  activeHackathonId,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [mounted, setMounted] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Global keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open parent
          const event = new CustomEvent("open-command-palette");
          window.dispatchEvent(event);
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const q = query.toLowerCase().trim();

  // Filter items
  const matchedHackathons = hackathons.filter(
    (h) =>
      !q ||
      h.title.toLowerCase().includes(q) ||
      h.source_platform.toLowerCase().includes(q)
  );

  const pages = [
    { label: "Sprint Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Tracked Hackathons", href: "/dashboard/hackathons", icon: Trophy },
    { label: "Squad Roster & Roles", href: "/dashboard/squad", icon: Users },
    { label: "Idea Vault & Voting", href: "/dashboard/vault", icon: Lightbulb },
    { label: "Asset Hub & Deliverables", href: "/dashboard/assets", icon: FolderGit2 },
    { label: "Timeline & Calendar Sync", href: "/dashboard/calendar", icon: CalendarDays },
    { label: "Account & Telegram Settings", href: "/dashboard/settings", icon: Settings },
  ].filter((p) => !q || p.label.toLowerCase().includes(q));

  const actions = [
    {
      label: "Import Hackathon via Magic Link",
      icon: Sparkles,
      onClick: () => {
        onClose();
        router.push("/dashboard/hackathons?action=scrape");
      },
    },
    {
      label: "Pitch New Problem Statement",
      icon: Lightbulb,
      onClick: () => {
        onClose();
        router.push("/dashboard/vault");
      },
    },
    {
      label: "Link Project Deliverable (GitHub, Figma, Deck)",
      icon: FolderGit2,
      onClick: () => {
        onClose();
        router.push("/dashboard/assets");
      },
    },
    {
      label: "Add Sprint Milestone Gate",
      icon: CalendarDays,
      onClick: () => {
        onClose();
        router.push("/dashboard/calendar");
      },
    },
  ].filter((a) => !q || a.label.toLowerCase().includes(q));

  const handleSelectHackathon = (id: string) => {
    onClose();
    router.push(`/dashboard/hackathons/${id}`);
  };

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Background overlay click-to-close */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-xl rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] backdrop-blur-2xl z-10">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-surface-border flex items-center gap-3 bg-surface-elevated">
          <Search className="h-4 w-4 text-mustard shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search hackathons, pages, or actions..."
            className="w-full bg-transparent text-sm text-parchment placeholder:text-clay/50 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-clay hover:text-parchment transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-lg bg-canvas border border-surface-border px-2 py-0.5 font-mono text-[10px] text-clay shrink-0">
            ESC
          </kbd>
        </div>

        {/* Scrollable Results List */}
        <div className="p-3 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          {/* Hackathons Section */}
          {matchedHackathons.length > 0 && (
            <div>
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-clay block mb-1.5 font-semibold">
                Switch Hackathon Sprint
              </span>
              <div className="space-y-1">
                {matchedHackathons.map((h) => {
                  const isActive = h.id === activeHackathonId;
                  return (
                    <button
                      key={h.id}
                      onClick={() => handleSelectHackathon(h.id)}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-surface-elevated transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-canvas border border-surface-border text-mustard">
                          <Trophy className="h-3.5 w-3.5" />
                        </div>
                        <div className="truncate">
                          <span className="font-medium text-parchment block truncate">
                            {h.title}
                          </span>
                          <span className="text-[10px] text-clay font-mono">
                            {h.source_platform.toUpperCase()} &bull; {h.prize_pool || "TBA"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isActive && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mustard/15 border border-mustard/30 text-mustard">
                            Active
                          </span>
                        )}
                        <ArrowRight className="h-3.5 w-3.5 text-clay group-hover:text-parchment transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {actions.length > 0 && (
            <div>
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-clay block mb-1.5 font-semibold">
                Quick Actions
              </span>
              <div className="space-y-1">
                {actions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.label}
                      onClick={act.onClick}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-surface-elevated transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-canvas border border-surface-border text-mustard">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium text-parchment">
                          {act.label}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-clay group-hover:text-parchment transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Pages */}
          {pages.length > 0 && (
            <div>
              <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-clay block mb-1.5 font-semibold">
                Workspace Pages
              </span>
              <div className="space-y-1">
                {pages.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.href}
                      onClick={() => handleNavigate(p.href)}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-surface-elevated transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-canvas border border-surface-border text-clay">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-parchment">{p.label}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-clay group-hover:text-parchment transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {matchedHackathons.length === 0 && actions.length === 0 && pages.length === 0 && (
            <div className="p-8 text-center text-clay font-mono text-xs">
              No matching commands or hackathons found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-2.5 px-4 border-t border-surface-border bg-surface-elevated flex items-center justify-between text-[11px] font-mono text-clay">
          <span>Navigate with mouse or Tab</span>
          <span className="text-mustard">Hackline Command Palette</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
