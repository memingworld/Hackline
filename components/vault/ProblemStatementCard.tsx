"use client";

import * as React from "react";
import { ProblemStatement } from "@/types/database";
import {
  ThumbsUp,
  Crown,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  toggleProblemVote,
  selectProblemStatement,
  deleteProblemStatement,
} from "@/lib/actions/vault";

interface ProblemStatementCardProps {
  statement: ProblemStatement;
  teamId: string;
  isCaptain: boolean;
  onEdit: (statement: ProblemStatement) => void;
  onRefresh: () => void;
}

export function ProblemStatementCard({
  statement,
  teamId,
  isCaptain,
  onEdit,
  onRefresh,
}: ProblemStatementCardProps) {
  const [isVoting, setIsVoting] = React.useState(false);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleVote = async () => {
    setIsVoting(true);
    try {
      const res = await toggleProblemVote(statement.id);
      if (res.success) {
        toast.success(res.voted ? "Vote recorded!" : "Vote retracted");
        onRefresh();
      } else {
        toast.error("Failed to vote", { description: res.error });
      }
    } catch {
      toast.error("Error voting on idea");
    } finally {
      setIsVoting(false);
    }
  };

  const handleSelect = async () => {
    setIsSelecting(true);
    try {
      const res = await selectProblemStatement(statement.id, teamId);
      if (res.success) {
        toast.success("Problem statement locked in!", {
          description: "This is now designated as the squad's primary hackathon submission topic.",
        });
        onRefresh();
      } else {
        toast.error("Failed to set selected problem", { description: res.error });
      }
    } catch {
      toast.error("Error selecting problem");
    } finally {
      setIsSelecting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${statement.title}"?`)) return;
    setIsDeleting(true);
    try {
      const res = await deleteProblemStatement(statement.id);
      if (res.success) {
        toast.success("Problem statement removed");
        onRefresh();
      } else {
        toast.error("Failed to delete", { description: res.error });
      }
    } catch {
      toast.error("Error deleting problem");
    } finally {
      setIsDeleting(false);
    }
  };

  const isSelected = statement.is_selected;

  return (
    <div
      className={`rounded-[2rem] p-1.5 transition-all duration-300 ${
        isSelected
          ? "bg-gradient-to-br from-amber-500/20 via-indigo-500/10 to-white/5 border border-amber-500/30 ring-1 ring-amber-500/20 shadow-2xl shadow-amber-500/5"
          : "bg-white/5 border border-white/10 ring-1 ring-white/5 hover:border-zinc-700/80 shadow-xl"
      }`}
    >
      <div className="rounded-[calc(2rem-0.375rem)] bg-zinc-950 p-6 flex flex-col justify-between h-full">
        <div>
          {/* Top badges */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                {statement.track || "General Track"}
              </span>

              {isSelected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-300">
                  <Crown className="h-2.5 w-2.5 text-amber-400" />
                  <span>Selected Sprint Topic</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(statement)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title="Edit statement"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                title="Delete statement"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="text-base font-bold text-white tracking-tight leading-snug">
            {statement.title}
          </h3>

          {statement.description && (
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed line-clamp-3">
              {statement.description}
            </p>
          )}

          {/* Source Link */}
          {statement.source_url && (
            <div className="mt-3">
              <a
                href={statement.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-indigo-400 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="truncate max-w-[240px]">
                  {statement.source_url.replace(/^https?:\/\//, "")}
                </span>
              </a>
            </div>
          )}
        </div>

        {/* Voting & Selection Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between">
          {/* Vote Counter Button */}
          <button
            onClick={handleVote}
            disabled={isVoting}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-mono font-medium transition-all ${
              statement.has_voted
                ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-300 shadow-sm shadow-indigo-500/20"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
            }`}
          >
            <ThumbsUp
              className={`h-3.5 w-3.5 ${
                statement.has_voted ? "text-indigo-400 fill-indigo-400/30" : "text-zinc-500"
              }`}
            />
            <span>{statement.vote_count || 0} Votes</span>
          </button>

          {/* Captain / Member Select Action */}
          {!isSelected ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelect}
              disabled={isSelecting}
              className="h-8 px-2.5 text-[11px] rounded-xl gap-1 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40"
            >
              <Crown className="h-3 w-3 text-amber-500" />
              <span>Select as Winning Idea</span>
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-mono font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Primary Build Focus</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
