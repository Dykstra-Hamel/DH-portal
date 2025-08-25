-- Add How We Do It content system for pest-specific information
-- This adds fields for pest-specific treatment descriptions and subspecies

-- Add new columns to company_pest_options table
ALTER TABLE company_pest_options 
ADD COLUMN how_we_do_it_text TEXT,
ADD COLUMN subspecies JSONB DEFAULT '[]'::jsonb;

-- Insert default "How We Do It" content for each pest type
UPDATE company_pest_options 
SET how_we_do_it_text = CASE 
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'ants'
    ) THEN 'We use eco-friendly treatments with strategically placed baits inside, and a protective exterior barrier to stop them from coming back.'
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'spiders'
    ) THEN 'We target webs and breeding areas with safe treatments, focusing on entry points and hiding spots.'
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'cockroaches'
    ) THEN 'We use targeted gel baits and crack-and-crevice treatments to eliminate cockroaches at their source and prevent future infestations.'
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'wasps'
    ) THEN 'We safely remove nests and apply treatments to prevent wasps from returning to nesting areas around your property.'
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'rodents'
    ) THEN 'We use a combination of exclusion methods, trapping, and strategic baiting to eliminate rodents and prevent re-entry.'
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'termites'
    ) THEN 'We conduct thorough inspections and apply targeted treatments to eliminate termites and protect your structure from future damage.'
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'others'
    ) THEN 'We use targeted treatments specific to your pest issue, focusing on elimination and long-term prevention.'
    
    ELSE 'We use professional-grade treatments tailored to your specific pest problem, ensuring effective elimination and prevention.'
END
WHERE how_we_do_it_text IS NULL;

-- Insert default subspecies for each pest type
UPDATE company_pest_options 
SET subspecies = CASE 
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'ants'
    ) THEN '["Ants species 1", "Ants species 2", "Ants species 3", "Ants species 4", "Ants species 5", "Ants species 6"]'::jsonb
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'spiders'
    ) THEN '["Spider species 1", "Spider species 2", "Spider species 3", "Spider species 4", "Spider species 5", "Spider species 6"]'::jsonb
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'cockroaches'
    ) THEN '["Cockroach species 1", "Cockroach species 2", "Cockroach species 3", "Cockroach species 4", "Cockroach species 5", "Cockroach species 6"]'::jsonb
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'wasps'
    ) THEN '["Wasp species 1", "Wasp species 2", "Wasp species 3", "Wasp species 4", "Wasp species 5", "Wasp species 6"]'::jsonb
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'rodents'
    ) THEN '["Rodent species 1", "Rodent species 2", "Rodent species 3", "Rodent species 4", "Rodent species 5", "Rodent species 6"]'::jsonb
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'termites'
    ) THEN '["Termite species 1", "Termite species 2", "Termite species 3", "Termite species 4", "Termite species 5", "Termite species 6"]'::jsonb
    
    WHEN EXISTS (
        SELECT 1 FROM pest_types 
        WHERE pest_types.id = company_pest_options.pest_id 
        AND pest_types.slug = 'others'
    ) THEN '["Other pest 1", "Other pest 2", "Other pest 3", "Other pest 4", "Other pest 5", "Other pest 6"]'::jsonb
    
    ELSE '[]'::jsonb
END
WHERE subspecies = '[]'::jsonb OR subspecies IS NULL;

-- Create index for JSONB subspecies field for better query performance
CREATE INDEX IF NOT EXISTS idx_company_pest_options_subspecies ON company_pest_options USING GIN (subspecies);