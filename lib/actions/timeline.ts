"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { TimelineEventType } from "@/types/database";
import { sanitizePlainText } from "@/lib/security";
import { parseDateTimeInputToUtc } from "@/lib/utils";

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

    const cleanTitle = sanitizePlainText(payload.title);
    if (!cleanTitle || !payload.deadline) {
      return { success: false, error: "Title and deadline are required." };
    }

    // Verify authorization: team captain / member, or hackathon creator
    if (payload.teamId) {
      const { data: team } = await supabase
        .from("teams")
        .select("captain_id")
        .eq("id", payload.teamId)
        .maybeSingle();

      const { data: membership } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", payload.teamId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership && team?.captain_id !== user.id) {
        return { success: false, error: "Forbidden: You are not a member of this squad." };
      }
    } else {
      const { data: hackathon } = await supabase
        .from("hackathons")
        .select("created_by")
        .eq("id", payload.hackathonId)
        .maybeSingle();

      if (!hackathon || (hackathon.created_by && hackathon.created_by !== user.id)) {
        return { success: false, error: "Forbidden: Only the hackathon creator can add global milestones." };
      }
    }

    const { data, error } = await supabase
      .from("timeline_events")
      .insert({
        hackathon_id: payload.hackathonId,
        team_id: payload.teamId || null,
        title: cleanTitle,
        event_type: payload.eventType || "custom",
        deadline: parseDateTimeInputToUtc(payload.deadline),
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard/hackathons");
    if (payload.hackathonId) {
      revalidatePath(`/dashboard/hackathons/${payload.hackathonId}`);
    }
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

    const { data: event, error: fetchErr } = await supabase
      .from("timeline_events")
      .select("id, hackathon_id, team_id, team:teams(captain_id), hackathon:hackathons(created_by)")
      .eq("id", eventId)
      .maybeSingle();

    if (fetchErr || !event) {
      return { success: false, error: "Milestone not found." };
    }

    // Verify authorization: team member, squad captain, or event creator
    let isAuthorized = false;
    const isTeamCaptain = (event.team as any)?.captain_id === user.id;
    const isHackathonCreator = (event.hackathon as any)?.created_by === user.id;

    if (isTeamCaptain || isHackathonCreator) {
      isAuthorized = true;
    } else if (event.team_id) {
      const { data: membership } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", event.team_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership) isAuthorized = true;
    }

    if (!isAuthorized) {
      return {
        success: false,
        error: "Forbidden: You do not have permission to modify this milestone.",
      };
    }

    const { data: updatedEvent, error } = await supabase
      .from("timeline_events")
      .update({ is_completed: isCompleted })
      .eq("id", eventId)
      .select("hackathon_id")
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
    revalidatePath("/dashboard/hackathons");
    if (updatedEvent?.hackathon_id) {
      revalidatePath(`/dashboard/hackathons/${updatedEvent.hackathon_id}`);
    }
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

    const { data: event, error: fetchErr } = await supabase
      .from("timeline_events")
      .select("hackathon_id, team_id, team:teams(captain_id), hackathon:hackathons(created_by)")
      .eq("id", eventId)
      .single();

    if (fetchErr || !event) {
      return { success: false, error: "Milestone not found." };
    }

    const isTeamCaptain = (event.team as any)?.captain_id === user.id;
    const isHackathonCreator = (event.hackathon as any)?.created_by === user.id;

    if (!isTeamCaptain && !isHackathonCreator) {
      return {
        success: false,
        error: "Forbidden: Only the squad captain or hackathon creator can delete this milestone.",
      };
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
    revalidatePath("/dashboard/hackathons");
    if (event?.hackathon_id) {
      revalidatePath(`/dashboard/hackathons/${event.hackathon_id}`);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete milestone." };
  }
}
