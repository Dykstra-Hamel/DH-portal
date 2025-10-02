-- =====================================================
-- Sales Cadence System
-- =====================================================
-- This migration creates a comprehensive sales cadence system that:
-- 1. Allows companies to create multiple configurable sales cadences
-- 2. Tracks lead progress through cadence steps
-- 3. Logs all contact activities
-- 4. Automatically creates tasks for next cadence steps
-- 5. Integrates with existing task management system

-- =====================================================
-- Table: sales_cadences
-- =====================================================
-- Company-level cadence templates (e.g., "3-Day Standard", "5-Day Aggressive")
CREATE TABLE IF NOT EXISTS sales_cadences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_cadence_name_per_company UNIQUE (company_id, name)
);

-- Create indexes
CREATE INDEX idx_sales_cadences_company_id ON sales_cadences(company_id);
CREATE INDEX idx_sales_cadences_is_active ON sales_cadences(is_active);
CREATE INDEX idx_sales_cadences_is_default ON sales_cadences(is_default);

-- Updated_at trigger
CREATE TRIGGER update_sales_cadences_updated_at
    BEFORE UPDATE ON sales_cadences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE sales_cadences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view sales_cadences" ON sales_cadences
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Users can see their company's cadences
            company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            -- Global admins can see all cadences
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to insert sales_cadences" ON sales_cadences
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Users can insert for their company
            company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            -- Global admins can insert for any company
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to update sales_cadences" ON sales_cadences
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Users can update their company's cadences
            company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            -- Global admins can update any cadence
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to delete sales_cadences" ON sales_cadences
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            -- Users can delete their company's cadences
            company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            -- Global admins can delete any cadence
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Comments
COMMENT ON TABLE sales_cadences IS 'Company-level sales cadence templates that define sequences of contact actions';
COMMENT ON COLUMN sales_cadences.name IS 'Cadence name (e.g., "3-Day Standard", "5-Day Aggressive")';
COMMENT ON COLUMN sales_cadences.is_active IS 'Whether this cadence is currently active and available for use';
COMMENT ON COLUMN sales_cadences.is_default IS 'Whether this is the default cadence for new leads';

-- =====================================================
-- Table: sales_cadence_steps
-- =====================================================
-- Individual steps within each cadence
CREATE TABLE IF NOT EXISTS sales_cadence_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cadence_id UUID NOT NULL REFERENCES sales_cadences(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number > 0),
    time_of_day VARCHAR(20) NOT NULL CHECK (time_of_day IN ('morning', 'afternoon')),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('live_call', 'outbound_call', 'text_message', 'ai_call', 'email')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    display_order INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_step_order_per_cadence UNIQUE (cadence_id, display_order)
);

-- Create indexes
CREATE INDEX idx_sales_cadence_steps_cadence_id ON sales_cadence_steps(cadence_id);
CREATE INDEX idx_sales_cadence_steps_day_number ON sales_cadence_steps(day_number);
CREATE INDEX idx_sales_cadence_steps_display_order ON sales_cadence_steps(display_order);
CREATE INDEX idx_sales_cadence_steps_action_type ON sales_cadence_steps(action_type);

-- Updated_at trigger
CREATE TRIGGER update_sales_cadence_steps_updated_at
    BEFORE UPDATE ON sales_cadence_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE sales_cadence_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view sales_cadence_steps" ON sales_cadence_steps
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Users can see steps from their company's cadences
            cadence_id IN (
                SELECT id FROM sales_cadences
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can see all steps
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to insert sales_cadence_steps" ON sales_cadence_steps
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Users can insert steps for their company's cadences
            cadence_id IN (
                SELECT id FROM sales_cadences
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can insert steps for any cadence
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to update sales_cadence_steps" ON sales_cadence_steps
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Users can update steps from their company's cadences
            cadence_id IN (
                SELECT id FROM sales_cadences
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can update any steps
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to delete sales_cadence_steps" ON sales_cadence_steps
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            -- Users can delete steps from their company's cadences
            cadence_id IN (
                SELECT id FROM sales_cadences
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can delete any steps
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Comments
COMMENT ON TABLE sales_cadence_steps IS 'Individual steps within sales cadences, grouped by day and ordered chronologically';
COMMENT ON COLUMN sales_cadence_steps.day_number IS 'Day number in the cadence sequence (1, 2, 3, etc.)';
COMMENT ON COLUMN sales_cadence_steps.time_of_day IS 'Time of day for the action: morning (12PM target) or afternoon (5PM target)';
COMMENT ON COLUMN sales_cadence_steps.action_type IS 'Type of contact action: live_call, outbound_call, text_message, ai_call, email';
COMMENT ON COLUMN sales_cadence_steps.priority IS 'Priority level for the step';
COMMENT ON COLUMN sales_cadence_steps.display_order IS 'Order in which steps should be displayed and executed';

-- =====================================================
-- Table: lead_cadence_assignments
-- =====================================================
-- Links leads to their assigned sales cadences
CREATE TABLE IF NOT EXISTS lead_cadence_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    cadence_id UUID NOT NULL REFERENCES sales_cadences(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Only one active cadence per lead
    CONSTRAINT unique_active_cadence_per_lead UNIQUE (lead_id)
);

-- Create indexes
CREATE INDEX idx_lead_cadence_assignments_lead_id ON lead_cadence_assignments(lead_id);
CREATE INDEX idx_lead_cadence_assignments_cadence_id ON lead_cadence_assignments(cadence_id);
CREATE INDEX idx_lead_cadence_assignments_started_at ON lead_cadence_assignments(started_at);

-- Updated_at trigger
CREATE TRIGGER update_lead_cadence_assignments_updated_at
    BEFORE UPDATE ON lead_cadence_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE lead_cadence_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view lead_cadence_assignments" ON lead_cadence_assignments
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Users can see assignments for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can see all assignments
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to insert lead_cadence_assignments" ON lead_cadence_assignments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Users can create assignments for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can create assignments for any lead
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to update lead_cadence_assignments" ON lead_cadence_assignments
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Users can update assignments for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can update any assignment
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to delete lead_cadence_assignments" ON lead_cadence_assignments
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            -- Users can delete assignments for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can delete any assignment
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Comments
COMMENT ON TABLE lead_cadence_assignments IS 'Links leads to their assigned sales cadences';
COMMENT ON COLUMN lead_cadence_assignments.started_at IS 'Timestamp used to calculate target dates for cadence steps';
COMMENT ON COLUMN lead_cadence_assignments.completed_at IS 'Timestamp when all cadence steps were completed';

-- =====================================================
-- Table: lead_cadence_progress
-- =====================================================
-- Tracks completion of individual cadence steps for each lead
CREATE TABLE IF NOT EXISTS lead_cadence_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    cadence_step_id UUID NOT NULL REFERENCES sales_cadence_steps(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_by_activity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_step_progress_per_lead UNIQUE (lead_id, cadence_step_id)
);

-- Create indexes
CREATE INDEX idx_lead_cadence_progress_lead_id ON lead_cadence_progress(lead_id);
CREATE INDEX idx_lead_cadence_progress_cadence_step_id ON lead_cadence_progress(cadence_step_id);
CREATE INDEX idx_lead_cadence_progress_completed_at ON lead_cadence_progress(completed_at);

-- Enable RLS
ALTER TABLE lead_cadence_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view lead_cadence_progress" ON lead_cadence_progress
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Users can see progress for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can see all progress
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to insert lead_cadence_progress" ON lead_cadence_progress
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Users can create progress for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can create progress for any lead
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to update lead_cadence_progress" ON lead_cadence_progress
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Users can update progress for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can update any progress
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to delete lead_cadence_progress" ON lead_cadence_progress
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            -- Users can delete progress for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can delete any progress
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Comments
COMMENT ON TABLE lead_cadence_progress IS 'Tracks which cadence steps have been completed for each lead';
COMMENT ON COLUMN lead_cadence_progress.completed_by_activity_id IS 'Reference to the activity that completed this step';

-- =====================================================
-- Table: lead_activity_log
-- =====================================================
-- Complete history of all contact activities on leads
CREATE TABLE IF NOT EXISTS lead_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('live_call', 'outbound_call', 'text_message', 'ai_call', 'email')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_lead_activity_log_lead_id ON lead_activity_log(lead_id);
CREATE INDEX idx_lead_activity_log_user_id ON lead_activity_log(user_id);
CREATE INDEX idx_lead_activity_log_action_type ON lead_activity_log(action_type);
CREATE INDEX idx_lead_activity_log_created_at ON lead_activity_log(created_at);

-- Enable RLS
ALTER TABLE lead_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view lead_activity_log" ON lead_activity_log
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            -- Users can see activity for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can see all activity
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to insert lead_activity_log" ON lead_activity_log
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            -- Users can log activity for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can log activity for any lead
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to update lead_activity_log" ON lead_activity_log
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            -- Users can update activity for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can update any activity
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE POLICY "Allow authenticated users to delete lead_activity_log" ON lead_activity_log
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            -- Users can delete activity for leads in their company
            lead_id IN (
                SELECT id FROM leads
                WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
            )
            -- Global admins can delete any activity
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Comments
COMMENT ON TABLE lead_activity_log IS 'Complete history of all contact activities and attempts for leads';
COMMENT ON COLUMN lead_activity_log.action_type IS 'Type of contact action performed';
COMMENT ON COLUMN lead_activity_log.notes IS 'Notes from the contact attempt';

-- =====================================================
-- Modify tasks table
-- =====================================================
-- Add cadence_step_id to link tasks to cadence steps
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS cadence_step_id UUID REFERENCES sales_cadence_steps(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_tasks_cadence_step_id ON tasks(cadence_step_id);

-- Comment
COMMENT ON COLUMN tasks.cadence_step_id IS 'Links tasks to the cadence step they represent (for auto-generated cadence tasks)';

-- =====================================================
-- Function: Get Next Incomplete Cadence Step
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_incomplete_cadence_step(p_lead_id UUID)
RETURNS TABLE (
    step_id UUID,
    cadence_id UUID,
    day_number INTEGER,
    time_of_day VARCHAR,
    action_type VARCHAR,
    priority VARCHAR,
    display_order INTEGER,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        scs.id,
        scs.cadence_id,
        scs.day_number,
        scs.time_of_day,
        scs.action_type,
        scs.priority,
        scs.display_order,
        scs.description
    FROM lead_cadence_assignments lca
    JOIN sales_cadence_steps scs ON scs.cadence_id = lca.cadence_id
    LEFT JOIN lead_cadence_progress lcp ON lcp.lead_id = lca.lead_id
        AND lcp.cadence_step_id = scs.id
    WHERE lca.lead_id = p_lead_id
        AND lcp.id IS NULL  -- Step not yet completed
    ORDER BY scs.display_order ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION get_next_incomplete_cadence_step IS 'Returns the next incomplete cadence step for a given lead';

-- =====================================================
-- Function: Create Task for Cadence Step
-- =====================================================
CREATE OR REPLACE FUNCTION create_task_for_cadence_step(
    p_lead_id UUID,
    p_cadence_step_id UUID,
    p_assigned_to UUID,
    p_company_id UUID,
    p_customer_name VARCHAR,
    p_started_at TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
    v_task_id UUID;
    v_step_record RECORD;
    v_due_date DATE;
    v_due_time TIME;
    v_task_title VARCHAR(255);
    v_action_display VARCHAR(50);
BEGIN
    -- Get step details
    SELECT
        day_number,
        time_of_day,
        action_type,
        priority,
        description
    INTO v_step_record
    FROM sales_cadence_steps
    WHERE id = p_cadence_step_id;

    -- Calculate due date (started_at + day_number - 1 days)
    v_due_date := (p_started_at + ((v_step_record.day_number - 1) || ' days')::INTERVAL)::DATE;

    -- Calculate due time based on time_of_day
    v_due_time := CASE
        WHEN v_step_record.time_of_day = 'morning' THEN '12:00:00'::TIME
        WHEN v_step_record.time_of_day = 'afternoon' THEN '17:00:00'::TIME
        ELSE '12:00:00'::TIME
    END;

    -- Format action type for display
    v_action_display := CASE v_step_record.action_type
        WHEN 'live_call' THEN 'Live Call'
        WHEN 'outbound_call' THEN 'Outbound Call'
        WHEN 'text_message' THEN 'Text Message'
        WHEN 'ai_call' THEN 'AI Call'
        WHEN 'email' THEN 'Email'
        ELSE v_step_record.action_type
    END;

    -- Format task title
    v_task_title := 'Day ' || v_step_record.day_number || ': ' ||
                    INITCAP(v_step_record.time_of_day) || ' ' ||
                    v_action_display || ' - ' || p_customer_name;

    -- Create the task
    INSERT INTO tasks (
        company_id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
        due_time,
        related_entity_type,
        related_entity_id,
        cadence_step_id,
        created_at
    ) VALUES (
        p_company_id,
        v_task_title,
        v_step_record.description,
        'new',
        v_step_record.priority,
        p_assigned_to,
        v_due_date,
        v_due_time,
        'leads',
        p_lead_id,
        p_cadence_step_id,
        NOW()
    )
    RETURNING id INTO v_task_id;

    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION create_task_for_cadence_step IS 'Creates a task for a specific cadence step with calculated due date and time';

-- =====================================================
-- Trigger Function: Create First Task on Cadence Assignment
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_create_first_cadence_task()
RETURNS TRIGGER AS $$
DECLARE
    v_first_step RECORD;
    v_lead_record RECORD;
    v_customer_name VARCHAR(255);
BEGIN
    -- Get the first cadence step (lowest display_order)
    -- Don't check for completion - always get the first step when starting a cadence
    SELECT
        id as step_id,
        cadence_id,
        day_number,
        time_of_day,
        action_type,
        priority,
        display_order,
        description
    INTO v_first_step
    FROM sales_cadence_steps
    WHERE cadence_id = NEW.cadence_id
    ORDER BY display_order ASC
    LIMIT 1;

    -- Get lead details
    SELECT
        l.assigned_to,
        l.company_id,
        COALESCE(c.first_name || ' ' || c.last_name, 'Unknown Customer') as customer_name
    INTO v_lead_record
    FROM leads l
    LEFT JOIN customers c ON c.id = l.customer_id
    WHERE l.id = NEW.lead_id;

    -- Create task for first step if it exists and lead has an assignee
    IF v_first_step.step_id IS NOT NULL AND v_lead_record.assigned_to IS NOT NULL THEN
        PERFORM create_task_for_cadence_step(
            NEW.lead_id,
            v_first_step.step_id,
            v_lead_record.assigned_to,
            v_lead_record.company_id,
            v_lead_record.customer_name,
            NEW.started_at
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger
CREATE TRIGGER trigger_create_first_task_on_cadence_assignment
    AFTER INSERT ON lead_cadence_assignments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_first_cadence_task();

COMMENT ON FUNCTION trigger_create_first_cadence_task IS 'Automatically creates a task for the first cadence step when a cadence is assigned to a lead';

-- =====================================================
-- Trigger Function: Auto-Create Next Task on Activity Completion
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_auto_progress_cadence()
RETURNS TRIGGER AS $$
DECLARE
    v_current_step RECORD;
    v_next_step RECORD;
    v_lead_record RECORD;
    v_assignment_record RECORD;
    v_customer_name VARCHAR(255);
BEGIN
    -- Get lead cadence assignment
    SELECT * INTO v_assignment_record
    FROM lead_cadence_assignments
    WHERE lead_id = NEW.lead_id;

    -- Only proceed if lead has an active cadence assignment
    IF v_assignment_record.id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Find the current incomplete step that matches the activity type
    SELECT
        scs.id as step_id,
        scs.action_type
    INTO v_current_step
    FROM sales_cadence_steps scs
    LEFT JOIN lead_cadence_progress lcp ON lcp.cadence_step_id = scs.id
        AND lcp.lead_id = NEW.lead_id
    WHERE scs.cadence_id = v_assignment_record.cadence_id
        AND lcp.id IS NULL  -- Not yet completed
        AND scs.action_type = NEW.action_type  -- Matches activity type
    ORDER BY scs.display_order ASC
    LIMIT 1;

    -- Mark the current step as complete if found
    IF v_current_step.step_id IS NOT NULL THEN
        INSERT INTO lead_cadence_progress (
            lead_id,
            cadence_step_id,
            completed_at,
            completed_by_activity_id
        ) VALUES (
            NEW.lead_id,
            v_current_step.step_id,
            NEW.created_at,
            NEW.id
        );

        -- Get the next incomplete step
        SELECT * INTO v_next_step
        FROM get_next_incomplete_cadence_step(NEW.lead_id);

        -- Get lead details
        SELECT
            l.assigned_to,
            l.company_id,
            COALESCE(c.first_name || ' ' || c.last_name, 'Unknown Customer') as customer_name
        INTO v_lead_record
        FROM leads l
        LEFT JOIN customers c ON c.id = l.customer_id
        WHERE l.id = NEW.lead_id;

        -- Create task for next step if it exists and lead has an assignee
        IF v_next_step.step_id IS NOT NULL AND v_lead_record.assigned_to IS NOT NULL THEN
            PERFORM create_task_for_cadence_step(
                NEW.lead_id,
                v_next_step.step_id,
                v_lead_record.assigned_to,
                v_lead_record.company_id,
                v_lead_record.customer_name,
                v_assignment_record.started_at
            );
        ELSIF v_next_step.step_id IS NULL THEN
            -- All steps completed, mark cadence as complete
            UPDATE lead_cadence_assignments
            SET completed_at = NEW.created_at
            WHERE lead_id = NEW.lead_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger
CREATE TRIGGER trigger_auto_progress_on_activity
    AFTER INSERT ON lead_activity_log
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_progress_cadence();

COMMENT ON FUNCTION trigger_auto_progress_cadence IS 'Automatically marks cadence steps complete and creates next task when matching activity is logged';
