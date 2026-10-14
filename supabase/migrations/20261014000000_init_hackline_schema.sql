-- ==============================================================================
-- HACKLINE DATABASE SCHEMA & PRODUCTION ROW-LEVEL SECURITY (RLS) POLICIES
-- Architecture: PostgreSQL 15+ / Supabase Auth Integration
-- ==============================================================================

-- 1. EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper trigger function to update updated_at timestamps automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE public.asset_category AS ENUM ('github', 'figma', 'canva', 'demo', 'pitch_deck', 'drive', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.timeline_event_type AS ENUM ('registration_deadline', 'submission_deadline', 'pitch_session', 'results_announcement', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. CORE TABLES
-- ==============================================================================

-- 3.1 PROFILES (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  github_handle TEXT,
  primary_role TEXT, -- e.g. "Frontend Engineer", "Backend / AI", "Product & Pitch"
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Automatic Profile Creation Trigger on Supabase Auth SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.2 HACKATHONS (Global & Scraped Event Catalog)
CREATE TABLE IF NOT EXISTS public.hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  source_platform TEXT NOT NULL, -- 'unstop', 'devfolio', 'devpost', 'luma', 'hack2skill', 'custom'
  source_url TEXT,
  banner_url TEXT,
  prize_pool TEXT,
  description TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3.3 TEAMS (Squads participating in a specific hackathon)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
  captain_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(hackathon_id, slug)
);

-- 3.4 TEAM MEMBERS (Squad Roster & Duty Tagging)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  duty TEXT NOT NULL DEFAULT 'Full-Stack Developer', -- e.g. "Next.js Frontend", "FastAPI Backend", "Pitch Deck"
  is_captain BOOLEAN DEFAULT FALSE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- 3.5 SAVED SQUADS (Recurring 4-Person Crews for 1-Click Event Deployment)
CREATE TABLE IF NOT EXISTS public.saved_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.saved_squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID REFERENCES public.saved_squads(id) ON DELETE CASCADE NOT NULL,
  member_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  member_email TEXT NOT NULL,
  default_duty TEXT NOT NULL DEFAULT 'Contributor',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3.6 IDEA VAULT & PROBLEM STATEMENTS
CREATE TABLE IF NOT EXISTS public.problem_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  track TEXT, -- e.g. "FinTech", "HealthTech", "AI Agents", "Open Innovation"
  source_url TEXT,
  is_selected BOOLEAN DEFAULT FALSE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Problem Statement Upvoting
CREATE TABLE IF NOT EXISTS public.problem_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES public.problem_statements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(problem_id, user_id)
);

-- 3.7 ASSET HUB (Project Links & Repos)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
  category public.asset_category NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3.8 TIMELINE EVENTS (Milestone Gates & Google Calendar Sync)
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type public.timeline_event_type DEFAULT 'custom' NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  google_calendar_event_id TEXT,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3.9 SUBMISSION CHECKLIST
CREATE TABLE IF NOT EXISTS public.submission_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  item_key TEXT NOT NULL, -- e.g. "repo_public", "demo_video_ready", "deck_finalized", "teammates_verified"
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  UNIQUE(team_id, item_key)
);

-- 3.10 NOTIFICATION WEBHOOKS (WhatsApp T-24h & T-2h Triggers)
CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE NOT NULL,
  recipient_phone TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'T-24h', 'T-2h', 'custom'
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status public.notification_status DEFAULT 'pending' NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_hackathons_slug ON public.hackathons(slug);
CREATE INDEX IF NOT EXISTS idx_teams_hackathon ON public.teams(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_saved_squads_owner ON public.saved_squads(owner_id);
CREATE INDEX IF NOT EXISTS idx_problem_statements_team ON public.problem_statements(team_id);
CREATE INDEX IF NOT EXISTS idx_problem_votes_problem ON public.problem_votes(problem_id);
CREATE INDEX IF NOT EXISTS idx_assets_team ON public.assets(team_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_team ON public.timeline_events(team_id);
CREATE INDEX IF NOT EXISTS idx_checklists_team ON public.submission_checklists(team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.whatsapp_notifications(status, scheduled_for);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- 5.1 PROFILES POLICIES
CREATE POLICY "Public profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5.2 HACKATHONS POLICIES
CREATE POLICY "Hackathons are readable by authenticated users"
  ON public.hackathons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create/scrape hackathons"
  ON public.hackathons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Hackathon creators can update their entries"
  ON public.hackathons FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- 5.3 TEAMS POLICIES
CREATE POLICY "Users can read teams they belong to or are public"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    captain_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "Captains can update their team"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = captain_id);

-- 5.4 TEAM MEMBERS POLICIES
CREATE POLICY "Team members can view squad members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
      AND (
        teams.captain_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members tm2
          WHERE tm2.team_id = teams.id
          AND tm2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Captains can manage squad roster"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
      AND teams.captain_id = auth.uid()
    ) OR user_id = auth.uid() -- Allows user joining via invite code
  );

CREATE POLICY "Captains can remove members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
      AND teams.captain_id = auth.uid()
    )
  );

-- 5.5 SAVED SQUADS POLICIES
CREATE POLICY "Users manage their own saved squads"
  ON public.saved_squads FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users manage their saved squad members"
  ON public.saved_squad_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_squads
      WHERE saved_squads.id = saved_squad_members.squad_id
      AND saved_squads.owner_id = auth.uid()
    )
  );

-- 5.6 PROBLEM STATEMENTS (IDEA VAULT) POLICIES
CREATE POLICY "Team members can view problem statements"
  ON public.problem_statements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = problem_statements.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can propose problem statements"
  ON public.problem_statements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = problem_statements.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update problem statements"
  ON public.problem_statements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = problem_statements.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- 5.7 PROBLEM VOTES POLICIES
CREATE POLICY "Team members can view problem votes"
  ON public.problem_votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.problem_statements ps
      JOIN public.team_members tm ON tm.team_id = ps.team_id
      WHERE ps.id = problem_votes.problem_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can cast or retract their vote"
  ON public.problem_votes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5.8 ASSETS POLICIES
CREATE POLICY "Team members can view assets"
  ON public.assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = assets.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can upload/link assets"
  ON public.assets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = assets.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Asset creators or captains can delete assets"
  ON public.assets FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = assets.team_id
      AND teams.captain_id = auth.uid()
    )
  );

-- 5.9 TIMELINE EVENTS POLICIES
CREATE POLICY "Team members can view and manage timeline events"
  ON public.timeline_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = timeline_events.team_id
      AND team_members.user_id = auth.uid()
    ) OR team_id IS NULL
  );

-- 5.10 SUBMISSION CHECKLISTS POLICIES
CREATE POLICY "Team members can view and toggle checklist items"
  ON public.submission_checklists FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = submission_checklists.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- 5.11 NOTIFICATIONS POLICIES
CREATE POLICY "Captains and team members can monitor their notifications"
  ON public.whatsapp_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = whatsapp_notifications.team_id
      AND team_members.user_id = auth.uid()
    )
  );
