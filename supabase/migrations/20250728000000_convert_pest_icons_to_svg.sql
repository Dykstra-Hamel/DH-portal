-- Migration: Convert pest icon_url field to icon_svg with SVG content
-- This migration renames the icon_url field to icon_svg and converts existing emoji data to SVG

-- First, add the new icon_svg column
ALTER TABLE pest_types ADD COLUMN icon_svg TEXT;

-- Convert existing emoji icons to simple SVG representations
UPDATE pest_types SET icon_svg = CASE 
    WHEN icon_url = '🐜' THEN '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 8c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm16 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm-8 2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2s2-.9 2-2v-6c0-1.1-.9-2-2-2zm-4 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>'
    WHEN icon_url = '🕷️' THEN '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-8-2c0-.6.4-1 1-1h2c.6 0 1 .4 1 1s-.4 1-1 1H5c-.6 0-1-.4-1-1zm12 0c0-.6.4-1 1-1h2c.6 0 1 .4 1 1s-.4 1-1 1h-2c-.6 0-1-.4-1-1zM8 6c0-.6.4-1 1-1h6c.6 0 1 .4 1 1s-.4 1-1 1H9c-.6 0-1-.4-1-1zm0 12c0-.6.4-1 1-1h6c.6 0 1 .4 1 1s-.4 1-1 1H9c-.6 0-1-.4-1-1zm-4-6v-2l2-2h2v2l-2 2H4zm16 0h-2l-2-2V6h2l2 2v2z"/></svg>'
    WHEN icon_url = '🪳' THEN '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18 6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2s2-.9 2-2V8c0-1.1-.9-2-2-2zm-4 0c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2s2-.9 2-2V8c0-1.1-.9-2-2-2zm-4 0c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2s2-.9 2-2V8c0-1.1-.9-2-2-2zM6 6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2s2-.9 2-2V8c0-1.1-.9-2-2-2zm6-4c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4zm0 16c2.2 0 4-1.8 4-4H8c0 2.2 1.8 4 4 4z"/></svg>'
    WHEN icon_url = '🐝' THEN '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c-1.1 0-2 .9-2 2 0 .5.2 1 .5 1.3L9 7H7c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2l1.5 1.7c-.3.3-.5.8-.5 1.3 0 1.1.9 2 2 2s2-.9 2-2c0-.5-.2-1-.5-1.3L15 13h2c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2h-2l-1.5-1.7c.3-.3.5-.8.5-1.3 0-1.1-.9-2-2-2zm0 2c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm0 14c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/></svg>'
    WHEN icon_url = '🐭' THEN '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.7 2 6 4.7 6 8v2c0 3.3 2.7 6 6 6s6-2.7 6-6V8c0-3.3-2.7-6-6-6zM8 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm8 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm16 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zM12 18c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4z"/></svg>'
    WHEN icon_url = '🐛' THEN '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c-3.3 0-6 2.7-6 6v8c0 3.3 2.7 6 6 6s6-2.7 6-6V8c0-3.3-2.7-6-6-6zm-2 4c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm4 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zM8 10h8v2H8v-2zm0 4h8v2H8v-2z"/></svg>'
    WHEN icon_url = '🦗' THEN '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 4c-2.2 0-4 1.8-4 4v4c0 2.2 1.8 4 4 4s4-1.8 4-4V8c0-2.2-1.8-4-4-4zm-1 4c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm2 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zM6 12l-4 2v2l4-2v-2zm12 0v2l4 2v-2l-4-2zM4 16l2 2h2l-2-2H4zm16 0h-2l-2 2h2l2-2z"/></svg>'
    ELSE '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8"/></svg>'
END
WHERE icon_url IS NOT NULL;

-- Set default SVG for any NULL values
UPDATE pest_types SET icon_svg = '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8"/></svg>' 
WHERE icon_svg IS NULL;

-- Drop the old icon_url column
ALTER TABLE pest_types DROP COLUMN icon_url;

-- Add NOT NULL constraint to icon_svg
ALTER TABLE pest_types ALTER COLUMN icon_svg SET NOT NULL;

-- Add a comment to the column
COMMENT ON COLUMN pest_types.icon_svg IS 'SVG markup for pest icon display';