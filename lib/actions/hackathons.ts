"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizePlainText, sanitizeSafeUrl } from "@/lib/security";

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

    // Verify creator ownership (defense-in-depth against IDOR)
    const { data: hackathon, error: fetchErr } = await supabase
      .from("hackathons")
      .select("created_by")
      .eq("id", id)
      .single();

    if (fetchErr || !hackathon) {
      return { success: false, error: "Hackathon not found." };
    }

    if (hackathon.created_by && hackathon.created_by !== user.id) {
      return { success: false, error: "Forbidden: Only the hackathon creator can modify this event." };
    }

    const { error } = await supabase
      .from("hackathons")
      .update({
        title: sanitizePlainText(payload.title),
        prize_pool: sanitizePlainText(payload.prize_pool) || "TBA",
        description: sanitizePlainText(payload.description) || null,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
        banner_url: sanitizeSafeUrl(payload.banner_url) || null,
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

    // Verify creator ownership (defense-in-depth against IDOR)
    const { data: hackathon, error: fetchErr } = await supabase
      .from("hackathons")
      .select("created_by")
      .eq("id", id)
      .single();

    if (fetchErr || !hackathon) {
      return { success: false, error: "Hackathon not found." };
    }

    if (hackathon.created_by && hackathon.created_by !== user.id) {
      return { success: false, error: "Forbidden: Only the hackathon creator can delete this event." };
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

export async function createHackathon(payload: {
  title: string;
  slug?: string;
  source_platform?: string;
  source_url?: string | null;
  banner_url?: string | null;
  prize_pool?: string | null;
  description?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  team_name?: string;
  min_team_size?: number;
  max_team_size?: number;
  saved_squad_id?: string;
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

    const minSize = Math.max(1, payload.min_team_size || 1);
    const maxSize = Math.max(minSize, payload.max_team_size || 4);

    // 1. Insert Hackathon
    const { data: hackathon, error: hackError } = await supabase
      .from("hackathons")
      .insert({
        title: sanitizePlainText(payload.title),
        slug: uniqueSlug,
        source_platform: payload.source_platform || "custom",
        source_url: sanitizeSafeUrl(payload.source_url) || null,
        banner_url: sanitizeSafeUrl(payload.banner_url) || null,
        prize_pool: sanitizePlainText(payload.prize_pool) || "TBA",
        description: sanitizePlainText(payload.description) || null,
        starts_at: payload.starts_at || new Date().toISOString(),
        ends_at:
          payload.ends_at ||
          new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
        min_team_size: minSize,
        max_team_size: maxSize,
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

    // 2. Resolve Squad / Team for this hackathon (Preset or Custom)
    let savedSquad: any = null;
    if (payload.saved_squad_id) {
      const { data: preset } = await supabase
        .from("saved_squads")
        .select("*, members:saved_squad_members(*)")
        .eq("id", payload.saved_squad_id)
        .eq("owner_id", user.id)
        .single();
      savedSquad = preset;
    }

    const squadName =
      payload.team_name?.trim() ||
      savedSquad?.name ||
      `${payload.title.trim().slice(0, 30)} Squad`;
    const squadSlug = `${squadName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.random().toString(36).slice(2, 6)}`;

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        hackathon_id: hackathon.id,
        captain_id: user.id,
        name: squadName,
        slug: squadSlug,
        description: savedSquad?.description || `Squad participating in ${payload.title}`,
        max_members: maxSize,
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

      // If a saved preset was deployed, bind its team members
      if (savedSquad && savedSquad.members && savedSquad.members.length > 0) {
        let slotsAvailable = maxSize - 1;
        for (const sm of savedSquad.members) {
          if (slotsAvailable <= 0) break;
          if (sm.member_user_id && sm.member_user_id !== user.id) {
            await supabase.from("team_members").insert({
              team_id: team.id,
              user_id: sm.member_user_id,
              duty: sm.default_duty || "Core Contributor",
              is_captain: false,
            });
            slotsAvailable--;
          }
        }
      }

      // Insert timeline gates (either extracted, custom, or standard defaults)
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
      } else {
        const defaultGates = [
          {
            hackathon_id: hackathon.id,
            team_id: team.id,
            title: "Sprint Kickoff",
            deadline: payload.starts_at || new Date().toISOString(),
            event_type: "registration_deadline" as const,
            is_completed: false,
          },
          {
            hackathon_id: hackathon.id,
            team_id: team.id,
            title: "Submission Gate",
            deadline:
              payload.ends_at ||
              new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
            event_type: "submission_deadline" as const,
            is_completed: false,
          },
        ];
        await supabase.from("timeline_events").insert(defaultGates);
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

export const createHackathonFromScraper = createHackathon;

