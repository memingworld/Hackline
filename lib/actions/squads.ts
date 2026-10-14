"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface SavedSquadMemberInput {
  name: string;
  email: string;
  duty: string;
}

export interface SavedSquadPayload {
  name: string;
  description?: string;
  members: SavedSquadMemberInput[];
}

/**
 * Create a new reusable 4-person squad template.
 */
export async function createSavedSquad(payload: SavedSquadPayload) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    if (!payload.name?.trim()) {
      return { success: false, error: "Squad name is required." };
    }

    // 1. Insert Saved Squad
    const { data: squad, error: squadError } = await supabase
      .from("saved_squads")
      .insert({
        owner_id: user.id,
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
      })
      .select()
      .single();

    if (squadError || !squad) {
      return { success: false, error: squadError?.message || "Failed to create saved squad." };
    }

    // 2. Insert squad members (cap at 4)
    const validMembers = (payload.members || []).slice(0, 4).filter(
      (m) => m.name?.trim() && m.email?.trim()
    );

    if (validMembers.length > 0) {
      // Find matching profile user IDs by email where possible
      const memberEmails = validMembers.map((m) => m.email.trim().toLowerCase());
      const { data: existingProfiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("email", memberEmails);

      const profileMap = new Map<string, string>();
      if (existingProfiles) {
        existingProfiles.forEach((p) => {
          profileMap.set(p.email.toLowerCase(), p.id);
        });
      }

      const memberInserts = validMembers.map((m) => ({
        squad_id: squad.id,
        member_name: m.name.trim(),
        member_email: m.email.trim().toLowerCase(),
        default_duty: m.duty.trim() || "Full-Stack Developer",
        member_user_id: profileMap.get(m.email.trim().toLowerCase()) || null,
      }));

      const { error: membersError } = await supabase
        .from("saved_squad_members")
        .insert(memberInserts);

      if (membersError) {
        console.error("Warning: Failed to save squad members:", membersError.message);
      }
    }

    revalidatePath("/dashboard/squad");
    return { success: true, squadId: squad.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create saved squad." };
  }
}

/**
 * Update an existing saved squad template and its member roster.
 */
export async function updateSavedSquad(squadId: string, payload: SavedSquadPayload) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    // Update parent record
    const { error: squadError } = await supabase
      .from("saved_squads")
      .update({
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", squadId)
      .eq("owner_id", user.id);

    if (squadError) {
      return { success: false, error: squadError.message };
    }

    // Replace members
    await supabase.from("saved_squad_members").delete().eq("squad_id", squadId);

    const validMembers = (payload.members || []).slice(0, 4).filter(
      (m) => m.name?.trim() && m.email?.trim()
    );

    if (validMembers.length > 0) {
      const memberEmails = validMembers.map((m) => m.email.trim().toLowerCase());
      const { data: existingProfiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("email", memberEmails);

      const profileMap = new Map<string, string>();
      if (existingProfiles) {
        existingProfiles.forEach((p) => {
          profileMap.set(p.email.toLowerCase(), p.id);
        });
      }

      const memberInserts = validMembers.map((m) => ({
        squad_id: squadId,
        member_name: m.name.trim(),
        member_email: m.email.trim().toLowerCase(),
        default_duty: m.duty.trim() || "Full-Stack Developer",
        member_user_id: profileMap.get(m.email.trim().toLowerCase()) || null,
      }));

      await supabase.from("saved_squad_members").insert(memberInserts);
    }

    revalidatePath("/dashboard/squad");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update saved squad." };
  }
}

/**
 * Delete a saved squad profile.
 */
export async function deleteSavedSquad(squadId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase
      .from("saved_squads")
      .delete()
      .eq("id", squadId)
      .eq("owner_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/squad");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete saved squad." };
  }
}

/**
 * Update a member's duty/role in an active team.
 */
export async function updateMemberDuty(memberId: string, duty: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase
      .from("team_members")
      .update({ duty: duty.trim() })
      .eq("id", memberId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update member duty." };
  }
}

/**
 * Remove a member from an active squad.
 */
export async function removeMemberFromTeam(memberId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to remove member." };
  }
}

/**
 * Regenerate team invite code.
 */
export async function regenerateInviteCode(teamId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    // Try RPC first
    const { data: rpcCode, error: rpcError } = await supabase.rpc("regenerate_team_invite", {
      team_id_input: teamId,
    });

    if (!rpcError && rpcCode) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/squad");
      return { success: true, inviteCode: rpcCode };
    }

    // Fallback: Direct update with random 12-char hex
    const newCode = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
    const { error } = await supabase
      .from("teams")
      .update({ invite_code: newCode, updated_at: new Date().toISOString() })
      .eq("id", teamId)
      .eq("captain_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    return { success: true, inviteCode: newCode };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to regenerate invite code." };
  }
}

/**
 * Deploy a saved squad profile into an active hackathon team.
 */
export async function deploySavedSquadToActiveTeam(savedSquadId: string, teamId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    // 1. Fetch saved squad with members
    const { data: savedSquad, error: squadErr } = await supabase
      .from("saved_squads")
      .select("*, members:saved_squad_members(*)")
      .eq("id", savedSquadId)
      .single();

    if (squadErr || !savedSquad) {
      return { success: false, error: "Saved squad not found." };
    }

    // 2. Fetch active team and current members
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("*, members:team_members(*)")
      .eq("id", teamId)
      .single();

    if (teamErr || !team) {
      return { success: false, error: "Active team not found." };
    }

    // Verify user is captain
    if (team.captain_id !== user.id) {
      return { success: false, error: "Only the squad captain can deploy squad presets." };
    }

    // 3. Update team name to match saved squad name
    await supabase
      .from("teams")
      .update({ name: savedSquad.name, updated_at: new Date().toISOString() })
      .eq("id", teamId);

    // 4. For each saved squad member with a matched profile user ID, add if not already present
    const currentMemberUserIds = new Set(
      (team.members || []).map((m: any) => m.user_id)
    );

    let slotsAvailable = 4 - (team.members?.length || 0);

    if (savedSquad.members && savedSquad.members.length > 0 && slotsAvailable > 0) {
      for (const sm of savedSquad.members) {
        if (slotsAvailable <= 0) break;
        if (sm.member_user_id && !currentMemberUserIds.has(sm.member_user_id)) {
          await supabase.from("team_members").insert({
            team_id: teamId,
            user_id: sm.member_user_id,
            duty: sm.default_duty || "Full-Stack Developer",
            is_captain: false,
          });
          slotsAvailable--;
        }
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to deploy saved squad." };
  }
}

/**
 * Join an active squad using an invite code.
 */
export async function joinTeamByInviteCode(inviteCode: string, duty?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Please sign in or create an account to join this squad." };
    }

    // Try RPC first
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("join_team_with_invite", {
      invite_code_input: inviteCode,
      member_duty: duty?.trim() || "Full-Stack Developer",
    });

    if (!rpcErr && rpcRes) {
      const res = rpcRes as { success: boolean; error?: string; message?: string; team_id?: string };
      if (!res.success) {
        return { success: false, error: res.error || "Failed to join team." };
      }
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/squad");
      return { success: true, teamId: res.team_id };
    }

    // Fallback: Direct select & insert
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("id, captain_id")
      .eq("invite_code", inviteCode)
      .single();

    if (teamErr || !team) {
      return { success: false, error: "Invalid or expired squad invite link." };
    }

    // Check existing membership
    const { data: existing } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", team.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return { success: true, message: "Already a member of this squad.", teamId: team.id };
    }

    // Check team count < 4
    const { count } = await supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team.id);

    if (count !== null && count >= 4) {
      return { success: false, error: "This squad is already full (maximum 4 members reached)." };
    }

    const { error: insertErr } = await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: user.id,
      duty: duty?.trim() || "Full-Stack Developer",
      is_captain: false,
    });

    if (insertErr) {
      return { success: false, error: insertErr.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    return { success: true, teamId: team.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to join squad." };
  }
}
