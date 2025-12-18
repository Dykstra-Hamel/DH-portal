-- User Notification Preferences Migration
-- Creates table for managing user email notification preferences
-- Supports per-user, per-company, per-notification-type control

-- =====================================================
-- Table: user_notification_preferences
-- Purpose: Store user preferences for email notifications
-- =====================================================
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Notification type identifier
  -- Types: 'lead_created', 'campaign_submitted', 'quote_submitted', 'quote_signed'
  notification_type VARCHAR(50) NOT NULL,

  -- Channel controls (extensible for future SMS/push notifications)
  email_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one preference per user/company/type combination
  UNIQUE(user_id, company_id, notification_type)
);

-- =====================================================
-- Indexes for query performance
-- =====================================================
CREATE INDEX idx_user_notif_prefs_user ON user_notification_preferences(user_id);
CREATE INDEX idx_user_notif_prefs_company ON user_notification_preferences(company_id);
CREATE INDEX idx_user_notif_prefs_type ON user_notification_preferences(notification_type);
CREATE INDEX idx_user_notif_prefs_lookup ON user_notification_preferences(user_id, company_id, notification_type);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own preferences
CREATE POLICY "Users can delete own notification preferences"
  ON user_notification_preferences FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- Updated timestamp trigger
-- =====================================================
CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE user_notification_preferences IS 'Stores per-user email notification preferences for different event types';
COMMENT ON COLUMN user_notification_preferences.notification_type IS 'Event type: lead_created, campaign_submitted, quote_submitted, quote_signed';
COMMENT ON COLUMN user_notification_preferences.email_enabled IS 'Whether user wants to receive email notifications for this event type';
