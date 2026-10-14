-- ==============================================================================
-- DYNAMIC SQUAD SIZES, ANTI-LEAKAGE ENHANCEMENTS & CAPACITY MANAGEMENT
-- ==============================================================================

-- 1. Add team size bounds to hackathons table
ALTER TABLE public.hackathons 
  ADD COLUMN IF NOT EXISTS min_team_size INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 4 NOT NULL;

-- 2. Add max_members to teams table
ALTER TABLE public.teams 
  ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 4 NOT NULL;

-- 3. Update get_team_by_invite with zero-data-leakage
-- Teammate private contact info (email, phone) is strictly omitted
CREATE OR REPLACE FUNCTION public.get_team_by_invite(invite_code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT json_build_object(
    'id', t.id,
    'name', t.name,
    'description', t.description,
    'invite_code', t.invite_code,
    'captain_id', t.captain_id,
    'max_members', t.max_members,
    'hackathon', (
      SELECT json_build_object(
        'id', h.id,
        'title', h.title,
        'source_platform', h.source_platform,
        'banner_url', h.banner_url,
        'prize_pool', h.prize_pool,
        'starts_at', h.starts_at,
        'ends_at', h.ends_at,
        'min_team_size', h.min_team_size,
        'max_team_size', h.max_team_size
      )
      FROM public.hackathons h
      WHERE h.id = t.hackathon_id
    ),
    'members', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', tm.id,
          'user_id', tm.user_id,
          'duty', tm.duty,
          'is_captain', tm.is_captain,
          'user', json_build_object(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
            -- Email and phone explicitly excluded to prevent data leaks
          )
        )
      )
      FROM public.team_members tm
      JOIN public.profiles p ON p.id = tm.user_id
      WHERE tm.team_id = t.id
    ), '[]'::json)
  ) INTO result
  FROM public.teams t
  WHERE t.invite_code = invite_code_input;

  RETURN result;
END;
$$;

-- 4. Update join_team_with_invite with dynamic capacity check
CREATE OR REPLACE FUNCTION public.join_team_with_invite(
  invite_code_input TEXT,
  member_duty TEXT DEFAULT 'Full-Stack Developer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_team_id UUID;
  team_cap INT;
  current_count INT;
  existing_record UUID;
  caller_id UUID;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required. Please sign in or create an account.');
  END IF;

  -- Verify team exists and get dynamic max_members
  SELECT id, max_members INTO target_team_id, team_cap
  FROM public.teams
  WHERE invite_code = invite_code_input;

  IF target_team_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired squad invite link.');
  END IF;

  -- Check if user is already in this team
  SELECT id INTO existing_record
  FROM public.team_members
  WHERE team_id = target_team_id AND user_id = caller_id;

  IF existing_record IS NOT NULL THEN
    RETURN json_build_object(
      'success', true,
      'message', 'You are already a member of this squad.',
      'team_id', target_team_id
    );
  END IF;

  -- Check dynamic squad size cap
  SELECT count(*) INTO current_count
  FROM public.team_members
  WHERE team_id = target_team_id;

  IF current_count >= team_cap THEN
    RETURN json_build_object(
      'success', false,
      'error', 'This squad is already full (maximum ' || team_cap || ' members reached).'
    );
  END IF;

  -- Add caller to team
  INSERT INTO public.team_members (team_id, user_id, duty, is_captain)
  VALUES (
    target_team_id,
    caller_id,
    COALESCE(NULLIF(TRIM(member_duty), ''), 'Full-Stack Developer'),
    false
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Successfully joined the squad!',
    'team_id', target_team_id
  );
END;
$$;
