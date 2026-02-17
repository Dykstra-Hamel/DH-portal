-- Add CAM (Campaigns) as a valid project type code and allow SFT in subtype mappings

-- Update projects.type_code constraint to allow CAM
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_type_code_check;

ALTER TABLE projects
ADD CONSTRAINT projects_type_code_check
CHECK (type_code IS NULL OR type_code IN ('WEB', 'SOC', 'EML', 'PRT', 'VEH', 'DIG', 'ADS', 'CAM', 'SFT'));

-- Update project_type_subtypes constraint to allow CAM and SFT
ALTER TABLE project_type_subtypes
DROP CONSTRAINT IF EXISTS valid_project_type;

ALTER TABLE project_type_subtypes
ADD CONSTRAINT valid_project_type
CHECK (project_type IN ('WEB', 'SOC', 'EML', 'PRT', 'VEH', 'DIG', 'ADS', 'CAM', 'SFT'));
