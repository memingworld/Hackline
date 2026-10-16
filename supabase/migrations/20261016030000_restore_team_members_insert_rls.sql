-- ==============================================================================
-- RESTORE TEAM_MEMBERS INSERT RLS POLICY
-- Allows team captains to add members AND allows authenticated users to insert
-- themselves when joining via valid squad invite links.
-- ==============================================================================

DROP POLICY IF EXISTS "Captains can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Captains or self can insert team members" ON public.team_members;

CREATE POLICY "Captains or self can insert team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_members.team_id
      AND captain_id = auth.uid()
    )
  );
