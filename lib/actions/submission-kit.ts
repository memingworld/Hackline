"use server";

import { createClient } from "@/utils/supabase/server";
import { getSubmissionKitInitialData } from "@/lib/data/submission-kit";
import { SubmissionKitFormData } from "@/lib/exporter/templates";

const EMPTY_SUBMISSION_DATA: SubmissionKitFormData = {
  title: "",
  tagline: "",
  track: "",
  problemDescription: "",
  solutionDescription: "",
  repoUrl: "",
  demoVideoUrl: "",
  deckUrl: "",
  liveAppUrl: "",
  techStack: [],
  challenges: "",
  nextSteps: "",
  members: [],
  customFields: [],
};

/**
 * Server action to fetch initial submission kit data for a team.
 * Enforces squad membership authorization to protect confidential pitch ideas and links.
 */
export async function fetchSubmissionKitData(
  teamId: string,
  hackathonId?: string
): Promise<{ success: boolean; data: SubmissionKitFormData; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        data: EMPTY_SUBMISSION_DATA,
        error: "Unauthorized: Please sign in.",
      };
    }

    // Verify squad membership or captain status
    const { data: team } = await supabase
      .from("teams")
      .select("captain_id")
      .eq("id", teamId)
      .maybeSingle();

    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership && team?.captain_id !== user.id) {
      return {
        success: false,
        data: EMPTY_SUBMISSION_DATA,
        error: "Forbidden: You are not a member of this squad.",
      };
    }

    const data = await getSubmissionKitInitialData(teamId, hackathonId);
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      data: EMPTY_SUBMISSION_DATA,
      error: err.message || "Failed to load submission kit data",
    };
  }
}
