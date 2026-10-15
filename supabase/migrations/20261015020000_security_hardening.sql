-- ==============================================================================
-- DATABASE SECURITY HARDENING: RLS POLICY REFINEMENTS & PRIVILEGE BOUNDARIES
-- Created: 2026-10-15
-- ==============================================================================

-- 1. Fix team_members INSERT policy:
-- Prevent users from inserting themselves into unauthorized teams without invite codes.
-- Only team captains can directly insert members; other users must use the join_team_with_invite RPC.
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

-- 2. Fix timeline_events privilege boundary:
-- Replace overly permissive "OR team_id IS NULL" policy with strictly scoped SELECT and MUTATION policies.
DROP POLICY IF EXISTS "Team members can view and manage timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Users view team or hackathon timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Captains and creators manage timeline events" ON public.timeline_events;

-- SELECT: Allow viewing timeline events if the user is a team member OR belongs to the hackathon
CREATE POLICY "Users view team or hackathon timeline events"
  ON public.timeline_events FOR SELECT
  TO authenticated
  USING (
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = timeline_events.team_id
      AND tm.user_id = auth.uid()
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
        )
      )
    ))
  );

-- MUTATIONS (INSERT / UPDATE / DELETE): Only captains (for team events) or hackathon creators (for global gates) can modify
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

-- 3. Ensure submission_checklists modifications are strictly bounded to verified team members
DROP POLICY IF EXISTS "Team members can view and toggle checklist items" ON public.submission_checklists;

CREATE POLICY "Team members can view and toggle checklist items"
  ON public.submission_checklists FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = submission_checklists.team_id
      AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = submission_checklists.team_id
      AND tm.user_id = auth.uid()
    )
  );
