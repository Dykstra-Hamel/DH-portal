-- Seed data for Service Addresses, Customers, and Leads
-- This file creates comprehensive test data with realistic addresses and relationships
-- Run this AFTER the main seed.sql file has been executed

-- Clear existing data (be careful with this in production!)
DELETE FROM customer_service_addresses;
DELETE FROM leads WHERE created_at >= NOW() - INTERVAL '1 year';
DELETE FROM customers WHERE created_at >= NOW() - INTERVAL '1 year';
DELETE FROM service_addresses WHERE created_at >= NOW() - INTERVAL '1 year';

-- Reset sequences if needed
SELECT setval('customers_id_seq', COALESCE((SELECT MAX(id::INTEGER) FROM customers WHERE id ~ '^\d+$'), 1), false);
SELECT setval('leads_id_seq', COALESCE((SELECT MAX(id::INTEGER) FROM leads WHERE id ~ '^\d+$'), 1), false);
SELECT setval('service_addresses_id_seq', COALESCE((SELECT MAX(id::INTEGER) FROM service_addresses WHERE id ~ '^\d+$'), 1), false);

-- Get company IDs for random assignment
CREATE TEMP TABLE temp_companies AS
SELECT id, name, city, state FROM companies;

-- Address data arrays by region
CREATE TEMP TABLE temp_address_data AS VALUES
-- Michigan (Grand Rapids area)
('michigan', ARRAY['100', '234', '567', '890', '1234', '2345', '3456', '4567', '5678', '6789'],
 ARRAY['Main St', 'Oak Ave', 'Pine Rd', 'Cedar Dr', 'Maple Lane', 'Elm St', 'Cherry Ave', 'Birch Dr', 'Walnut St', 'Hickory Ave'],
 ARRAY['Grand Rapids', 'Wyoming', 'Kentwood', 'Walker', 'Grandville'],
 ARRAY['49503', '49519', '49508', '49544', '49418'],
 ARRAY[42.9634, 42.9132, 42.8694, 43.0007, 42.9097],
 ARRAY[-85.6681, -85.6556, -85.5553, -85.7443, -85.7631]),

-- Texas (Austin area)
('texas', ARRAY['123', '456', '789', '1011', '1213', '1415', '1617', '1819', '2021', '2223'],
 ARRAY['S Lamar Blvd', 'E 6th St', 'W Anderson Ln', 'S Congress Ave', 'E Cesar Chavez St', 'Burnet Rd', 'S 1st St', 'Guadalupe St', 'Red River St', 'Rainey St'],
 ARRAY['Austin', 'Cedar Park', 'Round Rock', 'Pflugerville', 'Leander'],
 ARRAY['78704', '78613', '78681', '78660', '78641'],
 ARRAY[30.2672, 30.5427, 30.5085, 30.4395, 30.5785],
 ARRAY[-97.7431, -97.8203, -97.6789, -97.6198, -97.8536]),

-- Oregon (Portland area)
('oregon', ARRAY['234', '567', '890', '1123', '1456', '1789', '2012', '2345', '2678', '2901'],
 ARRAY['NW 23rd Ave', 'SE Division St', 'NE Sandy Blvd', 'SW Capitol Hwy', 'N Mississippi Ave', 'SE Hawthorne Blvd', 'NE Alberta St', 'SE Belmont St', 'N Williams Ave', 'SW Burnside St'],
 ARRAY['Portland', 'Beaverton', 'Lake Oswego', 'Milwaukie', 'Oregon City'],
 ARRAY['97210', '97005', '97034', '97222', '97045'],
 ARRAY[45.5152, 45.4871, 45.4207, 45.4459, 45.3573],
 ARRAY[-122.6784, -122.8037, -122.6676, -122.6399, -122.6068]),

-- New York (NYC area)
('newyork', ARRAY['345', '678', '901', '1234', '1567', '1890', '2123', '2456', '2789', '3012'],
 ARRAY['Broadway', 'Park Ave', 'Madison Ave', 'Lexington Ave', '5th Ave', '3rd Ave', '2nd Ave', '1st Ave', 'Amsterdam Ave', 'Columbus Ave'],
 ARRAY['New York', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
 ARRAY['10005', '11201', '11101', '10451', '10301'],
 ARRAY[40.7128, 40.6782, 40.7282, 40.8176, 40.5795],
 ARRAY[-74.0060, -73.9442, -73.7949, -73.9482, -74.1502]),

-- Washington (Seattle area)
('washington', ARRAY['456', '789', '1012', '1345', '1678', '1901', '2234', '2567', '2890', '3123'],
 ARRAY['Pike St', 'Pine St', 'Capitol Hill', 'Queen Anne Ave', 'Fremont Ave', 'Ballard Ave', 'Georgetown Rd', 'Wallingford Ave', 'Greenwood Ave', 'Phinney Ave'],
 ARRAY['Seattle', 'Bellevue', 'Redmond', 'Kirkland', 'Bothell'],
 ARRAY['98101', '98004', '98052', '98033', '98011'],
 ARRAY[47.6062, 47.6101, 47.6740, 47.6815, 47.7620],
 ARRAY[-122.3321, -122.2015, -122.1215, -122.2087, -122.2054]),

-- Arizona (Phoenix area)
('arizona', ARRAY['567', '890', '1123', '1456', '1789', '2012', '2345', '2678', '2901', '3234'],
 ARRAY['E Camelback Rd', 'N Central Ave', 'W McDowell Rd', 'E Indian School Rd', 'N 7th St', 'E Thomas Rd', 'W Glendale Ave', 'E Van Buren St', 'N 16th St', 'W Roosevelt St'],
 ARRAY['Phoenix', 'Scottsdale', 'Tempe', 'Mesa', 'Chandler'],
 ARRAY['85001', '85251', '85281', '85201', '85224'],
 ARRAY[33.4484, 33.4942, 33.4255, 33.4152, 33.3061],
 ARRAY[-112.0740, -111.9261, -111.9400, -111.8315, -111.8413])
AS t(region, street_numbers, street_names, cities, zip_codes, latitudes, longitudes);

-- Function to get random array element
CREATE OR REPLACE FUNCTION get_random_array_element(arr ANYARRAY)
RETURNS ANYELEMENT AS $$
BEGIN
    RETURN arr[floor(random() * array_length(arr, 1) + 1)];
END;
$$ LANGUAGE plpgsql;

-- Function to get region for company
CREATE OR REPLACE FUNCTION get_company_region(company_state TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN company_state = 'Michigan' THEN 'michigan'
        WHEN company_state = 'Texas' THEN 'texas'
        WHEN company_state = 'Oregon' THEN 'oregon'
        WHEN company_state = 'New York' THEN 'newyork'
        WHEN company_state = 'Washington' THEN 'washington'
        WHEN company_state = 'Arizona' THEN 'arizona'
        ELSE 'texas' -- default fallback
    END;
END;
$$ LANGUAGE plpgsql;

-- Insert customers with billing addresses
INSERT INTO customers (
    id, company_id, first_name, last_name, email, phone,
    address, city, state, zip_code, latitude, longitude, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    company.id,
    first_names.name,
    last_names.name,
    LOWER(first_names.name || '.' || last_names.name || '@' ||
          CASE (random() * 4)::integer
              WHEN 0 THEN 'gmail.com'
              WHEN 1 THEN 'yahoo.com'
              WHEN 2 THEN 'hotmail.com'
              WHEN 3 THEN 'outlook.com'
              ELSE 'email.com'
          END),
    '(' || LPAD((random() * 899 + 100)::text, 3, '0') || ') ' ||
    LPAD((random() * 899 + 100)::text, 3, '0') || '-' ||
    LPAD((random() * 9999)::text, 4, '0'),
    get_random_array_element(addr.street_numbers) || ' ' || get_random_array_element(addr.street_names),
    get_random_array_element(addr.cities),
    company.state,
    get_random_array_element(addr.zip_codes),
    get_random_array_element(addr.latitudes) + (random() - 0.5) * 0.02, -- Add small random offset
    get_random_array_element(addr.longitudes) + (random() - 0.5) * 0.02,
    NOW() - (random() * interval '6 months'),
    NOW()
FROM
    temp_companies company
    CROSS JOIN temp_address_data addr
    CROSS JOIN (VALUES
        ('John'), ('Jane'), ('Michael'), ('Sarah'), ('David'), ('Lisa'), ('Chris'), ('Amanda'),
        ('Robert'), ('Jennifer'), ('William'), ('Jessica'), ('James'), ('Ashley'), ('Mark'), ('Emily'),
        ('Daniel'), ('Michelle'), ('Matthew'), ('Nicole'), ('Andrew'), ('Stephanie'), ('Joshua'), ('Angela'),
        ('Kenneth'), ('Melissa'), ('Paul'), ('Kimberly'), ('Steven'), ('Donna'), ('Timothy'), ('Carol')
    ) AS first_names(name)
    CROSS JOIN (VALUES
        ('Smith'), ('Johnson'), ('Williams'), ('Brown'), ('Jones'), ('Garcia'), ('Miller'), ('Davis'),
        ('Rodriguez'), ('Martinez'), ('Hernandez'), ('Lopez'), ('Gonzalez'), ('Wilson'), ('Anderson'), ('Thomas'),
        ('Taylor'), ('Moore'), ('Jackson'), ('Martin'), ('Lee'), ('Perez'), ('Thompson'), ('White'),
        ('Harris'), ('Sanchez'), ('Clark'), ('Ramirez'), ('Lewis'), ('Robinson'), ('Walker'), ('Young')
    ) AS last_names(name)
WHERE
    addr.region = get_company_region(company.state)
    AND random() < 0.25 -- Approximately 25% chance to create customer for each combination
LIMIT 120; -- Target around 120 customers total across all companies

-- Create a temp table with customer data for easy reference
CREATE TEMP TABLE temp_customers AS
SELECT
    c.id,
    c.company_id,
    c.first_name,
    c.last_name,
    comp.state as company_state
FROM customers c
JOIN temp_companies comp ON c.company_id = comp.id
WHERE c.created_at >= NOW() - INTERVAL '1 year';

-- Insert service addresses
INSERT INTO service_addresses (
    id, company_id, street_address, apartment_unit, address_line_2,
    city, state, zip_code, latitude, longitude, address_type, property_notes, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    customer.company_id,
    get_random_array_element(addr.street_numbers) || ' ' || get_random_array_element(addr.street_names),
    CASE WHEN random() < 0.3 THEN
        CASE (random() * 4)::integer
            WHEN 0 THEN 'Apt ' || (random() * 99 + 1)::integer
            WHEN 1 THEN 'Unit ' || (random() * 50 + 1)::integer
            WHEN 2 THEN 'Suite ' || (random() * 25 + 1)::integer
            ELSE '#' || (random() * 999 + 1)::integer
        END
    ELSE NULL END,
    CASE WHEN random() < 0.15 THEN
        CASE (random() * 3)::integer
            WHEN 0 THEN 'Building ' || CHR(65 + (random() * 25)::integer)
            WHEN 1 THEN 'Floor ' || (random() * 20 + 1)::integer
            ELSE 'Wing ' || CHR(65 + (random() * 3)::integer)
        END
    ELSE NULL END,
    get_random_array_element(addr.cities),
    customer.company_state,
    get_random_array_element(addr.zip_codes),
    get_random_array_element(addr.latitudes) + (random() - 0.5) * 0.05,
    get_random_array_element(addr.longitudes) + (random() - 0.5) * 0.05,
    CASE (random() * 4)::integer
        WHEN 0 THEN 'residential'
        WHEN 1 THEN 'commercial'
        WHEN 2 THEN 'industrial'
        ELSE 'mixed_use'
    END,
    CASE (random() * 8)::integer
        WHEN 0 THEN 'Gate code: ' || LPAD((random() * 9999)::text, 4, '0')
        WHEN 1 THEN 'Ring doorbell twice'
        WHEN 2 THEN 'Dog on property - friendly'
        WHEN 3 THEN 'Use side entrance'
        WHEN 4 THEN 'Call before arrival'
        WHEN 5 THEN 'Key under mat'
        WHEN 6 THEN 'Business hours only'
        ELSE NULL
    END,
    NOW() - (random() * interval '3 months'),
    NOW()
FROM
    temp_customers customer
    CROSS JOIN temp_address_data addr
WHERE
    addr.region = get_company_region(customer.company_state)
    AND random() < 0.8 -- 80% of customers get at least one service address
ORDER BY random()
LIMIT 180; -- Target around 180 service addresses total

-- Create additional service addresses for some customers (multiple properties)
INSERT INTO service_addresses (
    id, company_id, street_address, apartment_unit, address_line_2,
    city, state, zip_code, latitude, longitude, address_type, property_notes, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    customer.company_id,
    get_random_array_element(addr.street_numbers) || ' ' || get_random_array_element(addr.street_names),
    CASE WHEN random() < 0.4 THEN
        'Unit ' || (random() * 30 + 1)::integer
    ELSE NULL END,
    NULL,
    get_random_array_element(addr.cities),
    customer.company_state,
    get_random_array_element(addr.zip_codes),
    get_random_array_element(addr.latitudes) + (random() - 0.5) * 0.05,
    get_random_array_element(addr.longitudes) + (random() - 0.5) * 0.05,
    CASE (random() * 3)::integer
        WHEN 0 THEN 'residential'
        WHEN 1 THEN 'commercial'
        ELSE 'mixed_use'
    END,
    CASE (random() * 5)::integer
        WHEN 0 THEN 'Rental property'
        WHEN 1 THEN 'Vacation home'
        WHEN 2 THEN 'Business location'
        WHEN 3 THEN 'Investment property'
        ELSE 'Secondary residence'
    END,
    NOW() - (random() * interval '2 months'),
    NOW()
FROM
    temp_customers customer
    CROSS JOIN temp_address_data addr
WHERE
    addr.region = get_company_region(customer.company_state)
    AND random() < 0.3 -- 30% of customers get a second service address
ORDER BY random()
LIMIT 60; -- Additional service addresses for multiple properties

-- Create temp table with service addresses for easy reference
CREATE TEMP TABLE temp_service_addresses AS
SELECT
    sa.id,
    sa.company_id,
    sa.street_address,
    sa.city,
    sa.state,
    sa.latitude,
    sa.longitude
FROM service_addresses sa
WHERE sa.created_at >= NOW() - INTERVAL '1 year';

-- Link customers to their service addresses (customer_service_addresses table)
INSERT INTO customer_service_addresses (
    customer_id, service_address_id, relationship_type, is_primary_address, created_at, updated_at
)
SELECT DISTINCT ON (customer.id, sa.id)
    customer.id,
    sa.id,
    CASE (random() * 3)::integer
        WHEN 0 THEN 'owner'
        WHEN 1 THEN 'tenant'
        ELSE 'manager'
    END,
    ROW_NUMBER() OVER (PARTITION BY customer.id ORDER BY random()) = 1, -- First one is primary
    NOW() - (random() * interval '2 months'),
    NOW()
FROM
    temp_customers customer
    JOIN temp_service_addresses sa ON customer.company_id = sa.company_id
WHERE
    random() < 0.7 -- 70% chance of linking customer to each potential service address
ORDER BY customer.id, sa.id
LIMIT 200; -- Reasonable number of relationships

-- Insert leads with mixed scenarios
INSERT INTO leads (
    id, company_id, customer_id, service_address_id, lead_source, lead_type, service_type,
    lead_status, comments, assigned_to, last_contacted_at, next_follow_up_at, estimated_value, priority,
    utm_source, utm_medium, utm_campaign, created_at, updated_at
)
-- Scenario A: Leads with service addresses (70%)
SELECT
    gen_random_uuid(),
    sa.company_id,
    customer.id,
    sa.id,
    CASE (random() * 11)::integer
        WHEN 0 THEN 'organic'
        WHEN 1 THEN 'referral'
        WHEN 2 THEN 'google_cpc'
        WHEN 3 THEN 'facebook_ads'
        WHEN 4 THEN 'linkedin'
        WHEN 5 THEN 'email_campaign'
        WHEN 6 THEN 'cold_call'
        WHEN 7 THEN 'trade_show'
        WHEN 8 THEN 'webinar'
        WHEN 9 THEN 'content_marketing'
        ELSE 'other'
    END,
    CASE (random() * 6)::integer
        WHEN 0 THEN 'phone_call'
        WHEN 1 THEN 'web_form'
        WHEN 2 THEN 'email'
        WHEN 3 THEN 'chat'
        WHEN 4 THEN 'social_media'
        ELSE 'in_person'
    END,
    CASE (random() * 6)::integer
        WHEN 0 THEN 'Residential Pest Control'
        WHEN 1 THEN 'Commercial Pest Control'
        WHEN 2 THEN 'Termite Treatment'
        WHEN 3 THEN 'Rodent Control'
        WHEN 4 THEN 'Ant Control'
        ELSE 'General Pest Control'
    END,
    CASE (random() * 6)::integer
        WHEN 0 THEN 'unassigned'
        WHEN 1 THEN 'contacting'
        WHEN 2 THEN 'quoted'
        WHEN 3 THEN 'ready_to_schedule'
        WHEN 4 THEN 'scheduled'
        ELSE 'won'
    END,
    CASE (random() * 5)::integer
        WHEN 0 THEN 'Customer reported ant problem in kitchen'
        WHEN 1 THEN 'Needs quarterly pest control service'
        WHEN 2 THEN 'Termite inspection requested'
        WHEN 3 THEN 'Follow-up from previous service'
        ELSE 'New customer inquiry'
    END,
    NULL, -- assigned_to (will be NULL for now)
    CASE WHEN random() < 0.6 THEN NOW() - (random() * interval '30 days') ELSE NULL END,
    CASE WHEN random() < 0.4 THEN NOW() + (random() * interval '14 days') ELSE NULL END,
    (random() * 800 + 100)::numeric(10,2), -- $100-$900
    CASE (random() * 3)::integer
        WHEN 0 THEN 'low'
        WHEN 1 THEN 'medium'
        WHEN 2 THEN 'high'
        ELSE 'urgent'
    END,
    CASE WHEN random() < 0.3 THEN 'google' ELSE NULL END,
    CASE WHEN random() < 0.3 THEN 'cpc' ELSE NULL END,
    CASE WHEN random() < 0.2 THEN 'spring-campaign-2024' ELSE NULL END,
    NOW() - (random() * interval '90 days'),
    NOW()
FROM
    temp_service_addresses sa
    JOIN customer_service_addresses csa ON sa.id = csa.service_address_id
    JOIN temp_customers customer ON csa.customer_id = customer.id
WHERE
    random() < 0.35 -- Creates approximately 70% of leads with service addresses
ORDER BY random()
LIMIT 200

UNION ALL

-- Scenario B: Leads with customers but NO service addresses (20%)
SELECT
    gen_random_uuid(),
    customer.company_id,
    customer.id,
    NULL, -- No service address
    CASE (random() * 11)::integer
        WHEN 0 THEN 'organic'
        WHEN 1 THEN 'referral'
        WHEN 2 THEN 'google_cpc'
        WHEN 3 THEN 'facebook_ads'
        WHEN 4 THEN 'linkedin'
        WHEN 5 THEN 'email_campaign'
        WHEN 6 THEN 'cold_call'
        WHEN 7 THEN 'trade_show'
        WHEN 8 THEN 'webinar'
        WHEN 9 THEN 'content_marketing'
        ELSE 'other'
    END,
    CASE (random() * 6)::integer
        WHEN 0 THEN 'phone_call'
        WHEN 1 THEN 'web_form'
        WHEN 2 THEN 'email'
        WHEN 3 THEN 'chat'
        WHEN 4 THEN 'social_media'
        ELSE 'in_person'
    END,
    CASE (random() * 4)::integer
        WHEN 0 THEN 'Residential Pest Control'
        WHEN 1 THEN 'Ant Control'
        WHEN 2 THEN 'Rodent Control'
        ELSE 'General Pest Control'
    END,
    CASE (random() * 5)::integer
        WHEN 0 THEN 'unassigned'
        WHEN 1 THEN 'contacting'
        WHEN 2 THEN 'quoted'
        WHEN 3 THEN 'ready_to_schedule'
        ELSE 'scheduled'
    END,
    'Initial inquiry - no service address setup yet',
    NULL,
    CASE WHEN random() < 0.5 THEN NOW() - (random() * interval '14 days') ELSE NULL END,
    CASE WHEN random() < 0.6 THEN NOW() + (random() * interval '7 days') ELSE NULL END,
    (random() * 500 + 150)::numeric(10,2),
    CASE (random() * 2)::integer
        WHEN 0 THEN 'medium'
        ELSE 'high'
    END,
    NULL, NULL, NULL,
    NOW() - (random() * interval '30 days'),
    NOW()
FROM
    temp_customers customer
WHERE
    random() < 0.4 -- Creates leads for some customers without service addresses
ORDER BY random()
LIMIT 60

UNION ALL

-- Scenario C: Minimal data leads - no customer, no service address (10%)
SELECT
    gen_random_uuid(),
    (SELECT id FROM temp_companies ORDER BY random() LIMIT 1), -- Random company
    NULL, -- No customer
    NULL, -- No service address
    CASE (random() * 5)::integer
        WHEN 0 THEN 'organic'
        WHEN 1 THEN 'google_cpc'
        WHEN 2 THEN 'cold_call'
        WHEN 3 THEN 'referral'
        ELSE 'other'
    END,
    CASE (random() * 3)::integer
        WHEN 0 THEN 'phone_call'
        WHEN 1 THEN 'web_form'
        ELSE 'email'
    END,
    'General Pest Control',
    'unassigned',
    'Quick inquiry - limited information',
    NULL,
    NULL,
    CASE WHEN random() < 0.3 THEN NOW() + (random() * interval '3 days') ELSE NULL END,
    (random() * 300 + 75)::numeric(10,2),
    'low',
    NULL, NULL, NULL,
    NOW() - (random() * interval '7 days'),
    NOW()
FROM generate_series(1, 30) -- Generate 30 minimal leads
ORDER BY random();

-- Clean up helper functions
DROP FUNCTION IF EXISTS get_random_array_element(ANYARRAY);
DROP FUNCTION IF EXISTS get_company_region(TEXT);

-- Display summary of seeded data
SELECT
    'Service Address Seeding Complete!' as message,
    NOW() as timestamp;

-- Show what was created
SELECT
    'customers' as table_name,
    COUNT(*) as record_count,
    'Customers with billing addresses distributed across companies' as description
FROM customers
WHERE created_at >= NOW() - INTERVAL '1 year'

UNION ALL

SELECT
    'service_addresses' as table_name,
    COUNT(*) as record_count,
    'Service addresses with coordinates and property details' as description
FROM service_addresses
WHERE created_at >= NOW() - INTERVAL '1 year'

UNION ALL

SELECT
    'customer_service_addresses' as table_name,
    COUNT(*) as record_count,
    'Customer-to-service-address relationships established' as description
FROM customer_service_addresses
WHERE created_at >= NOW() - INTERVAL '1 year'

UNION ALL

SELECT
    'leads' as table_name,
    COUNT(*) as record_count,
    'Leads with mixed service address scenarios for testing' as description
FROM leads
WHERE created_at >= NOW() - INTERVAL '1 year';

-- Show breakdown by company
SELECT
    c.name as company_name,
    COUNT(DISTINCT cust.id) as customers,
    COUNT(DISTINCT sa.id) as service_addresses,
    COUNT(DISTINCT l.id) as leads,
    COUNT(DISTINCT CASE WHEN l.service_address_id IS NOT NULL THEN l.id END) as leads_with_service_address,
    COUNT(DISTINCT CASE WHEN l.service_address_id IS NULL AND l.customer_id IS NOT NULL THEN l.id END) as leads_customer_only,
    COUNT(DISTINCT CASE WHEN l.service_address_id IS NULL AND l.customer_id IS NULL THEN l.id END) as leads_minimal_data
FROM companies c
LEFT JOIN customers cust ON c.id = cust.company_id AND cust.created_at >= NOW() - INTERVAL '1 year'
LEFT JOIN service_addresses sa ON c.id = sa.company_id AND sa.created_at >= NOW() - INTERVAL '1 year'
LEFT JOIN leads l ON c.id = l.company_id AND l.created_at >= NOW() - INTERVAL '1 year'
GROUP BY c.id, c.name
ORDER BY c.name;

-- Test different address scenarios
SELECT
    'Testing Scenarios' as summary_type,
    'Service Address System' as scenario_name,
    COUNT(*) as count
FROM leads l
JOIN service_addresses sa ON l.service_address_id = sa.id
WHERE l.created_at >= NOW() - INTERVAL '1 year'

UNION ALL

SELECT
    'Testing Scenarios' as summary_type,
    'Customer Billing Fallback' as scenario_name,
    COUNT(*) as count
FROM leads l
JOIN customers c ON l.customer_id = c.id
WHERE l.service_address_id IS NULL
    AND l.customer_id IS NOT NULL
    AND l.created_at >= NOW() - INTERVAL '1 year'

UNION ALL

SELECT
    'Testing Scenarios' as summary_type,
    'Minimal Data (No Address)' as scenario_name,
    COUNT(*) as count
FROM leads l
WHERE l.service_address_id IS NULL
    AND l.customer_id IS NULL
    AND l.created_at >= NOW() - INTERVAL '1 year';

SELECT
    'Seed data generation completed successfully! You now have comprehensive test data with:' ||
    E'\n- Customers with billing addresses (kept for billing purposes)' ||
    E'\n- Service addresses with coordinates (for service locations)' ||
    E'\n- Leads with mixed scenarios (70% service address, 20% customer fallback, 10% minimal)' ||
    E'\n- Geographic distribution matching company locations' ||
    E'\n- Realistic relationships and edge cases for testing' as final_summary;