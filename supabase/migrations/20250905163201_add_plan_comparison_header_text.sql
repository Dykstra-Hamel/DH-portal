-- Add plan comparison header text override system for pest-specific information
-- This adds a field for pest-specific plan comparison step headers

-- Add new column to company_pest_options table
ALTER TABLE company_pest_options 
ADD COLUMN plan_comparison_header_text TEXT;

-- No default values needed - NULL will fall back to current dynamic behavior
-- "Here's what we recommend for your home to get rid of those pesky [pest type] - and keep them out!"