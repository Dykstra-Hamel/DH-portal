-- =====================================================
-- Unified Activity Logging System
-- =====================================================
-- This migration creates a unified activity_log table to track
-- all changes across the application (leads, tickets, support cases, customers)

-- =====================================================
-- Table: activity_log
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Polymorphic entity reference
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('lead', 'ticket', 'support_case', 'customer')),
    entity_id UUID NOT NULL,

    -- Activity classification
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'created',
        'field_update',
        'status_change',
        'note_added',
        'contact_made',
        'assignment_changed',
        'task_completed',
        'cadence_started',
        'cadence_paused',
        'cadence_ended',
        'archived',
        'deleted'
    )),

    -- Change tracking (for field updates)
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,

    -- User and context
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_entity_id ON activity_log(entity_id);
CREATE INDEX idx_activity_log_company_id ON activity_log(company_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_activity_type ON activity_log(activity_type);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view activity_log" ON activity_log
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Users can see activity for their company's entities
            company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            -- Global admins can see all activity
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to insert activity_log" ON activity_log
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Users can log activity for their company's entities
            company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            -- Global admins can log activity for any entity
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to update activity_log" ON activity_log
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Users can update activity for their company's entities
            company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            -- Global admins can update any activity
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to delete activity_log" ON activity_log
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            -- Users can delete activity for their company's entities
            company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            -- Global admins can delete any activity
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Enable realtime
ALTER TABLE activity_log REPLICA IDENTITY FULL;

-- Comments
COMMENT ON TABLE activity_log IS 'Unified activity log for all entity types (leads, tickets, support cases, customers)';
COMMENT ON COLUMN activity_log.entity_type IS 'Type of entity this activity relates to';
COMMENT ON COLUMN activity_log.entity_id IS 'ID of the entity this activity relates to';
COMMENT ON COLUMN activity_log.activity_type IS 'Type of activity that occurred';
COMMENT ON COLUMN activity_log.field_name IS 'Name of the field that was updated (for field_update activities)';
COMMENT ON COLUMN activity_log.old_value IS 'Previous value of the field (for field_update activities)';
COMMENT ON COLUMN activity_log.new_value IS 'New value of the field (for field_update activities)';
COMMENT ON COLUMN activity_log.notes IS 'User-entered notes or system messages';
COMMENT ON COLUMN activity_log.metadata IS 'Flexible JSONB storage for activity-specific data';
