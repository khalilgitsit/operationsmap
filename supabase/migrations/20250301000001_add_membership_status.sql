-- Add membership status to user_organizations to distinguish pending invites from active members

-- Create enum for membership status
CREATE TYPE membership_status AS ENUM ('pending', 'active');

-- Add status column with default 'active' (existing members are all active)
ALTER TABLE user_organizations
  ADD COLUMN status membership_status NOT NULL DEFAULT 'active';

-- Set all existing rows to active explicitly
UPDATE user_organizations SET status = 'active' WHERE status IS NOT NULL;
