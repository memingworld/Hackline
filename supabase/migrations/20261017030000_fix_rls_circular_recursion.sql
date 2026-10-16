-- ==============================================================================
-- MIGRATION: Fix Circular Recursion in RLS Between Hackathons and Teams
-- Root cause: Teams policy queried hackathons while hackathons queried teams,
-- causing infinite recursion in PostgreSQL evaluation.
-- Solution: SECURITY DEFINER helper functions execute with admin privileges,
-- safely bypassing RLS evaluation inside policy subqueries.
-- ==============================================================================

-- 1. Helper function to check hackathon creator (bypasses RLS to eliminate recursion)
CREATE OR REPLACE FUNCTION public.is_hackathon_organizer(target_hackathon_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT CASE
    WHEN target_hackathon_id IS NULL OR target_user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.hackathons
      WHERE id = target_hackathon_id
      AND created_by = target_user_id
    )
  END;
$$;

-- 2. Helper function to check squad membership (bypasses RLS to eliminate recursion)
CREATE OR REPLACE FUNCTION public.is_hackathon_squad_member(target_hackathon_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT CASE
    WHEN target_hackathon_id IS NULL OR target_user_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.teams t
      LEFT JOIN public.team_members tm ON tm.team_id = t.id
      WHERE t.hackathon_id = target_hackathon_id
      AND (t.captain_id = target_user_id OR tm.user_id = target_user_id)
    )
  END;
$$;

-- 3. Update public.hackathons SELECT policy
DROP POLICY IF EXISTS "Users can only view hackathons they created or participate in" ON public.hackathons;
CREATE POLICY "Users can only view hackathons they created or participate in"
  ON public.hackathons FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    public.is_hackathon_squad_member(id, auth.uid())
  );

-- 4. Update public.teams SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view their squads or hackathon squads" ON public.teams;
CREATE POLICY "Users can view their squads or hackathon squads"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    captain_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = teams.id
      AND tm.user_id = auth.uid()
    ) OR
    public.is_hackathon_organizer(hackathon_id, auth.uid())
  );

-- 5. Update public.timeline_events policies
DROP POLICY IF EXISTS "Captains and creators manage timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Squad members and leaders manage timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Captains and creators delete timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Captains and creators insert timeline events" ON public.timeline_events;

CREATE POLICY "Squad members and leaders manage timeline events"
  ON public.timeline_events FOR UPDATE
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
    (team_id IS NULL AND public.is_hackathon_organizer(hackathon_id, auth.uid()))
  );

CREATE POLICY "Captains and creators delete timeline events"
  ON public.timeline_events FOR DELETE
  TO authenticated
  USING (
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = timeline_events.team_id
      AND t.captain_id = auth.uid()
    ))
    OR
    (team_id IS NULL AND public.is_hackathon_organizer(hackathon_id, auth.uid()))
  );

CREATE POLICY "Captains and creators insert timeline events"
  ON public.timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = timeline_events.team_id
      AND t.captain_id = auth.uid()
    ))
    OR
    (team_id IS NULL AND public.is_hackathon_organizer(hackathon_id, auth.uid()))
  );
