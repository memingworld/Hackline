export type SupportedPlatform =
  | "devpost"
  | "devfolio"
  | "devnovate"
  | "unstop"
  | "luma"
  | "hack2skill"
  | "custom";

export interface TimelineGateItem {
  title: string;
  deadline: string;
  event_type: string;
}

export interface ScrapedHackathonResult {
  title: string;
  slug: string;
  source_platform: SupportedPlatform;
  source_url: string;
  banner_url: string | null;
  prize_pool: string;
  description: string;
  starts_at: string;
  ends_at: string;
  min_team_size?: number;
  max_team_size?: number;
  timeline_gates: TimelineGateItem[];
  extraction_method: string;
}

export interface PlatformScraper {
  readonly name: string;
  readonly platform: SupportedPlatform;
  matches(url: string, cleanUrl: string): boolean;
  scrape(cleanUrl: string): Promise<ScrapedHackathonResult | null>;
}
