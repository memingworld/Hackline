"use client";

import * as React from "react";
import { TimelineEvent, Hackathon } from "@/types/database";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Circle,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateMultiEventIcsContent, generateGoogleCalendarUrl } from "@/lib/utils/calendar";
import { toDateKey } from "@/lib/utils";
import Link from "next/link";

interface UnifiedCalendarViewProps {
  events: (TimelineEvent & { hackathon?: Hackathon })[];
  hackathons: Hackathon[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function UnifiedCalendarView({
  events,
  hackathons,
}: UnifiedCalendarViewProps) {
  // Calendar month state
  const [currentDate, setCurrentDate] = React.useState<Date>(() => {
    const upcoming = events.find(
      (e) => new Date(e.deadline).getTime() >= Date.now()
    );
    return upcoming ? new Date(upcoming.deadline) : new Date();
  });

  const [selectedHackathonId, setSelectedHackathonId] = React.useState<string>("all");
  const [selectedDateStr, setSelectedDateStr] = React.useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Filter events
  const filteredEvents = React.useMemo(() => {
    if (selectedHackathonId === "all") return events;
    return events.filter((e) => e.hackathon_id === selectedHackathonId);
  }, [events, selectedHackathonId]);

  // Map events to date strings (YYYY-MM-DD)
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, (TimelineEvent & { hackathon?: Hackathon })[]>();
    filteredEvents.forEach((e) => {
      const dStr = toDateKey(e.deadline);
      const existing = map.get(dStr) || [];
      existing.push(e);
      map.set(dStr, existing);
    });
    return map;
  }, [filteredEvents]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(toDateKey(today));
  };

  // Build calendar matrix cells (padded prev + curr + padded next)
  const calendarCells = React.useMemo(() => {
    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    const todayStr = toDateKey(new Date());

    // 1. Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = toDateKey(prevDate);
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = toDateKey(curDate);
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // 3. Next month leading days to complete grid (total multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = toDateKey(nextDate);
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [year, month, firstDayOfWeek, daysInMonth, daysInPrevMonth]);

  // Export all filtered events as unified .ics
  const handleExportAllIcs = () => {
    if (filteredEvents.length === 0) {
      toast.error("No milestone gates to export.");
      return;
    }

    const icsContent = generateMultiEventIcsContent(
      filteredEvents.map((e) => ({
        title: `${e.title} [${e.hackathon?.title || "Hackathon"}]`,
        details: `Hackline Sprint Gate for ${e.hackathon?.title || "Hackathon"}.`,
        startIso: e.deadline,
      }))
    );

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hackline-master-schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Master schedule exported (.ics)!", {
      description: `Synchronized ${filteredEvents.length} sprint gates to your calendar.`,
    });
  };

  // Events on currently selected day
  const selectedDayEvents = eventsByDate.get(selectedDateStr) || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[rgba(229,169,60,0.18)]">
        {/* Hackathon Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-mono text-[#a89a8c] uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setSelectedHackathonId("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium shrink-0 transition-all ${
              selectedHackathonId === "all"
                ? "bg-[#e5a93c]/15 text-[#fef3c7] border border-[#e5a93c]/40 font-semibold shadow-sm"
                : "text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d] border border-transparent"
            }`}
          >
            All Sprints ({events.length})
          </button>

          {hackathons.map((h) => {
            const count = events.filter((e) => e.hackathon_id === h.id).length;
            const isSelected = selectedHackathonId === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedHackathonId(h.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#e5a93c]/15 text-[#fef3c7] border border-[#e5a93c]/40 font-semibold shadow-sm"
                    : "text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#28231d] border border-transparent"
                }`}
              >
                <span className="uppercase text-[10px] text-[#7bb4d6]">
                  {h.source_platform}
                </span>
                <span className="truncate max-w-[150px]">{h.title}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Master Universal Calendar Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
          <Button
            size="sm"
            variant="primary"
            onClick={handleExportAllIcs}
            className="rounded-xl text-xs gap-1.5 shadow-md active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export All Deadlines (.ics)</span>
          </Button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.20)] p-5 sm:p-7 shadow-xl space-y-6">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(229,169,60,0.15)] flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#fef3c7] tracking-tight font-mono">
              {monthName} {year}
            </h2>
            <button
              onClick={handleGoToToday}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-[rgba(229,169,60,0.25)] bg-[#181410] text-[#fef3c7] hover:border-[#e5a93c] transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-[rgba(229,169,60,0.20)] bg-[#28231d] text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#332c25] transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-[rgba(229,169,60,0.20)] bg-[#28231d] text-[#a89a8c] hover:text-[#fef3c7] hover:bg-[#332c25] transition-colors"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-mono font-medium text-[#a89a8c] py-1">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              const dayEvents = eventsByDate.get(cell.dateStr) || [];
              const isSelected = selectedDateStr === cell.dateStr;

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[75px] sm:min-h-[100px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-[#e5a93c] bg-[#e5a93c]/15 shadow-md shadow-[#e5a93c]/10 ring-1 ring-[#e5a93c]/30"
                      : cell.isCurrentMonth
                      ? "border-[rgba(229,169,60,0.18)] bg-[#181410] hover:border-[rgba(229,169,60,0.35)] hover:bg-[#231e18]"
                      : "border-[rgba(229,169,60,0.08)] bg-[#14110e]/60 opacity-40 hover:opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-semibold h-6 w-6 rounded-full flex items-center justify-center ${
                        cell.isToday
                          ? "bg-[#e5a93c] text-[#14110e] font-black shadow-[0_0_8px_rgba(229,169,60,0.8)]"
                          : isSelected
                          ? "text-[#e5a93c] font-bold"
                          : cell.isCurrentMonth
                          ? "text-[#fef3c7]"
                          : "text-[#a89a8c]"
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#e5a93c]/20 text-[#e5a93c] border border-[#e5a93c]/30">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Chips preview */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[10px] font-mono truncate px-1.5 py-0.5 rounded bg-[#28231d] text-[#fef3c7] border border-[rgba(229,169,60,0.15)] flex items-center gap-1"
                        title={ev.title}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#e5a93c] shrink-0" />
                        <span className="truncate">{ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] font-mono text-[#a89a8c] block text-right">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Milestones Detail Inspector */}
      <div className="rounded-2xl bg-[#1f1b16] border border-[rgba(229,169,60,0.20)] p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#e5a93c]" />
            <h3 className="text-sm font-bold text-[#fef3c7] font-mono">
              Milestones on {new Date(selectedDateStr + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </h3>
            <span className="text-xs font-mono text-[#a89a8c]">
              ({selectedDayEvents.length} gates)
            </span>
          </div>
        </div>

        {selectedDayEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedDayEvents.map((ev) => {
              const diffHours = Math.round(
                (new Date(ev.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
              );
              const isUrgent = diffHours > 0 && diffHours <= 24;

              const gcalUrl = generateGoogleCalendarUrl(
                ev.title,
                `Milestone Gate for ${ev.hackathon?.title || "Hackathon"}`,
                ev.deadline
              );

              return (
                <div
                  key={ev.id}
                  className="rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#181410] p-4 space-y-3 flex flex-col justify-between hover:border-[rgba(229,169,60,0.35)] transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#28231d] text-[#fef3c7] truncate max-w-[130px] border border-[rgba(229,169,60,0.15)]">
                        {ev.hackathon?.title || "Sprint"}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          isUrgent
                            ? "bg-[#e5a93c]/15 text-[#e5a93c] font-bold border border-[#e5a93c]/30"
                            : "text-[#a89a8c] bg-[#28231d]"
                        }`}
                      >
                        {diffHours <= 0
                          ? "Concluded"
                          : diffHours <= 24
                          ? `T-${diffHours}h left`
                          : `${Math.round(diffHours / 24)}d left`}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#fef3c7] line-clamp-1 font-mono">
                      {ev.title}
                    </h4>

                    <span className="text-xs font-mono text-[#a89a8c] block">
                      Time:{" "}
                      {new Date(ev.deadline).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-[rgba(229,169,60,0.12)] flex items-center justify-between text-xs">
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#a89a8c] hover:text-[#fef3c7] font-mono text-[11px] flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 text-[#e5a93c]" />
                      <span>Add to GCal</span>
                    </a>

                    {ev.hackathon_id && (
                      <Link
                        href={`/dashboard/hackathons/${ev.hackathon_id}`}
                        className="text-[#e5a93c] hover:underline flex items-center gap-1 font-medium font-mono"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-[#a89a8c] font-mono">
            No milestones scheduled on this date. Click any date on the calendar above or export all deadlines.
          </div>
        )}
      </div>

      {/* Comprehensive Chronological Master List */}
      <div className="space-y-4 pt-4 border-t border-[rgba(229,169,60,0.15)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#e5a93c]" />
            <h3 className="text-sm font-bold text-[#fef3c7] font-mono uppercase tracking-wider">
              Complete Chronological Roadmap ({filteredEvents.length} gates)
            </h3>
          </div>
        </div>

        <div className="space-y-2">
          {filteredEvents.map((ev) => {
            const evTime = new Date(ev.deadline).getTime();
            const diffHours = Math.round((evTime - Date.now()) / (1000 * 60 * 60));
            const isUrgent = diffHours > 0 && diffHours <= 24;

            return (
              <div
                key={ev.id}
                className="rounded-xl border border-[rgba(229,169,60,0.18)] bg-[#181410] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[rgba(229,169,60,0.35)] transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-2.5 w-2.5 rounded-full shrink-0 ${
                      ev.is_completed
                        ? "bg-[#a89a8c]"
                        : isUrgent
                        ? "bg-[#e5a93c] animate-pulse"
                        : "bg-[#7bb4d6]"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#fef3c7] font-mono">{ev.title}</span>
                      {ev.hackathon?.title && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[rgba(74,130,166,0.35)] bg-[#4a82a6]/15 text-[#7bb4d6]">
                          {ev.hackathon.title}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[#a89a8c]">
                      {new Date(ev.deadline).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      isUrgent
                        ? "bg-[#e5a93c]/15 text-[#e5a93c] border border-[#e5a93c]/30"
                        : "text-[#a89a8c] bg-[#28231d] border border-[rgba(229,169,60,0.15)]"
                    }`}
                  >
                    {diffHours <= 0
                      ? "Concluded"
                      : diffHours <= 24
                      ? `T-${diffHours}h`
                      : `${Math.round(diffHours / 24)}d left`}
                  </span>

                  {ev.hackathon_id && (
                    <Link
                      href={`/dashboard/hackathons/${ev.hackathon_id}`}
                      className="text-xs text-[#e5a93c] hover:underline flex items-center gap-1 font-mono font-semibold"
                    >
                      <span>Workspace</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
