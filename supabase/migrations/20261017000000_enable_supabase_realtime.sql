-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION FOR SQUAD COLLABORATION TABLES
-- Enables WebSocket broadcasts on INSERT, UPDATE, and DELETE events so teammates
-- receive instant updates without page refreshes.
-- ==============================================================================

-- 1. Add collaborative squad tables to supabase_realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.submission_checklists, 
    public.problem_statements, 
    public.problem_votes, 
    public.assets, 
    public.team_members, 
    public.hackathons, 
    public.teams;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN others THEN null;
END $$;

-- 2. Configure REPLICA IDENTITY FULL so WAL streams include complete row records for filtered subscriptions
ALTER TABLE public.submission_checklists REPLICA IDENTITY FULL;
ALTER TABLE public.problem_statements REPLICA IDENTITY FULL;
ALTER TABLE public.problem_votes REPLICA IDENTITY FULL;
ALTER TABLE public.assets REPLICA IDENTITY FULL;
ALTER TABLE public.team_members REPLICA IDENTITY FULL;
ALTER TABLE public.teams REPLICA IDENTITY FULL;
ALTER TABLE public.hackathons REPLICA IDENTITY FULL;
