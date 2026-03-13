-- 1. Add responded_at to campaign_contact_list_members
ALTER TABLE campaign_contact_list_members
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_campaign_contact_list_members_responded_at
  ON campaign_contact_list_members(responded_at)
  WHERE responded_at IS NOT NULL;

-- 2. Add campaign_response to notification types constraint
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'assignment', 'department_lead', 'department_ticket', 'department_project',
    'new_ticket', 'new_lead_unassigned', 'new_lead_assigned',
    'new_support_case_unassigned', 'new_support_case_assigned',
    'quote_signed', 'mention', 'proof_feedback', 'task_reassignment',
    'campaign_response'
  ));
