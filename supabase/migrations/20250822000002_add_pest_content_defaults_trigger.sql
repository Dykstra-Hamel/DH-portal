-- Create a function to set default pest content based on pest type
CREATE OR REPLACE FUNCTION set_default_pest_content()
RETURNS TRIGGER AS $$
DECLARE
  pest_slug TEXT;
BEGIN
  -- Get the pest type slug for the new record
  SELECT pt.slug INTO pest_slug
  FROM pest_types pt
  WHERE pt.id = NEW.pest_id;

  -- Set default how_we_do_it_text if not provided
  IF NEW.how_we_do_it_text IS NULL THEN
    NEW.how_we_do_it_text := CASE pest_slug
      WHEN 'ants' THEN 'We use eco-friendly treatments with strategically placed baits inside, and a protective exterior barrier to stop them from coming back.'
      WHEN 'spiders' THEN 'We target webs and breeding areas with safe treatments, focusing on entry points and hiding spots.'
      WHEN 'cockroaches' THEN 'We use targeted gel baits and crack-and-crevice treatments to eliminate cockroaches at their source and prevent future infestations.'
      WHEN 'wasps' THEN 'We safely remove nests and apply treatments to prevent wasps from returning to nesting areas around your property.'
      WHEN 'rodents' THEN 'We use a combination of exclusion methods, trapping, and strategic baiting to eliminate rodents and prevent re-entry.'
      WHEN 'termites' THEN 'We conduct thorough inspections and apply targeted treatments to eliminate termites and protect your structure from future damage.'
      WHEN 'others' THEN 'We use targeted treatments specific to your pest issue, focusing on elimination and long-term prevention.'
      ELSE 'We use professional-grade treatments tailored to your specific pest problem, ensuring effective elimination and prevention.'
    END;
  END IF;

  -- Set default subspecies if not provided or empty
  IF NEW.subspecies IS NULL OR NEW.subspecies = '[]'::jsonb THEN
    NEW.subspecies := CASE pest_slug
      WHEN 'ants' THEN '["Carpenter Ants", "Sugar Ants", "Pavement Ants", "Odorous House Ants", "Fire Ants", "Little Black Ants"]'::jsonb
      WHEN 'spiders' THEN '["House Spiders", "Black Widow Spiders", "Brown Recluse Spiders", "Wolf Spiders", "Jumping Spiders", "Orb Weaver Spiders"]'::jsonb
      WHEN 'cockroaches' THEN '["German Cockroaches", "American Cockroaches", "Oriental Cockroaches", "Brown-banded Cockroaches", "Smokybrown Cockroaches", "Wood Cockroaches"]'::jsonb
      WHEN 'wasps' THEN '["Paper Wasps", "Yellow Jackets", "Hornets", "Mud Daubers", "Cicada Killers", "Bald-faced Hornets"]'::jsonb
      WHEN 'rodents' THEN '["House Mice", "Norway Rats", "Roof Rats", "Deer Mice", "White-footed Mice", "Voles"]'::jsonb
      WHEN 'termites' THEN '["Subterranean Termites", "Drywood Termites", "Dampwood Termites", "Formosan Termites", "Conehead Termites", "Desert Termites"]'::jsonb
      WHEN 'others' THEN '["Earwigs", "Silverfish", "Boxelder Bugs", "Stink Bugs", "Centipedes", "Millipedes"]'::jsonb
      ELSE '[]'::jsonb
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set defaults on INSERT
CREATE OR REPLACE TRIGGER set_pest_content_defaults
  BEFORE INSERT ON company_pest_options
  FOR EACH ROW
  EXECUTE FUNCTION set_default_pest_content();

-- Update any existing records that don't have defaults (in case some companies already exist)
UPDATE company_pest_options 
SET how_we_do_it_text = (
  CASE pt.slug
    WHEN 'ants' THEN 'We use eco-friendly treatments with strategically placed baits inside, and a protective exterior barrier to stop them from coming back.'
    WHEN 'spiders' THEN 'We target webs and breeding areas with safe treatments, focusing on entry points and hiding spots.'
    WHEN 'cockroaches' THEN 'We use targeted gel baits and crack-and-crevice treatments to eliminate cockroaches at their source and prevent future infestations.'
    WHEN 'wasps' THEN 'We safely remove nests and apply treatments to prevent wasps from returning to nesting areas around your property.'
    WHEN 'rodents' THEN 'We use a combination of exclusion methods, trapping, and strategic baiting to eliminate rodents and prevent re-entry.'
    WHEN 'termites' THEN 'We conduct thorough inspections and apply targeted treatments to eliminate termites and protect your structure from future damage.'
    WHEN 'others' THEN 'We use targeted treatments specific to your pest issue, focusing on elimination and long-term prevention.'
    ELSE 'We use professional-grade treatments tailored to your specific pest problem, ensuring effective elimination and prevention.'
  END
)
FROM pest_types pt
WHERE pt.id = company_pest_options.pest_id
  AND (company_pest_options.how_we_do_it_text IS NULL OR company_pest_options.how_we_do_it_text = '');

-- Update existing subspecies
UPDATE company_pest_options 
SET subspecies = (
  CASE pt.slug
    WHEN 'ants' THEN '["Carpenter Ants", "Sugar Ants", "Pavement Ants", "Odorous House Ants", "Fire Ants", "Little Black Ants"]'::jsonb
    WHEN 'spiders' THEN '["House Spiders", "Black Widow Spiders", "Brown Recluse Spiders", "Wolf Spiders", "Jumping Spiders", "Orb Weaver Spiders"]'::jsonb
    WHEN 'cockroaches' THEN '["German Cockroaches", "American Cockroaches", "Oriental Cockroaches", "Brown-banded Cockroaches", "Smokybrown Cockroaches", "Wood Cockroaches"]'::jsonb
    WHEN 'wasps' THEN '["Paper Wasps", "Yellow Jackets", "Hornets", "Mud Daubers", "Cicada Killers", "Bald-faced Hornets"]'::jsonb
    WHEN 'rodents' THEN '["House Mice", "Norway Rats", "Roof Rats", "Deer Mice", "White-footed Mice", "Voles"]'::jsonb
    WHEN 'termites' THEN '["Subterranean Termites", "Drywood Termites", "Dampwood Termites", "Formosan Termites", "Conehead Termites", "Desert Termites"]'::jsonb
    WHEN 'others' THEN '["Earwigs", "Silverfish", "Boxelder Bugs", "Stink Bugs", "Centipedes", "Millipedes"]'::jsonb
    ELSE '[]'::jsonb
  END
)
FROM pest_types pt
WHERE pt.id = company_pest_options.pest_id
  AND (company_pest_options.subspecies IS NULL OR company_pest_options.subspecies = '[]'::jsonb);