ALTER TABLE campaign_landing_pages
  ADD COLUMN show_pre_footer BOOLEAN DEFAULT TRUE,
  ADD COLUMN pre_footer_content TEXT DEFAULT NULL;

COMMENT ON COLUMN campaign_landing_pages.show_pre_footer IS 'Whether to show the pre-footer section on the landing page';
COMMENT ON COLUMN campaign_landing_pages.pre_footer_content IS 'Rich text HTML content for the pre-footer section';
