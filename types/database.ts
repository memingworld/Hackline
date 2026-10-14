export type AssetCategory =
  | "github"
  | "figma"
  | "canva"
  | "demo"
  | "pitch_deck"
  | "drive"
  | "other";

export type TimelineEventType =
  | "registration_deadline"
  | "submission_deadline"
  | "pitch_session"
  | "results_announcement"
  | "custom";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  github_handle: string | null;
  primary_role: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hackathon {
  id: string;
  title: string;
  slug: string;
  source_platform: "unstop" | "devfolio" | "devpost" | "luma" | "hack2skill" | "custom";
  source_url: string | null;
  banner_url: string | null;
  prize_pool: string | null;
  description: string | null;
  starts_at: string;
  ends_at: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  user_team?: Team | null;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  duty: string; // e.g. "Next.js Frontend", "FastAPI Backend", "Pitch Deck"
  is_captain: boolean;
  joined_at: string;
  user?: Profile;
}

export interface Team {
  id: string;
  hackathon_id: string;
  captain_id: string;
  name: string;
  slug: string;
  description: string | null;
  invite_code: string;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
  hackathon?: Hackathon;
}

export interface TimelineEvent {
  id: string;
  hackathon_id: string;
  team_id: string | null;
  title: string;
  event_type: TimelineEventType;
  deadline: string;
  google_calendar_event_id: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface SubmissionChecklistItem {
  id: string;
  team_id: string;
  item_key: string;
  title: string;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
}

export interface ProblemStatement {
  id: string;
  team_id: string;
  hackathon_id: string;
  title: string;
  description: string | null;
  track: string | null;
  source_url: string | null;
  is_selected: boolean;
  vote_count?: number;
  has_voted?: boolean;
}

export interface Asset {
  id: string;
  team_id: string;
  hackathon_id: string;
  category: AssetCategory;
  title: string;
  url: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
}
