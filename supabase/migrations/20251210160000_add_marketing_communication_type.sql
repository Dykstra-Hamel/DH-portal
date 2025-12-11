-- Add 'marketing' as a valid communication type for suppression list
-- This allows simplified unsubscribe flow where users opt out of all marketing communications

-- Drop existing constraint
ALTER TABLE suppression_list
DROP CONSTRAINT IF EXISTS suppression_list_communication_type_check;

-- Add new constraint with 'marketing' included
ALTER TABLE suppression_list
ADD CONSTRAINT suppression_list_communication_type_check
CHECK (communication_type IN ('email', 'phone', 'sms', 'all', 'marketing'));

-- Add comment explaining the new type
COMMENT ON COLUMN suppression_list.communication_type IS 'Type of communication to suppress: email, phone, sms, all, or marketing (all marketing communications regardless of channel)';
