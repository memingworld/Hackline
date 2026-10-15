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
      className={`rounded-2xl border p-5 flex flex-col justify-between transition-all ${
        isSelected
          ? "border-[#e5a93c] bg-[#28231d] shadow-lg shadow-[#e5a93c]/5 ring-1 ring-[#e5a93c]/30"
          : "border-[rgba(229,169,60,0.2)] bg-[#1f1b16] hover:border-[rgba(229,169,60,0.38)] shadow-sm"
      }`}
    >
      <div>
        {/* Top badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6] font-medium">
              {statement.track || "General Track"}
            </span>

            {isSelected && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-[rgba(229,169,60,0.4)] bg-[#e5a93c]/15 text-[#e5a93c]">
                <Crown className="h-2.5 w-2.5 text-[#e5a93c]" />
                <span>Selected Topic</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(statement)}
              className="p-1.5 rounded-lg text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d] transition-colors"
              title="Edit statement"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-[#a89a8c] hover:text-[#e06c75] hover:bg-[#e06c75]/10 transition-colors"
              title="Delete statement"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-[#fef3c7] tracking-tight leading-snug">
          {statement.title}
        </h3>

        {statement.description && (
          <p className="mt-2 text-xs text-[#a89a8c] leading-relaxed line-clamp-3">
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
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[#a89a8c] hover:text-[#7bb4d6] transition-colors"
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
      <div className="mt-6 pt-4 border-t border-[rgba(229,169,60,0.15)] flex items-center justify-between">
        {/* Vote Counter Button */}
        <button
          onClick={handleVote}
          disabled={isVoting}
          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-mono font-medium transition-all ${
            statement.has_voted
              ? "border-[#e5a93c] bg-[#e5a93c]/20 text-[#e5a93c] font-semibold"
              : "border-[rgba(229,169,60,0.2)] bg-[#181410] text-[#a89a8c] hover:border-[rgba(229,169,60,0.35)] hover:text-[#fef3c7]"
          }`}
        >
          <ThumbsUp
            className={`h-3.5 w-3.5 ${
              statement.has_voted ? "text-[#e5a93c] fill-[#e5a93c]/30" : "text-[#a89a8c]"
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
            className="h-8 px-2.5 text-[11px] rounded-xl gap-1 text-[#a89a8c] hover:text-[#e5a93c] hover:border-[rgba(229,169,60,0.4)]"
          >
            <Crown className="h-3 w-3 text-[#e5a93c]" />
            <span>Select as Winning Idea</span>
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-[#e5a93c] font-mono font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Primary Build Focus</span>
          </span>
        )}
      </div>
    </div>
  );
}
