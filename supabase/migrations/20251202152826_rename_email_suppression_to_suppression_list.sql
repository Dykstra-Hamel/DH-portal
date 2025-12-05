-- Rename email_suppression_list to suppression_list and extend for multi-channel support
-- This migration renames the table to be more generic and adds phone/SMS suppression capabilities

-- 1. Rename the table
ALTER TABLE email_suppression_list RENAME TO suppression_list;

-- 2. Add new columns for phone number and communication type
ALTER TABLE suppression_list
ADD COLUMN phone_number TEXT,
ADD COLUMN communication_type VARCHAR(50) NOT NULL DEFAULT 'email'
  CHECK (communication_type IN ('email', 'phone', 'sms', 'all'));

-- 3. Update the comment to reflect new purpose
COMMENT ON TABLE suppression_list IS 'Tracks contacts that should not receive communications (email, phone calls, SMS) due to bounces, complaints, or unsubscribe requests';
COMMENT ON COLUMN suppression_list.phone_number IS 'Phone number to suppress (E.164 format recommended)';
COMMENT ON COLUMN suppression_list.communication_type IS 'Type of communication to suppress: email, phone, sms, or all';

-- 4. Drop old unique constraint and create new one that handles both email and phone
DROP INDEX IF EXISTS idx_email_suppression_company_email;
CREATE UNIQUE INDEX idx_suppression_company_email_phone
ON suppression_list(company_id, LOWER(COALESCE(email_address, '')), LOWER(COALESCE(phone_number, '')))
WHERE email_address IS NOT NULL OR phone_number IS NOT NULL;

-- 5. Rename other indexes for consistency
DROP INDEX IF EXISTS idx_email_suppression_email;
CREATE INDEX idx_suppression_email
ON suppression_list(LOWER(email_address))
WHERE email_address IS NOT NULL;

-- Add index for phone number lookups
CREATE INDEX idx_suppression_phone
ON suppression_list(LOWER(phone_number))
WHERE phone_number IS NOT NULL;

-- Rename company_id index
DROP INDEX IF EXISTS idx_email_suppression_company_id;
CREATE INDEX idx_suppression_company_id
ON suppression_list(company_id);

-- Rename reason index
DROP INDEX IF EXISTS idx_email_suppression_reason;
CREATE INDEX idx_suppression_reason
ON suppression_list(suppression_reason);

-- Add index for communication_type
CREATE INDEX idx_suppression_communication_type
ON suppression_list(communication_type);

-- 6. Rename the trigger function
ALTER FUNCTION update_email_suppression_updated_at() RENAME TO update_suppression_updated_at;

-- 7. Drop old trigger and create new one
DROP TRIGGER IF EXISTS email_suppression_update_timestamp ON suppression_list;
CREATE TRIGGER suppression_update_timestamp
BEFORE UPDATE ON suppression_list
FOR EACH ROW
EXECUTE FUNCTION update_suppression_updated_at();

-- 8. Update RLS policies with new names
DROP POLICY IF EXISTS "Users can view company suppression list" ON suppression_list;
DROP POLICY IF EXISTS "Users can add to company suppression list" ON suppression_list;
DROP POLICY IF EXISTS "Users can remove from company suppression list" ON suppression_list;

-- Recreate policies with updated names
CREATE POLICY "Users can view company suppression list"
ON suppression_list
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can add to company suppression list"
ON suppression_list
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove from company suppression list"
ON suppression_list
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
);

-- 9. Add validation to ensure at least one contact method is provided
ALTER TABLE suppression_list
ADD CONSTRAINT suppression_contact_required
CHECK (email_address IS NOT NULL OR phone_number IS NOT NULL);
