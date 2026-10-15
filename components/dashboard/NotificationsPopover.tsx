"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  Clock,
  ShieldCheck,
  Send,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Settings,
  Sparkles,
} from "lucide-react";
import { Hackathon, Team } from "@/types/database";

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  activeHackathon: Hackathon | null;
  currentTeam: Team | null;
}

export interface AlertItem {
  id: string;
  type: "deadline" | "squad" | "checklist" | "info";
  title: string;
  description: string;
  timestamp: string;
  href?: string;
  urgent?: boolean;
}

export function NotificationsPopover({
  isOpen,
  onClose,
  activeHackathon,
  currentTeam,
}: NotificationsPopoverProps) {
  const [cleared, setCleared] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute live alerts dynamically based on active sprint context
  const alerts: AlertItem[] = (() => {
    if (cleared) return [];

    const list: AlertItem[] = [];

    // 1. Hackathon Countdown Alert (Only if real hackathon exists)
    if (activeHackathon && activeHackathon.ends_at) {
      const endsTime = new Date(activeHackathon.ends_at).getTime();
      if (!isNaN(endsTime)) {
        const diffHours = Math.round((endsTime - Date.now()) / (1000 * 60 * 60));
        if (diffHours > 0) {
          list.push({
            id: "alert-deadline",
            type: "deadline",
            title: `Submission Gate: ${diffHours}h remaining`,
            description: `Deadline approaching for "${activeHackathon.title}". Complete deliverable links and run pre-flight verification.`,
            timestamp: "Active Sprint",
            href: `/dashboard/hackathons/${activeHackathon.id}`,
            urgent: diffHours <= 24,
          });
        } else {
          list.push({
            id: "alert-concluded",
            type: "deadline",
            title: "Sprint Concluded",
            description: `Submission window for "${activeHackathon.title}" has concluded. Review judging and results.`,
            timestamp: "Past Event",
            href: `/dashboard/hackathons/${activeHackathon.id}`,
          });
        }
      }
    }

    // 2. Squad Roster Info
    if (activeHackathon && !currentTeam) {
      list.push({
        id: "alert-squad",
        type: "squad",
        title: "Solo Contributor",
        description: `You are currently registered solo for "${activeHackathon.title}". Form a crew or deploy a squad preset if desired.`,
        timestamp: "Squad Status",
        href: "/dashboard/squad",
        urgent: false,
      });
    }

    return list;
  })();

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.22)] shadow-2xl overflow-hidden backdrop-blur-2xl"
    >
      {/* Popover Header */}
      <div className="p-3.5 px-4 border-b border-[rgba(229,169,60,0.18)] flex items-center justify-between bg-[#28231d]">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#e5a93c]" />
          <span className="text-xs font-bold text-[#fef3c7] tracking-tight font-mono">
            Notifications & Alerts
          </span>
          {alerts.length > 0 && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#e5a93c]/15 border border-[rgba(229,169,60,0.30)] text-[#e5a93c]">
              {alerts.length}
            </span>
          )}
        </div>

        {alerts.length > 0 && (
          <button
            type="button"
            onClick={() => setCleared(true)}
            className="text-[11px] font-mono text-[#a89a8c] hover:text-[#fef3c7] transition-colors flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Alerts Content */}
      <div className="p-2 max-h-80 overflow-y-auto space-y-1.5 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#181410] border border-[rgba(229,169,60,0.20)] text-[#e5a93c] mb-2.5 shadow-inner">
              <CheckCircle2 className="h-5 w-5 text-[#e5a93c]" />
            </div>
            <span className="text-xs font-semibold text-[#fef3c7] font-mono">All Caught Up</span>
            <p className="text-[11px] text-[#a89a8c] mt-1 max-w-[220px] leading-relaxed">
              No active warnings or unaddressed milestone gates.
            </p>
          </div>
        ) : (
          alerts.map((item) => {
            const Content = (
              <div
                className={`p-3 rounded-xl border transition-colors ${
                  item.urgent
                    ? "border-amber-500/40 bg-amber-500/10 hover:border-amber-500/60"
                    : "border-[rgba(229,169,60,0.18)] bg-[#28231d]/70 hover:border-[rgba(229,169,60,0.35)]"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {item.urgent ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    ) : item.type === "squad" ? (
                      <Sparkles className="h-3.5 w-3.5 text-[#e5a93c] shrink-0" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-[#e5a93c] shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-[#fef3c7] tracking-tight">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#a89a8c] shrink-0">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-[#a89a8c] leading-relaxed pl-5">
                  {item.description}
                </p>
              </div>
            );

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className="block focus:outline-none"
                >
                  {Content}
                </Link>
              );
            }

            return (
              <div key={item.id} className="block">
                {Content}
              </div>
            );
          })
        )}
      </div>

      {/* Popover Footer */}
      <div className="p-2.5 px-4 border-t border-[rgba(229,169,60,0.18)] bg-[#28231d] flex items-center justify-between text-[11px] font-mono">
        <Link
          href="/dashboard/settings"
          onClick={onClose}
          className="text-[#a89a8c] hover:text-[#fef3c7] transition-colors flex items-center gap-1.5"
        >
          <Settings className="h-3 w-3" />
          <span>Notification Settings</span>
        </Link>
        <span className="text-[#a89a8c]">Telegram Engine Active</span>
      </div>
    </div>
  );
}
