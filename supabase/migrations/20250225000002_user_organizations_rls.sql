-- Fix: user_organizations had RLS enabled but no policies, blocking all direct queries.
-- This caused getAuthContext() to fail for every authenticated user since it queries
-- user_organizations directly (not via the SECURITY DEFINER get_user_org_ids() function).

-- Users can read their own organization memberships
CREATE POLICY "users_can_view_own_memberships"
  ON user_organizations FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own memberships (needed for signup flow)
CREATE POLICY "users_can_insert_own_memberships"
  ON user_organizations FOR INSERT
  WITH CHECK (user_id = auth.uid());
