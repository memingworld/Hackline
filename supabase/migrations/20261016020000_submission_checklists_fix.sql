-- ==============================================================================
-- DATABASE MIGRATION: FIX SUBMISSION CHECKLISTS SCHEMA & RLS
-- Created: 2026-10-16
-- 1. Add created_at column to public.submission_checklists if not exists
-- 2. Expand RLS policy to permit both verified team members and squad captains
-- ==============================================================================

-- 1. Ensure created_at exists on submission_checklists for deterministic ordering
ALTER TABLE public.submission_checklists 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- 2. Expand RLS policy to grant access to both squad members and squad captains
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
