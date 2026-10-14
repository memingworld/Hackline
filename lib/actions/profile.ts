"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizePlainText } from "@/lib/security";

export interface UpdateProfilePayload {
  fullName: string;
  githubHandle?: string;
  primaryRole?: string;
  phoneNumber?: string;
  bio?: string;
  discordHandle?: string;
  avatarUrl?: string;
}

/**
 * Update user developer identity and profile settings with server-side validation.
 */
export async function updateUserProfile(payload: UpdateProfilePayload) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const cleanFullName = sanitizePlainText(payload.fullName);
    if (!cleanFullName) {
      return { success: false, error: "Full name is required." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: cleanFullName,
        github_handle: sanitizePlainText(payload.githubHandle) || null,
        primary_role: sanitizePlainText(payload.primaryRole) || null,
        phone_number: sanitizePlainText(payload.phoneNumber) || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/squad");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update profile." };
  }
}

/**
 * Change account password while logged in, verifying current password first.
 */
export async function changeUserPassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    if (payload.newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }

    // 1. Verify current password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: payload.currentPassword,
    });

    if (verifyError) {
      return { success: false, error: "Current password is incorrect. Please check your credentials." };
    }

    // 2. Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: payload.newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to change password." };
  }
}
