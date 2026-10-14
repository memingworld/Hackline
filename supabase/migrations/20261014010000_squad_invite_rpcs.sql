-- ==============================================================================
-- SQUAD INVITATION, DUTY ASSIGNMENTS & SECURITY DEFINER RPCS
-- ==============================================================================

-- 1. Policy for updating team member duties
DO $$ BEGIN
  CREATE POLICY "Captains and members can update duties"
    ON public.team_members FOR UPDATE
    TO authenticated
    USING (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = team_members.team_id
        AND teams.captain_id = auth.uid()
      )
    )
    WITH CHECK (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.teams
        WHERE teams.id = team_members.team_id
        AND teams.captain_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Lookup Team Details by Invite Code (Security Definer)
-- Allows invited users to safely preview the hackathon, team, and member slots before joining
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
    'hackathon', (
      SELECT json_build_object(
        'id', h.id,
        'title', h.title,
        'source_platform', h.source_platform,
        'banner_url', h.banner_url,
        'prize_pool', h.prize_pool,
        'starts_at', h.starts_at,
        'ends_at', h.ends_at
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
            'avatar_url', p.avatar_url,
            'email', p.email
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

-- 3. Join Team via Invite Code (Security Definer)
-- Enforces authentication, 4-member maximum squad limit, and duplicate prevention
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
  current_count INT;
  existing_record UUID;
  caller_id UUID;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Authentication required. Please sign in or create an account.');
  END IF;

  -- Verify team exists with this invite code
  SELECT id INTO target_team_id
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

  -- Enforce 4-person squad limit
  SELECT count(*) INTO current_count
  FROM public.team_members
  WHERE team_id = target_team_id;

  IF current_count >= 4 THEN
    RETURN json_build_object('success', false, 'error', 'This squad is already full (maximum 4 members reached).');
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

-- 4. Regenerate Invite Code Function
CREATE OR REPLACE FUNCTION public.regenerate_team_invite(team_id_input UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  caller_id UUID;
  captain UUID;
BEGIN
  caller_id := auth.uid();
  SELECT captain_id INTO captain FROM public.teams WHERE id = team_id_input;

  IF captain IS NULL OR captain != caller_id THEN
    RAISE EXCEPTION 'Only the squad captain can regenerate invite codes.';
  END IF;

  new_code := encode(gen_random_bytes(6), 'hex');

  UPDATE public.teams
  SET invite_code = new_code, updated_at = NOW()
  WHERE id = team_id_input;

  RETURN new_code;
END;
$$;
