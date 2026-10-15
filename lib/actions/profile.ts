"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { sanitizePlainText } from "@/lib/security";

export interface UpdateProfilePayload {
  fullName: string;
  githubHandle?: string;
  primaryRole?: string;
  phoneNumber?: string;
  bio?: string;
  discordHandle?: string;
  avatarUrl?: string | null;
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

    const updateData: Record<string, any> = {
      full_name: cleanFullName,
      github_handle: sanitizePlainText(payload.githubHandle) || null,
      primary_role: sanitizePlainText(payload.primaryRole) || null,
      phone_number: sanitizePlainText(payload.phoneNumber) || null,
      updated_at: new Date().toISOString(),
    };

    if (payload.avatarUrl !== undefined) {
      updateData.avatar_url = payload.avatarUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
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
 * Upload an avatar image file to the Supabase 'avatars' storage bucket
 * and update user profile and auth metadata.
 */
export async function uploadAvatar(formData: FormData): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const file = formData.get("avatar") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "No image file provided." };
    }

    // 1. File size validation (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: "Image size must be less than 5MB." };
    }

    // 2. MIME type validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Only JPG, PNG, WEBP, or GIF images are allowed." };
    }

    // 3. Ensure avatars bucket exists
    try {
      const adminClient = createAdminClient();
      const { data: buckets } = await adminClient.storage.listBuckets();
      const hasBucket = buckets?.some((b) => b.name === "avatars");
      if (!hasBucket) {
        await adminClient.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 5242880,
          allowedMimeTypes: allowedTypes,
        });
      }
    } catch (bErr) {
      console.warn("Storage bucket ensure check notice:", bErr);
    }

    // 4. File extension and target path
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Attempt upload with user client first
    let uploadResult = await supabase.storage
      .from("avatars")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    // Fallback to adminClient if user RLS policies are pending migration
    if (uploadResult.error) {
      const adminClient = createAdminClient();
      uploadResult = await adminClient.storage
        .from("avatars")
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });
    }

    if (uploadResult.error) {
      return { success: false, error: uploadResult.error.message };
    }

    // 5. Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // 6. Update user profile row
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // 7. Update auth metadata so session reflects avatar
    try {
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
    } catch (metaErr) {
      console.warn("Auth metadata update notice:", metaErr);
    }

    // 8. Clean up prior avatar files in this user's folder
    try {
      const adminClient = createAdminClient();
      const { data: fileList } = await adminClient.storage
        .from("avatars")
        .list(user.id);
      if (fileList && fileList.length > 1) {
        const currentFileName = filePath.split("/")[1];
        const oldFiles = fileList
          .filter((f) => f.name !== currentFileName)
          .map((f) => `${user.id}/${f.name}`);
        if (oldFiles.length > 0) {
          await adminClient.storage.from("avatars").remove(oldFiles);
        }
      }
    } catch (cleanupErr) {
      console.warn("Old avatar cleanup notice:", cleanupErr);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/squad");
    return { success: true, avatarUrl: publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to upload avatar image." };
  }
}

/**
 * Remove avatar image from profile and storage.
 */
export async function removeAvatar(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    // Reset avatar_url in profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // Reset avatar_url in auth user metadata
    try {
      await supabase.auth.updateUser({
        data: { avatar_url: null },
      });
    } catch (metaErr) {
      console.warn("Auth metadata update notice:", metaErr);
    }

    // Remove user avatar files from storage
    try {
      const adminClient = createAdminClient();
      const { data: fileList } = await adminClient.storage
        .from("avatars")
        .list(user.id);
      if (fileList && fileList.length > 0) {
        const filePaths = fileList.map((f) => `${user.id}/${f.name}`);
        await adminClient.storage.from("avatars").remove(filePaths);
      }
    } catch (cleanupErr) {
      console.warn("Avatar removal cleanup notice:", cleanupErr);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/squad");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to remove avatar." };
  }
}

/**
 * Change or set account password while logged in.
 * Verifies current password first for standard email/password users;
 * OAuth users (Google/GitHub) without an established password can set their first password directly.
 */
export async function changeUserPassword(payload: {
  currentPassword?: string;
  newPassword: string;
}): Promise<{ success: boolean; isFirstPasswordSet?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    if (!payload.newPassword || payload.newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." };
    }

    const authProvider = user.app_metadata?.provider || "email";
    const providers = (user.app_metadata?.providers as string[]) || [authProvider];
    const hasExistingPassword = providers.includes("email") || authProvider === "email";

    // 1. If user already has an established email/password, verify current password
    if (hasExistingPassword) {
      if (!payload.currentPassword) {
        return { success: false, error: "Current password is required." };
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: payload.currentPassword,
      });

      if (verifyError) {
        return { success: false, error: "Current password is incorrect. Please check your credentials." };
      }
    }

    // 2. Set/update new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: payload.newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true, isFirstPasswordSet: !hasExistingPassword };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update password." };
  }
}
