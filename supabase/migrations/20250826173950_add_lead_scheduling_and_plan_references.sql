-- Add requested scheduling fields and plan references to leads table

-- Add requested date and time fields for scheduling
ALTER TABLE leads 
ADD COLUMN requested_date DATE,
ADD COLUMN requested_time VARCHAR(20) CHECK (requested_time IN ('morning', 'afternoon', 'evening', 'anytime'));

-- Add structured plan references instead of just storing in comments
ALTER TABLE leads
ADD COLUMN selected_plan_id UUID REFERENCES service_plans(id) ON DELETE SET NULL,
ADD COLUMN recommended_plan_name VARCHAR(255);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_requested_date ON leads(requested_date);
CREATE INDEX IF NOT EXISTS idx_leads_requested_time ON leads(requested_time);
CREATE INDEX IF NOT EXISTS idx_leads_selected_plan_id ON leads(selected_plan_id);
CREATE INDEX IF NOT EXISTS idx_leads_recommended_plan_name ON leads(recommended_plan_name);

-- Add comments for documentation
COMMENT ON COLUMN leads.requested_date IS 'Date requested by customer for service (from widget form)';
COMMENT ON COLUMN leads.requested_time IS 'Time preference requested by customer: morning, afternoon, evening, or anytime';
COMMENT ON COLUMN leads.selected_plan_id IS 'Foreign key reference to the service plan selected by customer';
COMMENT ON COLUMN leads.recommended_plan_name IS 'Name of the plan recommended by the system (stored as string)';