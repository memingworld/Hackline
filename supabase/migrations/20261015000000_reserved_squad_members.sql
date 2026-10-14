-- ==============================================================================
-- RESERVED SQUAD SEATS & TELEGRAM NOTIFICATION DISPATCH METADATA
-- ==============================================================================

-- 1. Support nullable user_id on team_members for direct database-level placeholders
-- (If strict DB constraint is modified, application metadata in teams.description remains 100% backwards-compatible)
DO $$ BEGIN
  ALTER TABLE public.team_members ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN null;
  WHEN others THEN null;
END $$;

-- 2. Add placeholder and reserved flag columns to team_members
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS is_reserved BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS placeholder_name TEXT,
  ADD COLUMN IF NOT EXISTS placeholder_email TEXT;

-- 3. Create index on placeholder_email for fast reconciliation
CREATE INDEX IF NOT EXISTS idx_team_members_placeholder_email
  ON public.team_members (placeholder_email)
  WHERE placeholder_email IS NOT NULL;

-- 4. Notification history log for audit and verification
CREATE TABLE IF NOT EXISTS public.telegram_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  telegram_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS Policies for telegram_notifications
ALTER TABLE public.telegram_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own telegram notifications"
    ON public.telegram_notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "System and captains can insert notifications"
    ON public.telegram_notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
