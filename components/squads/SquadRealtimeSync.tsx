"use client";

import { useSquadRealtime } from "@/hooks/useSquadRealtime";

interface SquadRealtimeSyncProps {
  teamId?: string | null;
  hackathonId?: string | null;
  debounceMs?: number;
}

/**
 * Invisible background Realtime sync provider.
 * Keeps server components and child client state in sync over Supabase WebSockets.
 */
export function SquadRealtimeSync({
  teamId,
  hackathonId,
  debounceMs,
}: SquadRealtimeSyncProps) {
  useSquadRealtime({ teamId, hackathonId, debounceMs });
  return null;
}
