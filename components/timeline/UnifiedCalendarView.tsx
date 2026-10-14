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
    // If there are upcoming events, center on the first upcoming event's month
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
      const dStr = new Date(e.deadline).toISOString().slice(0, 10);
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
    setSelectedDateStr(today.toISOString().slice(0, 10));
  };

  // Build calendar matrix cells (padded prev + curr + padded next)
  const calendarCells = React.useMemo(() => {
    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Prev month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = d.toISOString().slice(0, 10);
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const dateStr = d.toISOString().slice(0, 10);
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill grid to multiple of 7
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let dayNum = 1; dayNum <= remaining; dayNum++) {
        const d = new Date(year, month + 1, dayNum);
        const dateStr = d.toISOString().slice(0, 10);
        cells.push({
          dateStr,
          dayNum,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
        });
      }
    }

    return cells;
  }, [year, month, firstDayOfWeek, daysInMonth, daysInPrevMonth]);

  // Master 1-Click Export of all deadlines to .ics
  const handleExportAllIcs = () => {
    const targetEvents = filteredEvents.length > 0 ? filteredEvents : events;
    if (targetEvents.length === 0) {
      toast.error("No deadlines available to export.");
      return;
    }

    const payload = targetEvents.map((e) => ({
      title: `${e.hackathon?.title ? `[${e.hackathon.title}] ` : ""}${e.title}`,
      details: `Hackathon Milestone Gate for ${e.hackathon?.title || "Hackline Sprint"}.\nPlatform: ${e.hackathon?.source_platform || "Custom"}\nPortal: ${e.hackathon?.source_url || "https://hackline.dev"}`,
      startIso: e.deadline,
    }));

    const icsContent = generateMultiEventIcsContent(payload);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `hackline_all_deadlines.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Exported All Deadlines!", {
      description: `Downloaded .ics with ${targetEvents.length} milestone dates ready for Apple/Google Calendar.`,
    });
  };

  const selectedDayEvents = eventsByDate.get(selectedDateStr) || [];

  return (
    <div className="space-y-6">
      {/* Top Filter and Master Export Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
        {/* Hackathon Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedHackathonId("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium shrink-0 transition-all ${
              selectedHackathonId === "all"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
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
                    ? "bg-white/10 text-white border border-white/20 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                }`}
              >
                <span className="uppercase text-[10px] text-zinc-500">
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
      <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-5 sm:p-7 shadow-xl space-y-6">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-850">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight font-mono">
              {monthName} {year}
            </h2>
            <button
              onClick={handleGoToToday}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-mono font-medium text-zinc-500 py-1">
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
                      ? "border-emerald-500/70 bg-emerald-950/20 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                      : cell.isCurrentMonth
                      ? "border-zinc-850/80 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60"
                      : "border-zinc-900/40 bg-zinc-950/30 opacity-40 hover:opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-semibold h-6 w-6 rounded-full flex items-center justify-center ${
                        cell.isToday
                          ? "bg-emerald-500 text-black font-bold shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                          : isSelected
                          ? "text-emerald-400 font-bold"
                          : cell.isCurrentMonth
                          ? "text-zinc-300"
                          : "text-zinc-600"
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Chips preview */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[10px] font-mono truncate px-1.5 py-0.5 rounded bg-zinc-800/90 text-zinc-300 border border-zinc-700/60 flex items-center gap-1"
                        title={ev.title}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="truncate">{ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] font-mono text-zinc-500 block text-right">
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
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              Milestones on {new Date(selectedDateStr + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </h3>
            <span className="text-xs font-mono text-zinc-500">
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
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 truncate max-w-[130px]">
                        {ev.hackathon?.title || "Sprint"}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          isUrgent
                            ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20"
                            : "text-zinc-400 bg-zinc-800"
                        }`}
                      >
                        {diffHours <= 0
                          ? "Concluded"
                          : diffHours <= 24
                          ? `T-${diffHours}h left`
                          : `${Math.round(diffHours / 24)}d left`}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      {ev.title}
                    </h4>

                    <span className="text-xs font-mono text-zinc-400 block">
                      Time:{" "}
                      {new Date(ev.deadline).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white font-mono text-[11px] flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Add to GCal</span>
                    </a>

                    {ev.hackathon_id && (
                      <Link
                        href={`/dashboard/hackathons/${ev.hackathon_id}`}
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
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
          <div className="p-6 text-center text-xs text-zinc-500 font-mono">
            No milestones scheduled on this date. Click any date on the calendar above or export all deadlines.
          </div>
        )}
      </div>

      {/* Comprehensive Chronological Master List */}
      <div className="space-y-4 pt-4 border-t border-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
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
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-2.5 w-2.5 rounded-full shrink-0 ${
                      ev.is_completed
                        ? "bg-zinc-600"
                        : isUrgent
                        ? "bg-amber-400 animate-pulse"
                        : "bg-emerald-400"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{ev.title}</span>
                      {ev.hackathon?.title && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300">
                          {ev.hackathon.title}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">
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
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "text-zinc-400 bg-zinc-900 border border-zinc-800"
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
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
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
