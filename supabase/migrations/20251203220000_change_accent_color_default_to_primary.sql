-- Change default accent color preference from 'secondary' to 'primary'
ALTER TABLE campaign_landing_pages
ALTER COLUMN accent_color_preference SET DEFAULT 'primary';

-- Update comment
COMMENT ON COLUMN campaign_landing_pages.accent_color_preference IS
'Determines which brand color to use for interactive elements (buttons, links, highlights). Options: "primary" or "secondary". Default: "primary"';

-- Update existing rows to use 'primary' (only affects rows that still have the old default)
UPDATE campaign_landing_pages
SET accent_color_preference = 'primary'
WHERE accent_color_preference = 'secondary';
