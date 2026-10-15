-- ==============================================================================
-- HACKLINE: COMPLETE MASTER DATABASE SCHEMA & PRODUCTION POLICIES
-- Architecture: PostgreSQL 15+ / Supabase Auth Integration
-- Idempotent: Safe to run on a brand new or partially migrated Supabase project.
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS & UTILITIES
-- ==============================================================================
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

-- ==============================================================================
-- 2. ENUMS
-- ==============================================================================
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
-- 3. CORE TABLES & SCHEMAS
-- ==============================================================================

-- 3.1 PROFILES (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  github_handle TEXT,
  primary_role TEXT,
  telegram_chat_id TEXT,
  telegram_connected_at TIMESTAMPTZ,
  notify_t24 BOOLEAN DEFAULT true,
  notify_t2 BOOLEAN DEFAULT true,
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
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    avatar_url = CASE WHEN profiles.avatar_url IS NULL OR profiles.avatar_url = '' THEN EXCLUDED.avatar_url ELSE profiles.avatar_url END;
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
  source_platform TEXT NOT NULL,
  source_url TEXT,
  banner_url TEXT,
  prize_pool TEXT,
  description TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  min_team_size INTEGER DEFAULT 1 NOT NULL,
  max_team_size INTEGER DEFAULT 4 NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
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
  max_members INTEGER DEFAULT 4 NOT NULL,
  telegram_chat_id TEXT,
  telegram_connected_at TIMESTAMPTZ,
  notify_t24 BOOLEAN DEFAULT true,
  notify_t2 BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(hackathon_id, slug)
);

-- Ensure dynamic team size columns exist on preexisting databases
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS min_team_size INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE public.hackathons ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 4 NOT NULL;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 4 NOT NULL;

-- 3.4 TEAM MEMBERS (Squad Roster & Duty Tagging)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  duty TEXT NOT NULL DEFAULT 'Full-Stack Developer',
  is_captain BOOLEAN DEFAULT FALSE NOT NULL,
  is_reserved BOOLEAN DEFAULT FALSE NOT NULL,
  placeholder_name TEXT,
  placeholder_email TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Allow nullable user_id on team_members for placeholders
DO $$ BEGIN
  ALTER TABLE public.team_members ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN null;
  WHEN others THEN null;
END $$;

ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS is_reserved BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS placeholder_name TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS placeholder_email TEXT;

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
  track TEXT,
  source_url TEXT,
  is_selected BOOLEAN DEFAULT FALSE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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

-- 3.9 SUBMISSION CHECKLIST (Pre-Flight Gates)
CREATE TABLE IF NOT EXISTS public.submission_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  item_key TEXT NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, item_key)
);

-- Ensure created_at exists on submission_checklists for deterministic ordering
ALTER TABLE public.submission_checklists ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- 3.10 NOTIFICATION WEBHOOKS (Telegram Notifications)
CREATE TABLE IF NOT EXISTS public.telegram_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  telegram_message_id TEXT,
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
CREATE INDEX IF NOT EXISTS idx_team_members_placeholder_email ON public.team_members (placeholder_email) WHERE placeholder_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_squads_owner ON public.saved_squads(owner_id);
CREATE INDEX IF NOT EXISTS idx_problem_statements_team ON public.problem_statements(team_id);
CREATE INDEX IF NOT EXISTS idx_problem_votes_problem ON public.problem_votes(problem_id);
CREATE INDEX IF NOT EXISTS idx_assets_team ON public.assets(team_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_team ON public.timeline_events(team_id);
CREATE INDEX IF NOT EXISTS idx_checklists_team ON public.submission_checklists(team_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifs_user_trigger ON public.telegram_notifications(user_id, trigger_type);

-- ==============================================================================
-- 5. STORAGE BUCKET (AVATARS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Public Access to Avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ==============================================================================
-- 6. SECURITY DEFINER RPCS (SQUAD INVITATIONS & CAPACITIES)
-- ==============================================================================

-- 6.1 Lookup Team Details by Invite Code (Strictly Omitting Private Teammate Emails/Phones)
CREATE OR REPLACE FUNCTION public.get_team_by_invite(invite_code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT json_build_object(
    'id', t.id,
    'name', t.name,
    'description', t.description,
    'invite_code', t.invite_code,
    'captain_id', t.captain_id,
    'max_members', t.max_members,
    'hackathon', (
      SELECT json_build_object(
        'id', h.id,
        'title', h.title,
        'source_platform', h.source_platform,
        'banner_url', h.banner_url,
        'prize_pool', h.prize_pool,
        'starts_at', h.starts_at,
        'ends_at', h.ends_at,
        'min_team_size', h.min_team_size,
        'max_team_size', h.max_team_size
      )
      FROM public.hackathons h
      WHERE h.id = t.hackathon_id
    ),
    'members', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', tm.id,
          'user_id', tm.user_id,
          'duty', tm.duty,
          'is_captain', tm.is_captain,
          'user', json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
          )
        )
      )
      FROM public.team_members tm
      JOIN public.profiles p ON p.id = tm.user_id
      WHERE tm.team_id = t.id
    ), '[]'::json)
  ) INTO result
  FROM public.teams t
  WHERE t.invite_code = invite_code_input;

  RETURN result;
END;
$$;

-- 6.2 Join Team via Invite Code (Dynamic Squad Capacity Enforcement)
CREATE OR REPLACE FUNCTION public.join_team_with_invite(
  invite_code_input TEXT,
  member_duty TEXT DEFAULT 'Full-Stack Developer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_team_id UUID;
  team_cap INT;
  current_count INT;
  existing_record UUID;
  caller_id UUID;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required. Please sign in or create an account.');
  END IF;

  -- Verify team exists and get dynamic max_members
  SELECT id, max_members INTO target_team_id, team_cap
  FROM public.teams
  WHERE invite_code = invite_code_input;

  IF target_team_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired squad invite link.');
  END IF;

  -- Check if user is already in this team
  SELECT id INTO existing_record
  FROM public.team_members
  WHERE team_id = target_team_id AND user_id = caller_id;

  IF existing_record IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'message', 'You are already a member of this squad.',
      'team_id', target_team_id
    );
  END IF;

  -- Check dynamic squad size cap
  SELECT count(*) INTO current_count
  FROM public.team_members
  WHERE team_id = target_team_id;

  IF current_count >= team_cap THEN
    RETURN json_build_object(
      'success', false,
      'error', 'This squad is already full (maximum ' || team_cap || ' members reached).'
    );
  END IF;

  -- Add caller to team
  INSERT INTO public.team_members (team_id, user_id, duty, is_captain)
  VALUES (
    target_team_id,
    caller_id,
    COALESCE(NULLIF(TRIM(member_duty), ''), 'Full-Stack Developer'),
    false
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Successfully joined the squad!',
    'team_id', target_team_id
  );
END;
$$;

-- 6.3 Regenerate Invite Code Function
CREATE OR REPLACE FUNCTION public.regenerate_team_invite(team_id_input UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  caller_id UUID;
  captain UUID;
BEGIN
  caller_id := auth.uid();
  SELECT captain_id INTO captain FROM public.teams WHERE id = team_id_input;

  IF captain IS NULL OR captain != caller_id THEN
    RAISE EXCEPTION 'Only the squad captain can regenerate invite codes.';
  END IF;

  new_code := encode(gen_random_bytes(6), 'hex');

  UPDATE public.teams
  SET invite_code = new_code, updated_at = NOW()
  WHERE id = team_id_input;

  RETURN new_code;
END;
$$;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
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
ALTER TABLE public.telegram_notifications ENABLE ROW LEVEL SECURITY;

-- 7.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 7.2 HACKATHONS POLICIES
DROP POLICY IF EXISTS "Users can only view hackathons they created or participate in" ON public.hackathons;
CREATE POLICY "Users can only view hackathons they created or participate in"
  ON public.hackathons FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.team_members tm ON tm.team_id = t.id
      WHERE t.hackathon_id = hackathons.id
      AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create/scrape hackathons" ON public.hackathons;
CREATE POLICY "Authenticated users can create/scrape hackathons"
  ON public.hackathons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Hackathon creators can update their entries" ON public.hackathons;
CREATE POLICY "Hackathon creators can update their entries"
  ON public.hackathons FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Hackathon creators can delete their entries" ON public.hackathons;
CREATE POLICY "Hackathon creators can delete their entries"
  ON public.hackathons FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- 7.3 TEAMS POLICIES
DROP POLICY IF EXISTS "Anyone authenticated can view teams" ON public.teams;
CREATE POLICY "Anyone authenticated can view teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert teams" ON public.teams;
CREATE POLICY "Authenticated users can insert teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (captain_id = auth.uid());

DROP POLICY IF EXISTS "Captains can update their teams" ON public.teams;
CREATE POLICY "Captains can update their teams"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (captain_id = auth.uid());

DROP POLICY IF EXISTS "Captains can delete their teams" ON public.teams;
CREATE POLICY "Captains can delete their teams"
  ON public.teams FOR DELETE
  TO authenticated
  USING (captain_id = auth.uid());

-- 7.4 TEAM MEMBERS POLICIES
DROP POLICY IF EXISTS "Anyone authenticated can view team members" ON public.team_members;
CREATE POLICY "Anyone authenticated can view team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Captains or self can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Captains can insert team members" ON public.team_members;
CREATE POLICY "Captains can insert team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_members.team_id
      AND captain_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Captains and members can update duties" ON public.team_members;
DROP POLICY IF EXISTS "Captains or self can update team members" ON public.team_members;
CREATE POLICY "Captains and members can update duties"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
      AND teams.captain_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = team_members.team_id
      AND teams.captain_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Captains or self can delete team members" ON public.team_members;
CREATE POLICY "Captains or self can delete team members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_members.team_id
      AND captain_id = auth.uid()
    )
  );

-- 7.5 SAVED SQUADS POLICIES
DROP POLICY IF EXISTS "Users manage their own saved squads" ON public.saved_squads;
CREATE POLICY "Users manage their own saved squads"
  ON public.saved_squads FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users manage their saved squad members" ON public.saved_squad_members;
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

-- 7.6 PROBLEM STATEMENTS (IDEA VAULT) POLICIES
DROP POLICY IF EXISTS "Team members can view problem statements" ON public.problem_statements;
CREATE POLICY "Team members can view problem statements"
  ON public.problem_statements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = problem_statements.team_id
      AND team_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = problem_statements.team_id
      AND teams.captain_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team members can propose problem statements" ON public.problem_statements;
CREATE POLICY "Team members can propose problem statements"
  ON public.problem_statements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = problem_statements.team_id
      AND team_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = problem_statements.team_id
      AND teams.captain_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team members can update problem statements" ON public.problem_statements;
DROP POLICY IF EXISTS "Statement authors or squad captains can update problem statements" ON public.problem_statements;
CREATE POLICY "Statement authors or squad captains can update problem statements"
  ON public.problem_statements FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = problem_statements.team_id
      AND teams.captain_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = problem_statements.team_id
      AND teams.captain_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team members or captains can delete problem statements" ON public.problem_statements;
DROP POLICY IF EXISTS "Statement authors or squad captains can delete problem statements" ON public.problem_statements;
CREATE POLICY "Statement authors or squad captains can delete problem statements"
  ON public.problem_statements FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = problem_statements.team_id
      AND teams.captain_id = auth.uid()
    )
  );

-- 7.7 PROBLEM VOTES POLICIES
DROP POLICY IF EXISTS "Team members can view problem votes" ON public.problem_votes;
CREATE POLICY "Team members can view problem votes"
  ON public.problem_votes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.problem_statements ps
      JOIN public.team_members tm ON tm.team_id = ps.team_id
      WHERE ps.id = problem_votes.problem_id
      AND tm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.problem_statements ps
      JOIN public.teams t ON t.id = ps.team_id
      WHERE ps.id = problem_votes.problem_id
      AND t.captain_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team members can cast or retract their vote" ON public.problem_votes;
CREATE POLICY "Team members can cast or retract their vote"
  ON public.problem_votes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7.8 ASSETS POLICIES
DROP POLICY IF EXISTS "Team members can view assets" ON public.assets;
CREATE POLICY "Team members can view assets"
  ON public.assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = assets.team_id
      AND team_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = assets.team_id
      AND teams.captain_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team members can upload/link assets" ON public.assets;
CREATE POLICY "Team members can upload/link assets"
  ON public.assets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = assets.team_id
      AND team_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = assets.team_id
      AND teams.captain_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Asset creators or captains can update assets" ON public.assets;
CREATE POLICY "Asset creators or captains can update assets"
  ON public.assets FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = assets.team_id
      AND teams.captain_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = assets.team_id
      AND teams.captain_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Asset creators or captains can delete assets" ON public.assets;
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

-- 7.9 TIMELINE EVENTS POLICIES
DROP POLICY IF EXISTS "Team members can view and manage timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users view team or hackathon timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Captains and creators manage timeline events" ON public.timeline_events;

CREATE POLICY "Users view team or hackathon timeline events"
  ON public.timeline_events FOR SELECT
  TO authenticated
  USING (
    (team_id IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = timeline_events.team_id
        AND tm.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = timeline_events.team_id
        AND t.captain_id = auth.uid()
      )
    ))
    OR
    (team_id IS NULL AND EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = timeline_events.hackathon_id
      AND (
        h.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.teams t
          JOIN public.team_members tm ON tm.team_id = t.id
          WHERE t.hackathon_id = h.id
          AND tm.user_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM public.teams t
          WHERE t.hackathon_id = h.id
          AND t.captain_id = auth.uid()
        )
      )
    ))
  );

CREATE POLICY "Captains and creators manage timeline events"
  ON public.timeline_events FOR ALL
  TO authenticated
  USING (
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = timeline_events.team_id
      AND t.captain_id = auth.uid()
    ))
    OR
    (team_id IS NULL AND EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = timeline_events.hackathon_id
      AND h.created_by = auth.uid()
    ))
  )
  WITH CHECK (
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = timeline_events.team_id
      AND t.captain_id = auth.uid()
    ))
    OR
    (team_id IS NULL AND EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = timeline_events.hackathon_id
      AND h.created_by = auth.uid()
    ))
  );

-- 7.10 SUBMISSION CHECKLISTS POLICIES
DROP POLICY IF EXISTS "Team members can view and toggle checklist items" ON public.submission_checklists;
DROP POLICY IF EXISTS "Team members and captains manage checklist items" ON public.submission_checklists;

CREATE POLICY "Team members and captains manage checklist items"
  ON public.submission_checklists FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = submission_checklists.team_id
      AND tm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = submission_checklists.team_id
      AND t.captain_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = submission_checklists.team_id
      AND tm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = submission_checklists.team_id
      AND t.captain_id = auth.uid()
    )
  );

-- 7.11 TELEGRAM NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.telegram_notifications;
DROP POLICY IF EXISTS "Users can view their own telegram notifications" ON public.telegram_notifications;
CREATE POLICY "Users can view their own telegram notifications"
  ON public.telegram_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service or authenticated users can insert telegram notifications" ON public.telegram_notifications;
DROP POLICY IF EXISTS "System and captains can insert notifications" ON public.telegram_notifications;
CREATE POLICY "System and captains can insert notifications"
  ON public.telegram_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);
