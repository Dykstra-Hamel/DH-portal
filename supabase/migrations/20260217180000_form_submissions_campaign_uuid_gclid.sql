-- Migration: Convert form_submissions.campaign_id from TEXT to UUID FK,
-- and add a dedicated gclid column for Google Click IDs.

-- Step 1: Add gclid column
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS gclid VARCHAR(255);

-- Step 2: Migrate non-UUID values from campaign_id to gclid
-- (These are gclid values that were previously stored in campaign_id)
UPDATE form_submissions
SET gclid = campaign_id, campaign_id = NULL
WHERE campaign_id IS NOT NULL
  AND campaign_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Convert campaign_id from TEXT to UUID
ALTER TABLE form_submissions
  ALTER COLUMN campaign_id TYPE UUID USING campaign_id::UUID;

-- Step 4: Add foreign key constraint to campaigns table
ALTER TABLE form_submissions
  ADD CONSTRAINT fk_form_submissions_campaign
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id);

-- Step 5: Add index on campaign_id for query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_campaign_id
  ON form_submissions(campaign_id) WHERE campaign_id IS NOT NULL;

-- Step 6: Add index on gclid for query performance
CREATE INDEX IF NOT EXISTS idx_form_submissions_gclid
  ON form_submissions(gclid) WHERE gclid IS NOT NULL;
