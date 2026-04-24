ALTER TABLE company_pest_options
ADD COLUMN settings JSONB NOT NULL DEFAULT '{}'::jsonb;
