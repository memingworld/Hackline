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
