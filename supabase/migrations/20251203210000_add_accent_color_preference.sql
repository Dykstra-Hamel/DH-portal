-- Add accent color preference to campaign_landing_pages
-- Allows campaigns to choose which brand color to use for interactive elements

ALTER TABLE campaign_landing_pages
ADD COLUMN accent_color_preference VARCHAR(10) DEFAULT 'secondary' CHECK (accent_color_preference IN ('primary', 'secondary'));

-- Update comment
COMMENT ON COLUMN campaign_landing_pages.accent_color_preference IS
'Determines which brand color to use for interactive elements (buttons, links, highlights). Options: "primary" or "secondary". Default: "secondary"';
