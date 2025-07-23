-- Enable address autocomplete for test companies
-- Run this to enable Google Places API testing

UPDATE companies 
SET widget_config = COALESCE(widget_config, '{}'::jsonb) || 
    jsonb_build_object(
        'addressApi', 
        jsonb_build_object(
            'enabled', true,
            'maxSuggestions', 5
        )
    )
WHERE id IN (
    '22222222-2222-2222-2222-222222222222',  -- Guardian Pest Control
    '11111111-1111-1111-1111-111111111111',  -- Elite Pest Solutions
    '33333333-3333-3333-3333-333333333333',  -- Green Shield Exterminators
    '44444444-4444-4444-4444-444444444444',  -- Metro Bug Busters
    '55555555-5555-5555-5555-555555555555',  -- Pacific Pest Professionals
    '66666666-6666-6666-6666-666666666666'   -- Apex Termite & Pest
);

-- Verify the update
SELECT 
    id,
    name,
    widget_config -> 'addressApi' as address_api_config
FROM companies 
WHERE id IN (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666'
);