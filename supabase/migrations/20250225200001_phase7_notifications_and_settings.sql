-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  record_id UUID NOT NULL,
  record_type object_type NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Service role inserts notifications (from server actions)
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Organization settings table for association visibility etc.
CREATE TABLE org_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, setting_key)
);

ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_settings_select" ON org_settings FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_settings_insert" ON org_settings FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_settings_update" ON org_settings FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- Trigger for updated_at on org_settings
CREATE TRIGGER set_updated_at_org_settings
  BEFORE UPDATE ON org_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to create notification on activity (called from app layer, not trigger)
-- We'll handle this in the application layer for simplicity
