"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { TimelineEventType } from "@/types/database";

export interface CreateTimelineEventPayload {
  hackathonId: string;
  teamId?: string;
  title: string;
  eventType?: TimelineEventType;
  deadline: string;
}

/**
 * Add a new milestone gate to the timeline.
 */
export async function createTimelineEvent(payload: CreateTimelineEventPayload) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    if (!payload.title.trim() || !payload.deadline) {
      return { success: false, error: "Title and deadline are required." };
    }

    const { data, error } = await supabase
      .from("timeline_events")
      .insert({
        hackathon_id: payload.hackathonId,
        team_id: payload.teamId || null,
        title: payload.title.trim(),
        event_type: payload.eventType || "custom",
        deadline: new Date(payload.deadline).toISOString(),
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
    return { success: true, event: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create timeline event." };
  }
}

/**
 * Toggle milestone completion status.
 */
export async function toggleTimelineEventCompletion(eventId: string, isCompleted: boolean) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase
      .from("timeline_events")
      .update({ is_completed: isCompleted })
      .eq("id", eventId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update milestone." };
  }
}

/**
 * Delete a milestone event.
 */
export async function deleteTimelineEvent(eventId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase
      .from("timeline_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete milestone." };
  }
}
