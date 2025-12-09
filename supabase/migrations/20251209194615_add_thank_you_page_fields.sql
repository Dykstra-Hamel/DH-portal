-- Add Thank You Page customization fields to campaign_landing_pages table
-- Migration created: 2025-12-09

ALTER TABLE campaign_landing_pages
  -- Greeting Section
  ADD COLUMN thankyou_greeting TEXT DEFAULT 'Thanks {first_name}!',
  ADD COLUMN thankyou_content TEXT DEFAULT NULL,

  -- What To Expect Section
  ADD COLUMN thankyou_show_expect BOOLEAN DEFAULT TRUE,
  ADD COLUMN thankyou_expect_heading TEXT DEFAULT 'What To Expect',

  -- Column 1
  ADD COLUMN thankyou_expect_col1_image TEXT DEFAULT NULL,
  ADD COLUMN thankyou_expect_col1_heading TEXT DEFAULT NULL,
  ADD COLUMN thankyou_expect_col1_content TEXT DEFAULT NULL,

  -- Column 2
  ADD COLUMN thankyou_expect_col2_image TEXT DEFAULT NULL,
  ADD COLUMN thankyou_expect_col2_heading TEXT DEFAULT NULL,
  ADD COLUMN thankyou_expect_col2_content TEXT DEFAULT NULL,

  -- Column 3
  ADD COLUMN thankyou_expect_col3_image TEXT DEFAULT NULL,
  ADD COLUMN thankyou_expect_col3_heading TEXT DEFAULT NULL,
  ADD COLUMN thankyou_expect_col3_content TEXT DEFAULT NULL,

  -- CTA Button
  ADD COLUMN thankyou_cta_text TEXT DEFAULT 'Go Back To Homepage',
  ADD COLUMN thankyou_cta_url TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN campaign_landing_pages.thankyou_greeting IS
  'Greeting header for thank you page. Supports variables like {first_name}, {company_name}. Default: "Thanks {first_name}!"';

COMMENT ON COLUMN campaign_landing_pages.thankyou_content IS
  'Rich text content displayed below greeting. Supports HTML from RichTextEditor.';

COMMENT ON COLUMN campaign_landing_pages.thankyou_show_expect IS
  'Whether to show the "What To Expect" section on thank you page.';

COMMENT ON COLUMN campaign_landing_pages.thankyou_expect_heading IS
  'Section heading for "What To Expect" area. Hard-coded in design but configurable.';

COMMENT ON COLUMN campaign_landing_pages.thankyou_expect_col1_image IS
  'Image URL for first What To Expect column (278px height, 16px border radius per Figma).';

COMMENT ON COLUMN campaign_landing_pages.thankyou_expect_col1_heading IS
  'Heading text for first What To Expect column (30px bold, gray #484848).';

COMMENT ON COLUMN campaign_landing_pages.thankyou_expect_col1_content IS
  'Rich text content for first What To Expect column (16px medium, gray, 28px line-height).';

COMMENT ON COLUMN campaign_landing_pages.thankyou_expect_col2_image IS
  'Image URL for second What To Expect column (278px height, 16px border radius per Figma).';

COMMENT ON COLUMN campaign_landing_pages.thankyou_expect_col2_heading IS
  'Heading text for second What To Expect column (30px bold, gray #484848).';

COMMENT ON COLUMN campaign_landing_pages.thankyou_expect_col2_content IS
  'Rich text content for second What To Expect column (16px medium, gray, 28px line-height).';

COMMENT ON COLUMN campaign_landing_pages.thankyou_expect_col3_image IS
  'Image URL for third What To Expect column (278px height, 16px border radius per Figma).';

COMMENT ON COLUMN campaign_landing_pages.thankyou_expect_col3_heading IS
  'Heading text for third What To Expect column (30px bold, gray #484848).';

COMMENT ON COLUMN campaign_landing_pages.thankyou_expect_col3_content IS
  'Rich text content for third What To Expect column (16px medium, gray, 28px line-height).';

COMMENT ON COLUMN campaign_landing_pages.thankyou_cta_text IS
  'Text for the CTA button at bottom of thank you page. Default: "Go Back To Homepage"';

COMMENT ON COLUMN campaign_landing_pages.thankyou_cta_url IS
  'URL for CTA button. If null, defaults to company.website[0]. Opens in new window.';
