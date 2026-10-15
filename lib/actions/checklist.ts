"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizePlainText } from "@/lib/security";

const DEFAULT_GATES = [
  { item_key: "repo_public", title: "Repository is Public with Open-Source License" },
  { item_key: "demo_video_ready", title: "Demo Walkthrough Video Recorded & Accessible (< 3 mins)" },
  { item_key: "deck_finalized", title: "Pitch Presentation Slides Finalized & Hosted" },
  { item_key: "teammates_verified", title: "All Squad Teammates Registered on Portal" },
  { item_key: "readme_architecture", title: "README Documentation & Architecture Diagram Included" },
];

/**
 * Ensure default pre-flight checklist gates exist for the active team.
 */
export async function ensureDefaultChecklistItems(teamId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !teamId) return { success: false };

    const { count } = await supabase
      .from("submission_checklists")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId);

    if (count === 0) {
      const inserts = DEFAULT_GATES.map((gate) => ({
        team_id: teamId,
        item_key: gate.item_key,
        title: gate.title,
        is_completed: false,
      }));

      await supabase.from("submission_checklists").insert(inserts);
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/squad");
      revalidatePath("/dashboard/hackathons");
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Toggle a checklist item's completion status.
 */
export async function toggleChecklistItem(itemId: string, isCompleted: boolean) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase
      .from("submission_checklists")
      .update({
        is_completed: isCompleted,
        completed_by: isCompleted ? user.id : null,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq("id", itemId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    revalidatePath("/dashboard/hackathons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update checklist item." };
  }
}

/**
 * Add a custom verification gate to the team checklist.
 */
export async function createChecklistItem(teamId: string, title: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const cleanTitle = sanitizePlainText(title);
    if (!cleanTitle) {
      return { success: false, error: "Title is required." };
    }

    // Verify caller is a member of this team
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return { success: false, error: "Forbidden: You are not a member of this squad." };
    }

    const itemKey = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const { data, error } = await supabase
      .from("submission_checklists")
      .insert({
        team_id: teamId,
        item_key: itemKey,
        title: cleanTitle,
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    revalidatePath("/dashboard/hackathons");
    return { success: true, item: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add checklist item." };
  }
}

/**
 * Delete a custom checklist gate.
 */
export async function deleteChecklistItem(itemId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase
      .from("submission_checklists")
      .delete()
      .eq("id", itemId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    revalidatePath("/dashboard/hackathons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete checklist item." };
  }
}
