"use client";

import * as React from "react";
import { Hackathon } from "@/types/database";
import { MagicLinkInput } from "@/components/scraper/MagicLinkInput";
import { HackathonConfirmationModal } from "@/components/scraper/HackathonConfirmationModal";
import { EditHackathonDialog } from "@/components/dashboard/EditHackathonDialog";
import {
  Trophy,
  Calendar,
  Sparkles,
  Edit3,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface HackathonsManagerProps {
  initialHackathons: Hackathon[];
}

export function HackathonsManager({ initialHackathons }: HackathonsManagerProps) {
  const router = useRouter();
  const [extractedData, setExtractedData] = React.useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [editingHackathon, setEditingHackathon] = React.useState<Hackathon | null>(null);

  const handleScrapeSuccess = (data: any) => {
    setExtractedData(data);
    setIsConfirmOpen(true);
  };

  const handleLaunchDashboard = (hackathonId: string) => {
    router.push(`/dashboard?hackathon=${hackathonId}`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Magic Link Scraper Box */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Magic Link Scraper
            </h2>
            <p className="text-xs text-zinc-400">
              Paste any URL from Devpost, Devfolio, Unstop, or Luma to extract prizes, deadlines, and deploy your workspace.
            </p>
          </div>
        </div>

        <MagicLinkInput onScrapeSuccess={handleScrapeSuccess} />
      </div>

      {/* Tracked Hackathons Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Tracked Hackathons ({initialHackathons.length})
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              Events linked to your squad command center
            </p>
          </div>
        </div>

        {initialHackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialHackathons.map((h) => (
              <div
                key={h.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700 transition-colors flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
                      {h.source_platform}
                    </span>
                    {h.prize_pool && (
                      <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        {h.prize_pool}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors line-clamp-1">
                    {h.title}
                  </h4>

                  {h.description && (
                    <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {h.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[11px]">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(h.ends_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleLaunchDashboard(h.id)}
                      className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors text-[11px] font-medium flex items-center gap-1"
                      title="Open in Command Center"
                    >
                      <span>Command</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => setEditingHackathon(h)}
                      className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Edit or Delete"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>

                    {h.source_url && (
                      <a
                        href={h.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Open Portal Link"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500 space-y-3">
            <Trophy className="h-9 w-9 mx-auto text-zinc-600" />
            <h4 className="text-sm font-semibold text-zinc-300">
              No hackathons saved yet
            </h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Use the Magic Link Scraper above to paste a link from Devpost, Devfolio, or Unstop to initialize your workspace.
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
