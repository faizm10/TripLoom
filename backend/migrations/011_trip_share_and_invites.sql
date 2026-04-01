-- View-only share links and collaborator invite tokens (hashed). Public access uses service role in Next.js.
-- Invite acceptance uses SECURITY DEFINER RPC so invitees insert only their own trip_members row after token validation.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS trip_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  label TEXT,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  CONSTRAINT trip_share_links_token_hash_unique UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_trip_share_links_trip_id ON trip_share_links (trip_id);

CREATE TABLE IF NOT EXISTS trip_collaborator_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  max_uses INT,
  uses_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  CONSTRAINT trip_collaborator_invites_token_hash_unique UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_trip_collaborator_invites_trip_id ON trip_collaborator_invites (trip_id);

ALTER TABLE trip_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_collaborator_invites ENABLE ROW LEVEL SECURITY;

-- Idempotent: safe to re-run after a partial apply
DROP POLICY IF EXISTS "Trip owners can read trip_share_links" ON trip_share_links;
DROP POLICY IF EXISTS "Trip owners can insert trip_share_links" ON trip_share_links;
DROP POLICY IF EXISTS "Trip owners can update trip_share_links" ON trip_share_links;
DROP POLICY IF EXISTS "Trip owners can delete trip_share_links" ON trip_share_links;
DROP POLICY IF EXISTS "Trip owners can read trip_collaborator_invites" ON trip_collaborator_invites;
DROP POLICY IF EXISTS "Trip owners can insert trip_collaborator_invites" ON trip_collaborator_invites;
DROP POLICY IF EXISTS "Trip owners can update trip_collaborator_invites" ON trip_collaborator_invites;
DROP POLICY IF EXISTS "Trip owners can delete trip_collaborator_invites" ON trip_collaborator_invites;

-- Owners only: manage share links
CREATE POLICY "Trip owners can read trip_share_links"
  ON trip_share_links FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_share_links.trip_id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role = 'owner'
    )
  );

CREATE POLICY "Trip owners can insert trip_share_links"
  ON trip_share_links FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_share_links.trip_id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role = 'owner'
    )
  );

CREATE POLICY "Trip owners can update trip_share_links"
  ON trip_share_links FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_share_links.trip_id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_share_links.trip_id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role = 'owner'
    )
  );

CREATE POLICY "Trip owners can delete trip_share_links"
  ON trip_share_links FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_share_links.trip_id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role = 'owner'
    )
  );

CREATE POLICY "Trip owners can read trip_collaborator_invites"
  ON trip_collaborator_invites FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_collaborator_invites.trip_id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role = 'owner'
    )
  );

CREATE POLICY "Trip owners can insert trip_collaborator_invites"
  ON trip_collaborator_invites FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_collaborator_invites.trip_id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role = 'owner'
    )
  );

CREATE POLICY "Trip owners can update trip_collaborator_invites"
  ON trip_collaborator_invites FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_collaborator_invites.trip_id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_collaborator_invites.trip_id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role = 'owner'
    )
  );

CREATE POLICY "Trip owners can delete trip_collaborator_invites"
  ON trip_collaborator_invites FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_collaborator_invites.trip_id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role = 'owner'
    )
  );

-- Accept invite: validate token, insert self as member (idempotent), bump uses_count only on new insert
CREATE OR REPLACE FUNCTION accept_collaborator_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_invite trip_collaborator_invites%ROWTYPE;
  v_uid text;
  v_already boolean;
BEGIN
  v_uid := auth.uid()::text;
  IF v_uid IS NULL OR v_uid = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  v_hash := encode(digest(convert_to(trim(both from p_token), 'UTF8'), 'sha256'), 'hex');

  SELECT * INTO v_invite
  FROM trip_collaborator_invites
  WHERE token_hash = v_hash
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_or_expired');
  END IF;

  IF v_invite.max_uses IS NOT NULL AND v_invite.uses_count >= v_invite.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'max_uses');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = v_invite.trip_id AND user_id = v_uid
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('ok', true, 'trip_id', v_invite.trip_id, 'already_member', true);
  END IF;

  BEGIN
    INSERT INTO trip_members (trip_id, user_id, role)
    VALUES (v_invite.trip_id, v_uid, v_invite.role);
    UPDATE trip_collaborator_invites
    SET uses_count = uses_count + 1
    WHERE id = v_invite.id;
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object('ok', true, 'trip_id', v_invite.trip_id, 'already_member', true);
  END;

  RETURN jsonb_build_object('ok', true, 'trip_id', v_invite.trip_id, 'already_member', false);
END;
$$;

REVOKE ALL ON FUNCTION accept_collaborator_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accept_collaborator_invite(text) TO authenticated;

-- Only owners and editors may update trip rows; viewers read-only
DROP POLICY IF EXISTS "Members can update trips" ON trips;
DROP POLICY IF EXISTS "Owners and editors can update trips" ON trips;
CREATE POLICY "Owners and editors can update trips"
  ON trips FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
        AND trip_members.user_id = auth.uid()::text
        AND trip_members.role IN ('owner', 'editor')
    )
  );

-- List collaborators: any member can read all membership rows for trips they belong to.
-- SECURITY DEFINER helper avoids RLS recursion on trip_members self-joins.
CREATE OR REPLACE FUNCTION auth_user_trip_ids()
RETURNS SETOF text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT trip_id FROM trip_members WHERE user_id = auth.uid()::text;
$$;

REVOKE ALL ON FUNCTION auth_user_trip_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_user_trip_ids() TO authenticated;

DROP POLICY IF EXISTS "Members can read co-members on same trip" ON trip_members;

CREATE POLICY "Members can read co-members on same trip"
  ON trip_members FOR SELECT TO authenticated
  USING (trip_id IN (SELECT auth_user_trip_ids()));
