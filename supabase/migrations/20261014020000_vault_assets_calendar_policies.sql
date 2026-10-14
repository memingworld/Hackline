-- ==============================================================================
-- IDEA VAULT & ASSETS POLICIES REFINEMENTS
-- ==============================================================================

-- 1. DELETE policy on problem_statements
DO $$ BEGIN
  CREATE POLICY "Team members or captains can delete problem statements"
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
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. UPDATE policy on assets
DO $$ BEGIN
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
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
