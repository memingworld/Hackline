"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { AssetCategory } from "@/types/database";
import { sanitizeSafeUrl, sanitizePlainText } from "@/lib/security";

export interface CreateAssetPayload {
  teamId: string;
  hackathonId: string;
  category: AssetCategory;
  title: string;
  url: string;
  description?: string;
}

/**
 * Register a new asset link in the Asset Hub.
 */
export async function createAsset(payload: CreateAssetPayload) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const cleanTitle = sanitizePlainText(payload.title);
    const cleanUrl = sanitizeSafeUrl(payload.url);

    if (!cleanTitle || !cleanUrl) {
      return { success: false, error: "Valid Title and HTTP/HTTPS URL are required." };
    }

    // Verify user is a member of this team
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", payload.teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return { success: false, error: "Forbidden: You must be a squad member to add deliverables." };
    }

    const { data, error } = await supabase
      .from("assets")
      .insert({
        team_id: payload.teamId,
        hackathon_id: payload.hackathonId,
        category: payload.category || "other",
        title: cleanTitle,
        url: cleanUrl,
        description: sanitizePlainText(payload.description) || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/assets");
    return { success: true, asset: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create asset." };
  }
}

/**
 * Update an existing asset.
 * Enforces: Only the asset creator or the squad captain can edit deliverables.
 */
export async function updateAsset(
  id: string,
  payload: {
    category: AssetCategory;
    title: string;
    url: string;
    description?: string;
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
    const cleanUrl = sanitizeSafeUrl(payload.url);

    if (!cleanTitle || !cleanUrl) {
      return { success: false, error: "Valid Title and HTTP/HTTPS URL are required." };
    }

    // Verify ownership: author or squad captain
    const { data: asset, error: fetchErr } = await supabase
      .from("assets")
      .select("created_by, team_id, team:teams(captain_id)")
      .eq("id", id)
      .single();

    if (fetchErr || !asset) {
      return { success: false, error: "Asset deliverable not found." };
    }

    const teamCaptainId = (asset.team as any)?.captain_id;
    const isAuthor = asset.created_by === user.id;
    const isCaptain = teamCaptainId === user.id;

    if (!isAuthor && !isCaptain) {
      return {
        success: false,
        error: "Forbidden: Only the asset author or squad captain can edit this deliverable.",
      };
    }

    const { error } = await supabase
      .from("assets")
      .update({
        category: payload.category,
        title: cleanTitle,
        url: cleanUrl,
        description: sanitizePlainText(payload.description) || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update asset." };
  }
}

/**
 * Delete an asset.
 * Enforces: Only the asset creator or the squad captain can delete deliverables.
 */
export async function deleteAsset(id: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    // Verify ownership: author or squad captain
    const { data: asset, error: fetchErr } = await supabase
      .from("assets")
      .select("created_by, team_id, team:teams(captain_id)")
      .eq("id", id)
      .single();

    if (fetchErr || !asset) {
      return { success: false, error: "Asset deliverable not found." };
    }

    const teamCaptainId = (asset.team as any)?.captain_id;
    const isAuthor = asset.created_by === user.id;
    const isCaptain = teamCaptainId === user.id;

    if (!isAuthor && !isCaptain) {
      return {
        success: false,
        error: "Forbidden: Only the asset author or squad captain can delete this deliverable.",
      };
    }

    const { error } = await supabase
      .from("assets")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/assets");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete asset." };
  }
}
