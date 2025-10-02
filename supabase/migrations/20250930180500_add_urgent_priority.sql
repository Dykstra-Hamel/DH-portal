-- Add 'urgent' as a valid priority level to sales_cadence_steps

ALTER TABLE sales_cadence_steps
DROP CONSTRAINT IF EXISTS sales_cadence_steps_priority_check;

ALTER TABLE sales_cadence_steps
ADD CONSTRAINT sales_cadence_steps_priority_check
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

COMMENT ON CONSTRAINT sales_cadence_steps_priority_check ON sales_cadence_steps
IS 'Valid priority levels: low, medium, high, urgent';
