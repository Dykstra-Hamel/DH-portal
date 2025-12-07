-- Create tasks table for universal task management system
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Core task fields
    title VARCHAR(255) NOT NULL,
    description TEXT,
    notes TEXT,
    
    -- Task workflow and status
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Assignment and tracking
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Timing and scheduling
    due_date DATE,
    due_time TIME,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    
    -- Polymorphic relationship to any entity
    related_entity_type VARCHAR(50),  -- 'leads', 'support_cases', 'customers', 'tickets', etc.
    related_entity_id UUID,
    
    -- Task completion tracking
    completed_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    
    -- Standard fields
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived);

-- Composite indexes for polymorphic relationships
CREATE INDEX IF NOT EXISTS idx_tasks_related_entity ON tasks(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company_status ON tasks(company_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to, status);

-- Create updated_at trigger
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks table
CREATE POLICY "Allow authenticated users to view tasks" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert tasks" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update tasks" ON tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete tasks" ON tasks
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger function to automatically set timestamps and workflow states
CREATE OR REPLACE FUNCTION set_task_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Set started_at when status changes to in_progress
    IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' AND NEW.started_at IS NULL THEN
        NEW.started_at = NOW();
    END IF;
    
    -- Set completed_at when status changes to completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    
    -- Clear completed_at if status changes from completed to something else
    IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set timestamps
CREATE TRIGGER trigger_set_task_timestamps
    BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_task_timestamps();

-- Add helpful comments for documentation
COMMENT ON TABLE tasks IS 'Universal task management table that can be related to any entity in the system';
COMMENT ON COLUMN tasks.title IS 'Brief title/summary of the task';
COMMENT ON COLUMN tasks.description IS 'Detailed description of what needs to be done';
COMMENT ON COLUMN tasks.notes IS 'Additional notes, comments, or progress updates';
COMMENT ON COLUMN tasks.status IS 'Current status of the task workflow';
COMMENT ON COLUMN tasks.priority IS 'Priority level for task scheduling and assignment';
COMMENT ON COLUMN tasks.assigned_to IS 'User responsible for completing the task';
COMMENT ON COLUMN tasks.created_by IS 'User who created the task';
COMMENT ON COLUMN tasks.due_date IS 'Date when task should be completed';
COMMENT ON COLUMN tasks.due_time IS 'Specific time when task should be completed';
COMMENT ON COLUMN tasks.estimated_hours IS 'Estimated time to complete the task';
COMMENT ON COLUMN tasks.actual_hours IS 'Actual time spent completing the task';
COMMENT ON COLUMN tasks.related_entity_type IS 'Type of entity this task is related to (leads, support_cases, customers, etc.)';
COMMENT ON COLUMN tasks.related_entity_id IS 'ID of the related entity';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task was marked as completed';
COMMENT ON COLUMN tasks.started_at IS 'Timestamp when task status was first set to in_progress';
COMMENT ON COLUMN tasks.archived IS 'Soft delete flag - archived tasks are hidden from main views but preserved in database';