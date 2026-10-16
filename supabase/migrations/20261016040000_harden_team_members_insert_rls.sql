-- ==============================================================================
-- HARDEN TEAM_MEMBERS INSERT RLS POLICY (POST-RPC ROLLOUT)
-- Only team captains can directly insert members into team_members.
-- All other squad members must join via the join_team_with_invite SECURITY DEFINER RPC.
-- ==============================================================================

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
