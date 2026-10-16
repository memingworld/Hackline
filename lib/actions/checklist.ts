"use server";

import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizePlainText } from "@/lib/security";

import { DEFAULT_GATES } from "@/lib/constants/checklist";

/**
 * Ensure default pre-flight checklist gates exist for the active team.
 */
export async function ensureDefaultChecklistItems(teamId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !teamId) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    // Fetch team to verify captain or membership & retrieve hackathon_id
    const { data: team } = await supabase
      .from("teams")
      .select("id, captain_id, hackathon_id")
      .eq("id", teamId)
      .maybeSingle();

    if (!team) {
      return { success: false, error: "Squad not found." };
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    const isCaptain = team.captain_id === user.id;
    if (!membership && !isCaptain) {
      return { success: false, error: "Forbidden: You are not a member of this squad." };
    }

    // Check existing checklist gates
    const { data: existing, error: fetchErr } = await supabase
      .from("submission_checklists")
      .select("*")
      .eq("team_id", teamId);

    if (fetchErr) {
      return { success: false, error: fetchErr.message };
    }

    if (!existing || existing.length === 0) {
      const inserts = DEFAULT_GATES.map((gate) => ({
        team_id: teamId,
        item_key: gate.item_key,
        title: gate.title,
        is_completed: false,
      }));

      const { data: inserted, error: insertErr } = await supabase
        .from("submission_checklists")
        .upsert(inserts, { onConflict: "team_id,item_key" })
        .select();

      if (insertErr) {
        return { success: false, error: insertErr.message };
      }

      if (team.hackathon_id) {
        revalidatePath(`/dashboard/hackathons/${team.hackathon_id}`);
      }
      revalidatePath("/dashboard/hackathons/[id]", "page");
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/squad");
      revalidatePath("/dashboard/hackathons");

      return { success: true, items: inserted || [] };
    }

    return { success: true, items: existing };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to initialize default gates." };
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

    // Verify membership: caller must be a member or captain of the team
    const { data: item, error: fetchErr } = await supabase
      .from("submission_checklists")
      .select("team_id, team:teams(captain_id, hackathon_id)")
      .eq("id", itemId)
      .single();

    if (fetchErr || !item) {
      return { success: false, error: "Checklist item not found." };
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", item.team_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const isCaptain = (item.team as any)?.captain_id === user.id;

    if (!membership && !isCaptain) {
      return { success: false, error: "Forbidden: You are not a member of this squad." };
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

    const hackathonId = (item.team as any)?.hackathon_id;
    if (hackathonId) {
      revalidatePath(`/dashboard/hackathons/${hackathonId}`);
    }
    revalidatePath("/dashboard/hackathons/[id]", "page");
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

    // Verify caller is a member or captain of this team
    const { data: team } = await supabase
      .from("teams")
      .select("id, captain_id, hackathon_id")
      .eq("id", teamId)
      .maybeSingle();

    if (!team) {
      return { success: false, error: "Squad not found." };
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    const isCaptain = team.captain_id === user.id;

    if (!membership && !isCaptain) {
      return { success: false, error: "Forbidden: You are not a member of this squad." };
    }

    const itemKey = `custom_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

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

    if (team.hackathon_id) {
      revalidatePath(`/dashboard/hackathons/${team.hackathon_id}`);
    }
    revalidatePath("/dashboard/hackathons/[id]", "page");
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

    // Verify membership: user must be a member or captain of the team
    const { data: item, error: fetchErr } = await supabase
      .from("submission_checklists")
      .select("team_id, team:teams(captain_id, hackathon_id)")
      .eq("id", itemId)
      .single();

    if (fetchErr || !item) {
      return { success: false, error: "Checklist item not found." };
    }

    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", item.team_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const isCaptain = (item.team as any)?.captain_id === user.id;

    if (!membership && !isCaptain) {
      return { success: false, error: "Forbidden: You are not a member of this squad." };
    }

    const { error } = await supabase
      .from("submission_checklists")
      .delete()
      .eq("id", itemId);

    if (error) {
      return { success: false, error: error.message };
    }

    const hackathonId = (item.team as any)?.hackathon_id;
    if (hackathonId) {
      revalidatePath(`/dashboard/hackathons/${hackathonId}`);
    }
    revalidatePath("/dashboard/hackathons/[id]", "page");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    revalidatePath("/dashboard/hackathons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete checklist item." };
  }
}
