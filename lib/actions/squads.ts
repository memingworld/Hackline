"use server";

import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizePlainText } from "@/lib/security";
import {
  extractReservedMembers,
  encodeReservedMembers,
  ReservedMember,
} from "@/lib/data/squads";
import { notifySquadDeployment } from "@/lib/actions/notifications";

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
export async function updateMemberDuty(memberId: string, duty: string, teamId?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const cleanDuty = sanitizePlainText(duty) || "Full-Stack Developer";

    // Handle reserved member duty update
    if (memberId.startsWith("reserved-") && teamId) {
      const { data: team } = await supabase
        .from("teams")
        .select("id, captain_id, description")
        .eq("id", teamId)
        .single();

      if (team) {
        if (team.captain_id !== user.id) {
          return { success: false, error: "Forbidden: Only the squad captain can edit reserved members." };
        }

        const { cleanDescription, reservedMembers } = extractReservedMembers(team.description);
        const updatedReserved = reservedMembers.map((rm, idx) => {
          const expectedId =
            rm.id || `reserved-${idx}-${encodeURIComponent(rm.email || String(idx))}`;
          if (expectedId === memberId || rm.id === memberId) {
            return { ...rm, duty: cleanDuty };
          }
          return rm;
        });

        const newDescription = encodeReservedMembers(cleanDescription, updatedReserved);
        await supabase
          .from("teams")
          .update({ description: newDescription, updated_at: new Date().toISOString() })
          .eq("id", teamId);

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/squad");
        return { success: true };
      }
    }

    // Verify permission: caller must be the member themselves or the team captain
    const { data: memberRecord, error: memErr } = await supabase
      .from("team_members")
      .select("user_id, team_id, team:teams(captain_id)")
      .eq("id", memberId)
      .single();

    if (memErr || !memberRecord) {
      return { success: false, error: "Squad member not found." };
    }

    const captainId = (memberRecord.team as any)?.captain_id;
    const isSelf = memberRecord.user_id === user.id;
    const isCaptain = captainId === user.id;

    if (!isSelf && !isCaptain) {
      return {
        success: false,
        error: "Forbidden: Only the squad captain or the teammate themselves can update this duty assignment.",
      };
    }

    const { error } = await supabase
      .from("team_members")
      .update({ duty: cleanDuty })
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
export async function removeMemberFromTeam(memberId: string, teamId?: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    // Handle reserved member removal
    if (memberId.startsWith("reserved-") && teamId) {
      const { data: team } = await supabase
        .from("teams")
        .select("id, captain_id, description")
        .eq("id", teamId)
        .single();

      if (team) {
        if (team.captain_id !== user.id) {
          return { success: false, error: "Forbidden: Only the squad captain can release reserved seats." };
        }

        const { cleanDescription, reservedMembers } = extractReservedMembers(team.description);
        const filtered = reservedMembers.filter((rm, idx) => {
          const expectedId =
            rm.id || `reserved-${idx}-${encodeURIComponent(rm.email || String(idx))}`;
          return expectedId !== memberId && rm.id !== memberId;
        });

        const newDescription = encodeReservedMembers(cleanDescription, filtered);
        await supabase
          .from("teams")
          .update({ description: newDescription, updated_at: new Date().toISOString() })
          .eq("id", teamId);

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/squad");
        return { success: true };
      }
    }

    // Verify permission: caller must be the member themselves (leaving) or the team captain (kicking)
    const { data: memberRecord, error: memErr } = await supabase
      .from("team_members")
      .select("user_id, team_id, is_captain, team:teams(captain_id)")
      .eq("id", memberId)
      .single();

    if (memErr || !memberRecord) {
      return { success: false, error: "Squad member not found." };
    }

    const captainId = (memberRecord.team as any)?.captain_id;
    const isSelf = memberRecord.user_id === user.id;
    const isCaptain = captainId === user.id;

    if (!isSelf && !isCaptain) {
      return {
        success: false,
        error: "Forbidden: Only the squad captain can remove teammates, or members can leave themselves.",
      };
    }

    // Captain cannot be removed unless team is deleted or ownership transferred
    if (memberRecord.is_captain && !isSelf) {
      return { success: false, error: "Cannot remove the squad captain." };
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

    // Fallback: Direct update with cryptographically secure random 12-char hex
    const newCode = crypto.randomBytes(6).toString("hex");
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
export async function deploySavedSquadToActiveTeam(
  savedSquadId: string,
  teamId: string,
  notifyTelegram: boolean = true
) {
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

    // 2. Fetch active team and current members and hackathon
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("*, members:team_members(*), hackathon:hackathons(*)")
      .eq("id", teamId)
      .single();

    if (teamErr || !team) {
      return { success: false, error: "Active team not found." };
    }

    // Verify user is captain
    if (team.captain_id !== user.id) {
      return { success: false, error: "Only the squad captain can deploy squad presets." };
    }

    const currentMemberUserIds = new Set(
      (team.members || []).map((m: any) => m.user_id)
    );

    const teamCap = team.max_members || 4;
    const { cleanDescription, reservedMembers: existingReserved } = extractReservedMembers(
      team.description
    );

    let slotsAvailable = teamCap - (team.members?.length || 0) - existingReserved.length;

    const registeredToInsert: Array<{ userId: string; name: string; email: string; duty: string }> = [];
    const newReservedMembers: ReservedMember[] = [...existingReserved];

    if (savedSquad.members && savedSquad.members.length > 0) {
      const missingProfileEmails = savedSquad.members
        .filter((sm: any) => !sm.member_user_id && sm.member_email)
        .map((sm: any) => sm.member_email.trim().toLowerCase());

      const emailToProfileMap = new Map<string, string>();
      if (missingProfileEmails.length > 0) {
        const { data: matchedProfiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("email", missingProfileEmails);

        matchedProfiles?.forEach((p) => {
          emailToProfileMap.set(p.email.toLowerCase(), p.id);
        });
      }

      for (const sm of savedSquad.members) {
        if (slotsAvailable <= 0) break;
        const normalizedEmail = (sm.member_email || "").trim().toLowerCase();
        const resolvedUserId = sm.member_user_id || emailToProfileMap.get(normalizedEmail) || null;

        if (resolvedUserId === user.id) continue;

        if (resolvedUserId) {
          if (!currentMemberUserIds.has(resolvedUserId)) {
            await supabase.from("team_members").insert({
              team_id: teamId,
              user_id: resolvedUserId,
              duty: sm.default_duty || "Core Contributor",
              is_captain: false,
            });
            registeredToInsert.push({
              userId: resolvedUserId,
              name: sm.member_name,
              email: sm.member_email,
              duty: sm.default_duty || "Core Contributor",
            });
            currentMemberUserIds.add(resolvedUserId);
            slotsAvailable--;
          }
        } else {
          const alreadyReserved = newReservedMembers.some(
            (r) => r.email?.toLowerCase() === normalizedEmail
          );
          if (!alreadyReserved) {
            newReservedMembers.push({
              id: sm.id,
              name: sm.member_name || "Teammate",
              email: sm.member_email || "",
              duty: sm.default_duty || "Core Contributor",
            });
            slotsAvailable--;
          }
        }
      }
    }

    const updatedDescription = encodeReservedMembers(
      cleanDescription || savedSquad.description,
      newReservedMembers
    );

    await supabase
      .from("teams")
      .update({
        name: savedSquad.name,
        description: updatedDescription,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId);

    // Dispatch Telegram DMs to registered members if not opted out
    if (notifyTelegram && registeredToInsert.length > 0 && team.hackathon) {
      const { data: captainProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      await notifySquadDeployment({
        teamId: team.id,
        hackathonId: team.hackathon.id,
        hackathonTitle: team.hackathon.title,
        sourcePlatform: team.hackathon.source_platform,
        sourceUrl: team.hackathon.source_url,
        endsAt: team.hackathon.ends_at,
        captainName: captainProfile?.full_name || user.user_metadata?.full_name || "Captain",
        squadName: savedSquad.name,
        deployedMembers: registeredToInsert,
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to deploy saved squad." };
  }
}

/**
 * Update team max capacity (Captain only, bounded by hackathon rules).
 */
export async function updateTeamCapacity(teamId: string, maxMembers: number) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { data: team } = await supabase
      .from("teams")
      .select("captain_id, hackathon:hackathons(min_team_size, max_team_size)")
      .eq("id", teamId)
      .single();

    if (!team || team.captain_id !== user.id) {
      return { success: false, error: "Only the squad captain can adjust team capacity." };
    }

    // Verify current count doesn't exceed requested new cap
    const { count } = await supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId);

    if (count !== null && maxMembers < count) {
      return {
        success: false,
        error: `Cannot reduce squad capacity below current member count (${count} members).`,
      };
    }

    const { error } = await supabase
      .from("teams")
      .update({ max_members: maxMembers, updated_at: new Date().toISOString() })
      .eq("id", teamId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update team capacity." };
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

    // Direct lookup with description for reserved seat reconciliation
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("id, captain_id, max_members, description")
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
      .maybeSingle();

    if (existing) {
      return { success: true, message: "Already a member of this squad.", teamId: team.id };
    }

    const { cleanDescription, reservedMembers } = extractReservedMembers(team.description);

    // Check if user's email claims one of the reserved seats
    const userEmail = (user.email || "").trim().toLowerCase();
    const reservedIndex = reservedMembers.findIndex(
      (r) => r.email && r.email.trim().toLowerCase() === userEmail
    );

    let assignedDuty = duty?.trim() || "Full-Stack Developer";

    if (reservedIndex !== -1) {
      // Teammate is claiming their pre-assigned seat
      const claimedSeat = reservedMembers[reservedIndex];
      if (!duty || duty.trim() === "Full-Stack Developer") {
        assignedDuty = claimedSeat.duty || assignedDuty;
      }
      // Remove claimed seat from reserved list and update description
      reservedMembers.splice(reservedIndex, 1);
      const updatedDescription = encodeReservedMembers(cleanDescription, reservedMembers);

      await supabase
        .from("teams")
        .update({ description: updatedDescription, updated_at: new Date().toISOString() })
        .eq("id", team.id);
    } else {
      // General invite join: verify capacity including reserved seats
      const teamCap = team.max_members || 4;
      const { count } = await supabase
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", team.id);

      const currentTotal = (count || 0) + reservedMembers.length;
      if (currentTotal >= teamCap) {
        return {
          success: false,
          error: `This squad is currently full (${currentTotal}/${teamCap} seats filled or reserved).`,
        };
      }
    }

    // Execute join via SECURITY DEFINER RPC to bypass RLS safely and enforce invite verification
    const { data: rpcData, error: rpcErr } = await supabase.rpc("join_team_with_invite", {
      invite_code_input: inviteCode,
      member_duty: assignedDuty,
    });

    if (rpcErr) {
      // Fallback: If RPC is unavailable or fails, attempt direct insert
      const { error: insertErr } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        duty: assignedDuty,
        is_captain: false,
      });

      if (insertErr) {
        return { success: false, error: insertErr.message || rpcErr.message };
      }
    } else if (rpcData && typeof rpcData === "object") {
      const res = rpcData as { success?: boolean; error?: string; message?: string };
      if (res.success === false) {
        return { success: false, error: res.error || "Failed to join squad." };
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/squad");
    return { success: true, teamId: team.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to join squad." };
  }
}

