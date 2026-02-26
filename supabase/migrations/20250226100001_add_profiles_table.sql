-- Phase 3.2.2: User profiles table for personal settings
-- Stores display_name, timezone, location, avatar_url per user

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  location TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS: users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow other users in the same org to read profiles (for avatar display)
CREATE POLICY "Users can view profiles in same org"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT uo.user_id FROM user_organizations uo
      WHERE uo.organization_id IN (SELECT get_user_org_ids())
    )
  );

-- Create Supabase Storage bucket for avatars (if not exists)
-- Note: Storage bucket creation is done via Supabase dashboard or API, not SQL
-- The bucket 'avatars' should be created with public access for avatar URLs
