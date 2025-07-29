-- Add plan_image_url column to service_plans table
ALTER TABLE service_plans
ADD COLUMN plan_image_url TEXT;

-- Add comment for the new column
COMMENT ON COLUMN service_plans.plan_image_url IS 'URL to the plan image stored in Supabase storage';