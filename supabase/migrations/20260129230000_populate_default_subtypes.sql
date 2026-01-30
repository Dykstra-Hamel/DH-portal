-- Populate project_type_subtypes with legacy hardcoded subtypes
-- This ensures backward compatibility with existing projects

-- Print Media (PRT) Subtypes
INSERT INTO project_type_subtypes (project_type, name, description, sort_order) VALUES
('PRT', 'Billboard', 'Large outdoor advertising display', 1),
('PRT', 'Business Cards', 'Professional business card designs', 2),
('PRT', 'Door Hangers', 'Promotional door hanger materials', 3),
('PRT', 'Lawn Sign', 'Outdoor lawn and yard signage', 4),
('PRT', 'Postcard', 'Direct mail postcard designs', 5),
('PRT', 'Vehicle Wrap', 'Vehicle wrap and graphics', 6),
('PRT', 'Other', 'Other print media projects', 7);

-- Digital Designs (DIG) Subtypes
INSERT INTO project_type_subtypes (project_type, name, description, sort_order) VALUES
('DIG', 'Digital Billboard', 'Digital outdoor advertising displays', 1),
('DIG', 'Display Ads', 'Online display advertisement designs', 2),
('DIG', 'Logo Design', 'Brand logo and identity design', 3),
('DIG', 'Social Images', 'Social media graphics and images', 4),
('DIG', 'Video', 'Video content and motion graphics', 5),
('DIG', 'Website Design', 'Website layout and design work', 6),
('DIG', 'Other', 'Other digital design projects', 7);

-- Update existing projects to use the new capitalized format
-- This converts old lowercase/underscore format to the new display format
UPDATE projects SET project_subtype = 'Billboard' WHERE project_subtype = 'billboard';
UPDATE projects SET project_subtype = 'Business Cards' WHERE project_subtype = 'business_cards';
UPDATE projects SET project_subtype = 'Door Hangers' WHERE project_subtype = 'door_hangers';
UPDATE projects SET project_subtype = 'Lawn Sign' WHERE project_subtype = 'lawn_sign';
UPDATE projects SET project_subtype = 'Postcard' WHERE project_subtype = 'postcard';
UPDATE projects SET project_subtype = 'Vehicle Wrap' WHERE project_subtype = 'vehicle_wrap';
UPDATE projects SET project_subtype = 'Digital Billboard' WHERE project_subtype = 'digital_billboard';
UPDATE projects SET project_subtype = 'Display Ads' WHERE project_subtype = 'display_ads';
UPDATE projects SET project_subtype = 'Logo Design' WHERE project_subtype = 'logo_design';
UPDATE projects SET project_subtype = 'Social Images' WHERE project_subtype = 'social_images';
UPDATE projects SET project_subtype = 'Video' WHERE project_subtype = 'video';
UPDATE projects SET project_subtype = 'Website Design' WHERE project_subtype = 'website_design';
UPDATE projects SET project_subtype = 'Other' WHERE project_subtype = 'other' AND (project_type = 'print' OR project_type = 'digital');
