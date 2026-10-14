"use client";

import * as React from "react";
import { Hackathon } from "@/types/database";
import { MagicLinkInput } from "@/components/scraper/MagicLinkInput";
import { HackathonConfirmationModal } from "@/components/scraper/HackathonConfirmationModal";
import { EditHackathonDialog } from "@/components/dashboard/EditHackathonDialog";
import {
  Trophy,
  ArrowUpRight,
  Calendar,
  Sparkles,
  Edit3,
  ExternalLink,
  Layers,
} from "lucide-react";

interface HackathonsManagerProps {
  initialHackathons: Hackathon[];
}

export function HackathonsManager({ initialHackathons }: HackathonsManagerProps) {
  const [extractedData, setExtractedData] = React.useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [editingHackathon, setEditingHackathon] = React.useState<Hackathon | null>(null);

  const handleScrapeSuccess = (data: any) => {
    setExtractedData(data);
    setIsConfirmOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Magic Link Scraper Box */}
      <div className="rounded-[2rem] p-1.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 ring-1 ring-white/5 shadow-2xl">
        <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-900/90 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/30 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Magic Link Scraper
              </h2>
              <p className="text-xs text-zinc-400">
                Paste any link from Devfolio, Unstop, Devpost, Luma, or Hack2skill to auto-extract and deploy.
              </p>
            </div>
          </div>

          <MagicLinkInput onScrapeSuccess={handleScrapeSuccess} />
        </div>
      </div>

      {/* Tracked Hackathons Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              My Tracked Hackathons ({initialHackathons.length})
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              Events where you are creator or squad member
            </p>
          </div>
        </div>

        {initialHackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {initialHackathons.map((h, i) => (
              <div
                key={h.id}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 hover:border-zinc-700 transition-all flex flex-col justify-between group shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                      {h.source_platform}
                    </span>
                    {h.prize_pool && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {h.prize_pool}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {h.title}
                  </h4>

                  {h.description && (
                    <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {h.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[11px]">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(h.ends_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingHackathon(h)}
                      className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Edit or Delete"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    {h.source_url && (
                      <a
                        href={h.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Open Portal Link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 space-y-3">
            <Trophy className="h-10 w-10 mx-auto text-zinc-600" />
            <h4 className="text-sm font-semibold text-zinc-300">
              No hackathons saved yet
            </h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Use the Magic Link Scraper above to paste a link from Devfolio, Unstop, or Devpost to initialize your first squad workspace.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && extractedData && (
        <HackathonConfirmationModal
          initialData={extractedData}
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
        />
      )}

      {/* Edit/Delete Modal */}
      {editingHackathon && (
        <EditHackathonDialog
          hackathon={editingHackathon}
          isOpen={!!editingHackathon}
          onClose={() => setEditingHackathon(null)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}
