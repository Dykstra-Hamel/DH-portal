-- Extend notification type constraint to include task_reassignment
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'assignment','department_lead','department_ticket','department_project',
  'new_ticket','new_lead_unassigned','new_lead_assigned',
  'new_support_case_unassigned','new_support_case_assigned',
  'quote_signed','mention','proof_feedback','task_reassignment'
));

-- Extend reference_type constraint to include monthly_service
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_reference_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_reference_type_check CHECK (reference_type IN (
  'ticket','lead','project','customer','quote',
  'project_comment','task_comment','monthly_service_comment','proof',
  'monthly_service'
));
