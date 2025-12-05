-- Add FAQ support to add-on services
-- This allows each add-on to have its own set of FAQs that can be displayed
-- in the campaign landing page FAQ section

ALTER TABLE add_on_services
ADD COLUMN addon_faqs JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN add_on_services.addon_faqs IS
'FAQ items specific to this add-on service. Format: [{"question": "...", "answer": "..."}]';
