"use server";

import { getSubmissionKitInitialData } from "@/lib/data/submission-kit";
import { SubmissionKitFormData } from "@/lib/exporter/templates";

/**
 * Server action to fetch initial submission kit data for a team.
 */
export async function fetchSubmissionKitData(
  teamId: string,
  hackathonId?: string
): Promise<{ success: boolean; data: SubmissionKitFormData; error?: string }> {
  try {
    const data = await getSubmissionKitInitialData(teamId, hackathonId);
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      data: {
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
      },
      error: err.message || "Failed to load submission kit data",
    };
  }
}
