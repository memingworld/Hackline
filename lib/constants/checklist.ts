export interface DefaultGateItem {
  item_key: string;
  title: string;
}

/**
 * Standardized 5-checkpoint pre-flight verification gates for all squads.
 * Used during hackathon sprint creation and on-demand checklist seeding.
 */
export const DEFAULT_GATES: DefaultGateItem[] = [
  { item_key: "repo_public", title: "Repository is Public with Open-Source License" },
  { item_key: "demo_video_ready", title: "Demo Walkthrough Video Recorded & Accessible (< 3 mins)" },
  { item_key: "deck_finalized", title: "Pitch Presentation Slides Finalized & Hosted" },
  { item_key: "teammates_verified", title: "All Squad Teammates Registered on Portal" },
  { item_key: "readme_architecture", title: "README Documentation & Architecture Diagram Included" },
];
