"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizeSafeUrl, sanitizePlainText } from "@/lib/security";

export interface CreateProblemPayload {
  teamId: string;
  hackathonId: string;
  title: string;
  description?: string;
  track?: string;
  sourceUrl?: string;
}

/**
 * Add a new problem statement to the team's Idea Vault.
 */
export async function createProblemStatement(payload: CreateProblemPayload) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const cleanTitle = sanitizePlainText(payload.title);
    if (!cleanTitle) {
      return { success: false, error: "Title is required." };
    }

    const { data, error } = await supabase
      .from("problem_statements")
      .insert({
        team_id: payload.teamId,
        hackathon_id: payload.hackathonId,
        title: cleanTitle,
        description: sanitizePlainText(payload.description) || null,
        track: sanitizePlainText(payload.track) || "General / Open",
        source_url: sanitizeSafeUrl(payload.sourceUrl) || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/vault");
    return { success: true, statement: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add problem statement." };
  }
}

/**
 * Update an existing problem statement in the Idea Vault.
 */
export async function updateProblemStatement(
  id: string,
  payload: {
    title: string;
    description?: string;
    track?: string;
    sourceUrl?: string;
  }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const cleanTitle = sanitizePlainText(payload.title);
    if (!cleanTitle) {
      return { success: false, error: "Title is required." };
    }

    const { error } = await supabase
      .from("problem_statements")
      .update({
        title: cleanTitle,
        description: sanitizePlainText(payload.description) || null,
        track: sanitizePlainText(payload.track) || null,
        source_url: sanitizeSafeUrl(payload.sourceUrl) || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/vault");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update problem statement." };
  }
}

/**
 * Delete a problem statement from the Idea Vault.
 */
export async function deleteProblemStatement(id: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase
      .from("problem_statements")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/vault");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete problem statement." };
  }
}

/**
 * Toggle user's vote on a problem statement (Blind/interactive upvoting).
 */
export async function toggleProblemVote(problemId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    // Check if vote already exists
    const { data: existingVote } = await supabase
      .from("problem_votes")
      .select("id")
      .eq("problem_id", problemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingVote) {
      // Retract vote
      const { error } = await supabase
        .from("problem_votes")
        .delete()
        .eq("id", existingVote.id);

      if (error) return { success: false, error: error.message };
      revalidatePath("/dashboard/vault");
      return { success: true, voted: false };
    } else {
      // Cast vote
      const { error } = await supabase
        .from("problem_votes")
        .insert({
          problem_id: problemId,
          user_id: user.id,
        });

      if (error) return { success: false, error: error.message };
      revalidatePath("/dashboard/vault");
      return { success: true, voted: true };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update vote." };
  }
}

/**
 * Lock in the primary winning problem statement for the squad.
 */
export async function selectProblemStatement(problemId: string, teamId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    // 1. Reset all others for this team
    await supabase
      .from("problem_statements")
      .update({ is_selected: false })
      .eq("team_id", teamId);

    // 2. Set this one to true
    const { error } = await supabase
      .from("problem_statements")
      .update({ is_selected: true, updated_at: new Date().toISOString() })
      .eq("id", problemId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/vault");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to lock in problem statement." };
  }
}
