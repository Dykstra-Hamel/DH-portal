-- Add Google Drive link field for photography section
ALTER TABLE brands
ADD COLUMN photography_google_drive_link TEXT;

COMMENT ON COLUMN brands.photography_google_drive_link IS 'Google Drive folder/album link for additional photography resources';
