-- Create notifications table for real-time notification system
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('assignment', 'department_lead', 'department_ticket', 'department_project')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50) CHECK (reference_type IN ('ticket', 'lead', 'project', 'customer')),
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Add constraints
    CONSTRAINT valid_reference CHECK (
        (reference_id IS NULL AND reference_type IS NULL) OR
        (reference_id IS NOT NULL AND reference_type IS NOT NULL)
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_company ON notifications(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_type, reference_id);

-- Create updated_at trigger
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Company managers can view notifications for their company users
CREATE POLICY "Company managers can view company notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = auth.uid()
            AND uc.company_id = notifications.company_id
            AND uc.role IN ('admin', 'manager', 'owner')
        )
    );

-- Global admins can view all notifications
CREATE POLICY "Global admins can view all notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- System can insert notifications (handled by functions with security definer)
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Company managers can delete notifications for their company
CREATE POLICY "Company managers can delete company notifications" ON notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.user_id = auth.uid()
            AND uc.company_id = notifications.company_id
            AND uc.role IN ('admin', 'manager', 'owner')
        )
    );

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Create helper function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_company_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        company_id,
        type,
        title,
        message,
        reference_id,
        reference_type
    ) VALUES (
        p_user_id,
        p_company_id,
        p_type,
        p_title,
        p_message,
        p_reference_id,
        p_reference_type
    ) RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to notify department users
CREATE OR REPLACE FUNCTION notify_department_users(
    p_company_id UUID,
    p_department VARCHAR(50),
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Get all users in the specified department for this company
    FOR user_record IN
        SELECT DISTINCT ud.user_id
        FROM user_departments ud
        WHERE ud.company_id = p_company_id
        AND ud.department = p_department
    LOOP
        -- Create notification for each user
        PERFORM create_notification(
            user_record.user_id,
            p_company_id,
            p_type,
            p_title,
            p_message,
            p_reference_id,
            p_reference_type
        );

        notification_count := notification_count + 1;
    END LOOP;

    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get notification counts
CREATE OR REPLACE FUNCTION get_notification_count(
    p_user_id UUID,
    p_read_status BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO count
    FROM notifications
    WHERE user_id = p_user_id
    AND read = p_read_status;

    RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores real-time notifications for users with department-based and assignment notifications';
COMMENT ON COLUMN notifications.type IS 'Notification type: assignment, department_lead, department_ticket, department_project';
COMMENT ON COLUMN notifications.reference_type IS 'Type of referenced object: ticket, lead, project, customer';
COMMENT ON FUNCTION create_notification(UUID, UUID, VARCHAR, VARCHAR, TEXT, UUID, VARCHAR) IS 'Creates a new notification for a user';
COMMENT ON FUNCTION notify_department_users(UUID, VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, VARCHAR) IS 'Creates notifications for all users in a department';
COMMENT ON FUNCTION get_notification_count(UUID, BOOLEAN) IS 'Returns notification count for a user by read status';