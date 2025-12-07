-- Update notification system for assignment-based notifications

-- Add assigned_to field to notifications table
ALTER TABLE notifications ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for assigned_to field
CREATE INDEX IF NOT EXISTS idx_notifications_assigned_to ON notifications(assigned_to);

-- Update notification type constraint to include new types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('assignment', 'department_lead', 'department_ticket', 'department_project', 'new_ticket', 'new_lead_unassigned', 'new_lead_assigned', 'new_support_case_unassigned', 'new_support_case_assigned'));

-- Create function to notify all company users (for new tickets)
CREATE OR REPLACE FUNCTION notify_all_company_users(
    p_company_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_assigned_to UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    notification_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Get all users in the company
    FOR user_record IN
        SELECT DISTINCT uc.user_id
        FROM user_companies uc
        WHERE uc.company_id = p_company_id
    LOOP
        -- Create notification for each user
        PERFORM create_notification(
            user_record.user_id,
            p_company_id,
            p_type,
            p_title,
            p_message,
            p_reference_id,
            p_reference_type,
            p_assigned_to
        );

        notification_count := notification_count + 1;
    END LOOP;

    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to notify department users and managers/admins
CREATE OR REPLACE FUNCTION notify_department_and_managers(
    p_company_id UUID,
    p_department VARCHAR(50),
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_assigned_to UUID DEFAULT NULL
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
        -- Create notification for each department user
        PERFORM create_notification(
            user_record.user_id,
            p_company_id,
            p_type,
            p_title,
            p_message,
            p_reference_id,
            p_reference_type,
            p_assigned_to
        );

        notification_count := notification_count + 1;
    END LOOP;

    -- Also notify managers and admins
    FOR user_record IN
        SELECT DISTINCT uc.user_id
        FROM user_companies uc
        WHERE uc.company_id = p_company_id
        AND uc.role IN ('admin', 'manager', 'owner')
    LOOP
        -- Only create notification if user isn't already notified (not in department)
        IF NOT EXISTS (
            SELECT 1 FROM user_departments ud
            WHERE ud.user_id = user_record.user_id
            AND ud.company_id = p_company_id
            AND ud.department = p_department
        ) THEN
            PERFORM create_notification(
                user_record.user_id,
                p_company_id,
                p_type,
                p_title,
                p_message,
                p_reference_id,
                p_reference_type,
                p_assigned_to
            );

            notification_count := notification_count + 1;
        END IF;
    END LOOP;

    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to notify assigned user and managers/admins
CREATE OR REPLACE FUNCTION notify_assigned_and_managers(
    p_company_id UUID,
    p_assigned_user_id UUID,
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
    -- Notify the assigned user
    PERFORM create_notification(
        p_assigned_user_id,
        p_company_id,
        p_type,
        p_title,
        p_message,
        p_reference_id,
        p_reference_type,
        p_assigned_user_id
    );

    notification_count := notification_count + 1;

    -- Also notify managers and admins (except if they are the assigned user)
    FOR user_record IN
        SELECT DISTINCT uc.user_id
        FROM user_companies uc
        WHERE uc.company_id = p_company_id
        AND uc.role IN ('admin', 'manager', 'owner')
        AND uc.user_id != p_assigned_user_id
    LOOP
        PERFORM create_notification(
            user_record.user_id,
            p_company_id,
            p_type,
            p_title,
            p_message,
            p_reference_id,
            p_reference_type,
            p_assigned_user_id
        );

        notification_count := notification_count + 1;
    END LOOP;

    RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the create_notification function to include assigned_to parameter
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_company_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_assigned_to UUID DEFAULT NULL
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
        reference_type,
        assigned_to
    ) VALUES (
        p_user_id,
        p_company_id,
        p_type,
        p_title,
        p_message,
        p_reference_id,
        p_reference_type,
        p_assigned_to
    ) RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON COLUMN notifications.assigned_to IS 'User ID that the referenced item is assigned to (for assignment-based notifications)';
COMMENT ON FUNCTION notify_all_company_users(UUID, VARCHAR, VARCHAR, TEXT, UUID, VARCHAR, UUID) IS 'Creates notifications for all users in a company';
COMMENT ON FUNCTION notify_department_and_managers(UUID, VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, VARCHAR, UUID) IS 'Creates notifications for department users and company managers/admins';
COMMENT ON FUNCTION notify_assigned_and_managers(UUID, UUID, VARCHAR, VARCHAR, TEXT, UUID, VARCHAR) IS 'Creates notifications for assigned user and company managers/admins';