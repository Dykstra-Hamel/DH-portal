-- Add mention notification type and comment reference types

-- Update notification type constraint to include mention
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'assignment',
        'department_lead',
        'department_ticket',
        'department_project',
        'new_ticket',
        'new_lead_unassigned',
        'new_lead_assigned',
        'new_support_case_unassigned',
        'new_support_case_assigned',
        'quote_signed',
        'mention'
    ));

-- Update reference_type constraint to include comment types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_reference_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_reference_type_check
    CHECK (reference_type IN (
        'ticket',
        'lead',
        'project',
        'customer',
        'quote',
        'project_comment',
        'task_comment'
    ));

-- Add comment for documentation
COMMENT ON CONSTRAINT notifications_type_check ON notifications IS 'Valid notification types including mention for @mentions in comments';
COMMENT ON CONSTRAINT notifications_reference_type_check ON notifications IS 'Valid reference types including project_comment and task_comment for mention notifications';
