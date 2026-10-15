-- ==============================================================================
-- RBAC HARDENING: IDEA VAULT & ASSETS AUTHORIZATION POLICIES
-- ==============================================================================

-- 1. Tighten UPDATE policy on problem_statements
-- Previously allowed ANY squad member to update any statement or set is_selected = true.
-- Now strictly restricts UPDATE to the idea creator (created_by) or the squad captain.
DO $$ BEGIN
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
END $$;

-- 2. Ensure DELETE policy on problem_statements is restricted to creator or squad captain
DO $$ BEGIN
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
END $$;

-- 3. Ensure UPDATE & DELETE policies on assets are restricted to creator or squad captain
DO $$ BEGIN
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
END $$;

DO $$ BEGIN
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
END $$;
