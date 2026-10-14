"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateHackathon(
  id: string,
  payload: {
    title: string;
    prize_pool?: string;
    description?: string;
    starts_at?: string;
    ends_at?: string;
    banner_url?: string;
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

    const { error } = await supabase
      .from("hackathons")
      .update({
        title: payload.title,
        prize_pool: payload.prize_pool,
        description: payload.description,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
        banner_url: payload.banner_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/hackathons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update hackathon" };
  }
}

export async function deleteHackathon(id: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase.from("hackathons").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/hackathons");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete hackathon" };
  }
}
