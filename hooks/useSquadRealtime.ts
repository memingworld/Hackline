"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface UseSquadRealtimeOptions {
  teamId?: string | null;
  hackathonId?: string | null;
  onUpdate?: () => void;
  debounceMs?: number;
}

/**
 * Silent Supabase Realtime hook that listens for PostgreSQL changes across squad gates,
 * Idea Vault problem statements, assets, roster, and hackathon info, triggering seamless
 * background refreshes without full page reloads or intrusive UI clutter.
 */
export function useSquadRealtime({
  teamId,
  hackathonId,
  onUpdate,
  debounceMs = 500,
}: UseSquadRealtimeOptions) {
  const router = useRouter();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!teamId && !hackathonId) return;

    const supabase = createClient();
    const channelName = `squad_realtime_${hackathonId || "all"}_${teamId || "noteam"}`;

    const triggerRefresh = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (onUpdate) {
          onUpdate();
        } else {
          router.refresh();
        }
      }, debounceMs);
    };

    let channel = supabase.channel(channelName);

    // 1. Listen for Pre-Flight Gate checklist changes
    if (teamId) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submission_checklists",
          filter: `team_id=eq.${teamId}`,
        },
        triggerRefresh
      );

      // 2. Listen for Idea Vault problem statements
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "problem_statements",
          filter: `team_id=eq.${teamId}`,
        },
        triggerRefresh
      );

      // 3. Listen for Idea Vault upvotes
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "problem_votes",
        },
        triggerRefresh
      );

      // 4. Listen for Asset Hub uploads & edits
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assets",
          filter: `team_id=eq.${teamId}`,
        },
        triggerRefresh
      );

      // 5. Listen for Squad Roster membership changes
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_members",
          filter: `team_id=eq.${teamId}`,
        },
        triggerRefresh
      );

      // 6. Listen for Team metadata updates (e.g. name, description)
      channel = channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "teams",
          filter: `id=eq.${teamId}`,
        },
        triggerRefresh
      );
    }

    // 7. Listen for Hackathon info updates
    if (hackathonId) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "hackathons",
          filter: `id=eq.${hackathonId}`,
        },
        triggerRefresh
      );
    }

    channel.subscribe();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [teamId, hackathonId, onUpdate, debounceMs, router]);
}
