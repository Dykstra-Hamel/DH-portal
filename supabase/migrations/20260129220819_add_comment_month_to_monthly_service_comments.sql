-- Add comment_month field to monthly_service_comments to make comments month-specific
-- Comments will be filtered by the month they were created for

ALTER TABLE monthly_service_comments
ADD COLUMN comment_month VARCHAR(7) NOT NULL DEFAULT '2026-01';

-- Create index for faster filtering by month
CREATE INDEX idx_monthly_service_comments_month ON monthly_service_comments(comment_month);

-- Create composite index for service + month queries (most common query pattern)
CREATE INDEX idx_monthly_service_comments_service_month ON monthly_service_comments(monthly_service_id, comment_month);

-- Remove the default value after adding the column (force future inserts to specify month)
ALTER TABLE monthly_service_comments ALTER COLUMN comment_month DROP DEFAULT;
