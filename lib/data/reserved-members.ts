import { TeamMember } from "@/types/database";

export interface ReservedMember {
  id?: string;
  name: string;
  email: string;
  duty: string;
}

/**
 * Extract reserved/placeholder members stored as structured metadata in team descriptions.
 */
export function extractReservedMembers(rawDescription?: string | null): {
  cleanDescription: string;
  reservedMembers: ReservedMember[];
} {
  if (!rawDescription) {
    return { cleanDescription: "", reservedMembers: [] };
  }

  const regex = /<!--\s*HACKLINE_RESERVED:\s*([\s\S]*?)\s*-->/;
  const match = rawDescription.match(regex);

  if (!match) {
    return { cleanDescription: rawDescription.trim(), reservedMembers: [] };
  }

  try {
    const parsed = JSON.parse(match[1]);
    const cleanDescription = rawDescription.replace(regex, "").trim();
    if (Array.isArray(parsed)) {
      return { cleanDescription, reservedMembers: parsed };
    }
  } catch (e) {
    console.error("Failed to parse reserved members metadata:", e);
  }

  return { cleanDescription: rawDescription.trim(), reservedMembers: [] };
}

/**
 * Encode reserved squad members into team description as invisible metadata comment.
 */
export function encodeReservedMembers(
  description: string | null | undefined,
  reservedMembers: ReservedMember[]
): string {
  const { cleanDescription } = extractReservedMembers(description);
  if (!reservedMembers || reservedMembers.length === 0) {
    return cleanDescription;
  }

  const payload = JSON.stringify(reservedMembers);
  if (!cleanDescription) {
    return `<!-- HACKLINE_RESERVED: ${payload} -->`;
  }

  return `${cleanDescription}\n\n<!-- HACKLINE_RESERVED: ${payload} -->`;
}

/**
 * Convert a reserved member into a synthetic TeamMember for consistent UI rendering.
 */
export function toReservedTeamMember(
  teamId: string,
  reserved: ReservedMember,
  index: number
): TeamMember {
  const memberId =
    reserved.id || `reserved-${index}-${encodeURIComponent(reserved.email || String(index))}`;
  return {
    id: memberId,
    team_id: teamId,
    user_id: null,
    duty: reserved.duty || "Core Contributor",
    is_captain: false,
    joined_at: new Date().toISOString(),
    is_reserved: true,
    placeholder_name: reserved.name,
    placeholder_email: reserved.email,
    user: {
      id: `reserved-profile-${index}`,
      full_name: reserved.name,
      email: reserved.email,
      avatar_url: null,
      phone_number: null,
      github_handle: null,
      primary_role: reserved.duty || "Core Contributor",
      telegram_chat_id: null,
      telegram_connected_at: null,
      notify_t24: false,
      notify_t2: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}
