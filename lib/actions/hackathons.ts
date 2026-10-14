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

export async function createHackathonFromScraper(payload: {
  title: string;
  slug?: string;
  source_platform: string;
  source_url: string;
  banner_url?: string | null;
  prize_pool?: string | null;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  team_name?: string;
  timeline_gates?: Array<{ title: string; deadline: string; event_type?: string }>;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const uniqueSlug =
      payload.slug ||
      `${payload.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;

    // 1. Insert Hackathon
    const { data: hackathon, error: hackError } = await supabase
      .from("hackathons")
      .insert({
        title: payload.title,
        slug: uniqueSlug,
        source_platform: payload.source_platform,
        source_url: payload.source_url,
        banner_url: payload.banner_url || null,
        prize_pool: payload.prize_pool || "TBA",
        description: payload.description || null,
        starts_at: payload.starts_at || new Date().toISOString(),
        ends_at:
          payload.ends_at ||
          new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (hackError || !hackathon) {
      return {
        success: false,
        error: hackError?.message || "Failed to create hackathon.",
      };
    }

    // 2. Initialize Squad / Team for this hackathon
    const squadName = payload.team_name || `${payload.title.slice(0, 15)} Squad`;
    const squadSlug = `${squadName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        hackathon_id: hackathon.id,
        captain_id: user.id,
        name: squadName,
        slug: squadSlug,
        description: `Squad participating in ${payload.title}`,
      })
      .select()
      .single();

    if (!teamError && team) {
      // Add captain as first member
      await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        duty: "Squad Lead & Full-Stack",
        is_captain: true,
      });

      // Insert timeline gates if extracted
      if (payload.timeline_gates && payload.timeline_gates.length > 0) {
        const gatesToInsert = payload.timeline_gates.map((g) => ({
          hackathon_id: hackathon.id,
          team_id: team.id,
          title: g.title,
          deadline: g.deadline,
          event_type: (g.event_type as any) || "custom",
          is_completed: false,
        }));
        await supabase.from("timeline_events").insert(gatesToInsert);
      }

      // Initialize default submission checklist
      const defaultChecks = [
        {
          team_id: team.id,
          item_key: "repo_public",
          title: "Public GitHub repository with open source license",
        },
        {
          team_id: team.id,
          item_key: "readme_diagram",
          title: "README documentation with architecture diagram & setup guide",
        },
        {
          team_id: team.id,
          item_key: "demo_video",
          title: "3-minute Loom demo walkthrough uploaded",
        },
        {
          team_id: team.id,
          item_key: "teammates_added",
          title: "All squad members verified on event portal",
        },
      ];
      await supabase.from("submission_checklists").insert(defaultChecks);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/hackathons");
    return { success: true, hackathonId: hackathon.id };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to process hackathon creation.",
    };
  }
}

