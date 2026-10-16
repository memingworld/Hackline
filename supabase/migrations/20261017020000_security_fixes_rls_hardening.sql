-- ==============================================================================
-- MIGRATION: Security Hardening & RLS Access Control Tightening
-- Focus: Teams isolation, Telegram notification integrity, and timeline controls
-- ==============================================================================

-- 1. HARDEN TEAMS SELECT RLS POLICY
-- Block arbitrary authenticated users from scraping squad invite codes, private chat IDs,
-- and reserved member emails encoded in squad descriptions.
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
    EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = teams.hackathon_id
      AND h.created_by = auth.uid()
    )
  );

-- 2. HARDEN TELEGRAM NOTIFICATIONS INSERT RLS POLICY
-- Prevent users from spoofing notification logs for other user accounts.
DROP POLICY IF EXISTS "Service or authenticated users can insert telegram notifications" ON public.telegram_notifications;
DROP POLICY IF EXISTS "System and captains can insert notifications" ON public.telegram_notifications;
DROP POLICY IF EXISTS "Users can only insert their own notifications" ON public.telegram_notifications;

CREATE POLICY "Users can only insert their own notifications"
  ON public.telegram_notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. PERMIT SQUAD MEMBERS TO UPDATE TIMELINE MILESTONE GATES
DROP POLICY IF EXISTS "Captains and creators manage timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Squad members and leaders manage timeline events" ON public.timeline_events;
DROP POLICY IF EXISTS "Captains and creators delete timeline events" ON public.timeline_events;

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
    (team_id IS NULL AND EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = timeline_events.hackathon_id
      AND h.created_by = auth.uid()
    ))
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
    (team_id IS NULL AND EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = timeline_events.hackathon_id
      AND h.created_by = auth.uid()
    ))
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
    (team_id IS NULL AND EXISTS (
      SELECT 1 FROM public.hackathons h
      WHERE h.id = timeline_events.hackathon_id
      AND h.created_by = auth.uid()
    ))
  );
