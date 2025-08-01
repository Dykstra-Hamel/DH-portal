-- Seed data for DH Portal local development
-- Only includes Companies, Brands, and Projects (no user assignments)

-- Insert companies (pest control businesses)
INSERT INTO companies (id, name, description, website, email, phone, address, city, state, zip_code, country, industry, size, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Elite Pest Solutions', 'Professional pest control services specializing in residential and commercial extermination, prevention, and integrated pest management.', 'https://elitepestsolutions.com', 'info@elitepestsolutions.com', '(555) 123-4567', '123 Exterminator Blvd', 'Grand Rapids', 'Michigan', '49503', 'United States', 'Pest Control', '10-50', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'Guardian Pest Control', 'Advanced pest control technology and eco-friendly solutions for homes and businesses across Texas.', 'https://guardianpest.com', 'hello@guardianpest.com', '(555) 987-6543', '456 Pest Control Ave', 'Austin', 'Texas', '78701', 'United States', 'Pest Control', '50-100', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'Green Shield Exterminators', 'Sustainable and organic pest control solutions with a focus on environmental safety and family protection.', 'https://greenshieldpest.com', 'contact@greenshieldpest.com', '(555) 456-7890', '789 Green Way', 'Portland', 'Oregon', '97201', 'United States', 'Pest Control', '25-50', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'Metro Bug Busters', 'Full-service urban pest control specialists handling everything from bed bugs to rodent infestations in the metro area.', 'https://metrobugbusters.com', 'support@metrobugbusters.com', '(555) 321-0987', '321 Pest Control Plaza', 'New York', 'New York', '10005', 'United States', 'Pest Control', '100-200', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'Pacific Pest Professionals', 'Premium pest control services for the Pacific Northwest, specializing in carpenter ants, termites, and moisture control.', 'https://pacificpestpro.com', 'service@pacificpestpro.com', '(555) 654-3210', '987 Pacific Lane', 'Seattle', 'Washington', '98101', 'United States', 'Pest Control', '75-100', NOW(), NOW()),
('66666666-6666-6666-6666-666666666666', 'Apex Termite & Pest', 'Comprehensive termite inspection and pest control services with advanced treatment technologies.', 'https://apextermite.com', 'info@apextermite.com', '(555) 888-9999', '123 Termite Blvd', 'Phoenix', 'Arizona', '85001', 'United States', 'Pest Control', '15-25', NOW(), NOW());

-- Insert brands with comprehensive branding data
INSERT INTO brands (
    id, 
    company_id, 
    brand_guidelines, 
    brand_strategy, 
    personality,
    logo_url,
    logo_description,
    primary_color_hex,
    primary_color_cmyk,
    primary_color_pantone,
    secondary_color_hex,
    secondary_color_cmyk,
    secondary_color_pantone,
    alternative_colors,
    font_primary_name,
    font_primary_example,
    font_primary_url,
    font_secondary_name,
    font_secondary_example,
    font_secondary_url,
    photography_description,
    photography_images,
    created_at,
    updated_at
) VALUES
('a1a1a001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 
'Professional, trustworthy pest control brand emphasizing reliability, expertise, and safety. Clean design with bold, confident typography to instill customer confidence.',
'Position Elite Pest Solutions as the premium choice for reliable, effective pest control with exceptional customer service.',
'Professional, reliable, safe, expert, trustworthy.',
'https://elitepestsolutions.com/brand/logo-primary.svg',
'Shield-based logo with clean typography representing protection and reliability.',
'#1B365D', '85,70,0,65', 'Navy Blue',
'#FF6B00', '0,70,100,0', 'Safety Orange',
'[{"hex": "#F8F9FA", "cmyk": "3,2,3,0", "pantone": "Cool Gray 1 C", "name": "Light Gray"}, {"hex": "#343A40", "cmyk": "0,0,0,85", "pantone": "Black 6 C", "name": "Dark Gray"}, {"hex": "#28A745", "cmyk": "70,0,100,0", "pantone": "355 C", "name": "Success Green"}]',
'Montserrat', 'Montserrat Bold 24px - Professional and trustworthy for headings', 'https://fonts.google.com/specimen/Montserrat',
'Inter', 'Inter Regular 16px - Clean and readable for body text', 'https://fonts.google.com/specimen/Inter',
'Professional service photography showing technicians at work, before/after results, and happy customers in clean home environments.',
'[{"url": "https://elitepestsolutions.com/brand/service1.jpg", "description": "Professional technician treating home exterior"}, {"url": "https://elitepestsolutions.com/brand/results1.jpg", "description": "Clean, pest-free home interior"}]',
NOW(), NOW()),

('b2b2b002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
'Modern, tech-forward pest control brand emphasizing advanced treatment methods and innovative solutions.',
'Establish Guardian Pest Control as the leading technology-driven pest control service in Texas.',
'Innovative, reliable, tech-savvy, effective, modern.',
'https://guardianpest.com/brand/logo.svg',
'Modern shield logo with geometric elements representing advanced pest control technology.',
'#0066CC', '100,50,0,20', 'Process Blue C',
'#00D4FF', '75,0,20,0', 'Process Cyan C',
'[{"hex": "#FF3366", "cmyk": "0,80,60,0", "pantone": "192 C", "name": "Accent Red"}, {"hex": "#FFFFFF", "cmyk": "0,0,0,0", "pantone": "White", "name": "White"}, {"hex": "#1A1A1A", "cmyk": "0,0,0,90", "pantone": "Black C", "name": "Black"}]',
'Roboto', 'Roboto Medium 28px - Tech-focused sans-serif', 'https://fonts.google.com/specimen/Roboto',
'Source Sans Pro', 'Source Sans Pro Regular 16px - Clean body text', 'https://fonts.google.com/specimen/Source+Sans+Pro',
'High-tech pest control imagery with blue color grading. Focus on advanced equipment, technology, and modern treatment methods.',
'[{"url": "https://guardianpest.com/brand/tech1.jpg", "description": "Advanced pest control equipment with blue lighting"}, {"url": "https://guardianpest.com/brand/tech2.jpg", "description": "Modern pest control facility with tech equipment"}]',
NOW(), NOW()),

('c3c3c003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333',
'Earth-friendly pest control brand focused on sustainable, organic solutions and environmental responsibility.',
'Position Green Shield Exterminators as the premier eco-friendly pest control service that protects families and the environment.',
'Natural, sustainable, safe, family-focused, environmentally responsible.',
'https://greenshieldpest.com/brand/leaf-shield-logo.png',
'Shield logo incorporating organic leaf elements in earthy green tones symbolizing natural protection.',
'#4A7C59', '50,0,30,70', '5535 C',
'#8FBC8F', '30,0,30,25', '5555 C',
'[{"hex": "#D2B48C", "cmyk": "20,25,50,5", "pantone": "4525 C", "name": "Natural Tan"}, {"hex": "#8B4513", "cmyk": "30,70,100,35", "pantone": "4695 C", "name": "Earth Brown"}, {"hex": "#F5F5DC", "cmyk": "5,5,15,0", "pantone": "Cream", "name": "Cream"}]',
'Merriweather', 'Merriweather Bold 26px - Friendly serif for organic, trustworthy feel', 'https://fonts.google.com/specimen/Merriweather',
'Open Sans', 'Open Sans Regular 16px - Readable and approachable', 'https://fonts.google.com/specimen/Open+Sans',
'Natural, family-focused photography with warm lighting. Focus on safe home environments, organic treatments, and environmental protection.',
'[{"url": "https://greenshieldpest.com/brand/family1.jpg", "description": "Happy family in pest-free home with natural lighting"}, {"url": "https://greenshieldpest.com/brand/organic1.jpg", "description": "Organic pest control products and natural treatments"}]',
NOW(), NOW()),

('d4d4d004-0000-0000-0000-000000000004', '66666666-6666-6666-6666-666666666666',
'Minimal brand setup for testing edge cases.',
'TBD - Brand strategy in development',
'Testing various edge cases.',
'', '', '#000000', '', '', '#FFFFFF', '', '', '[]', '', '', '', '', '', '', '', '[]', NOW(), NOW());

-- Insert projects (without user assignments - will be populated by seeding script)
INSERT INTO projects (
    id,
    name,
    description,
    project_type,
    company_id,
    requested_by,
    status,
    priority,
    due_date,
    start_date,
    completion_date,
    estimated_hours,
    actual_hours,
    budget_amount,
    primary_file_path,
    tags,
    attachments,
    notes,
    created_at,
    updated_at
) VALUES
('a1010001-0000-0000-0000-000000000001', 'Website Redesign', 'Complete redesign of corporate website with modern UX/UI and mobile optimization.', 'Web Development', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'in_progress', 'high', '2025-08-15', '2025-07-01', NULL, 120.00, 45.50, 15000.00, 'project-files/22222222-2222-2222-2222-222222222222/proj0001/wireframes.pdf', ARRAY['web', 'redesign', 'mobile'], '[{"path": "project-files/22222222-2222-2222-2222-222222222222/proj0001/mockups.png", "type": "image/png", "name": "UI Mockups"}, {"path": "project-files/22222222-2222-2222-2222-222222222222/proj0001/sitemap.pdf", "type": "application/pdf", "name": "Site Map"}]', 'Client wants to emphasize AI capabilities in the design. Include interactive elements.', NOW() - INTERVAL '14 days', NOW()),

('b2020002-0000-0000-0000-000000000002', 'Brand Identity Package', 'Complete brand identity including logo, color palette, typography, and brand guidelines.', 'Branding', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'pending', 'medium', '2025-09-01', NULL, NULL, 80.00, 0.00, 8500.00, 'project-files/33333333-3333-3333-3333-333333333333/proj0002/brief.pdf', ARRAY['branding', 'logo', 'organic'], '[{"path": "project-files/33333333-3333-3333-3333-333333333333/proj0002/inspiration.jpg", "type": "image/jpeg", "name": "Inspiration Board"}]', 'Focus on organic, sustainable themes. Client loves earth tones.', NOW() - INTERVAL '7 days', NOW()),

('c3030003-0000-0000-0000-000000000003', 'E-commerce Platform', 'Custom e-commerce solution with inventory management and payment processing.', 'Web Development', '55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'completed', 'high', '2025-06-30', '2025-04-01', '2025-06-28', 200.00, 195.50, 25000.00, 'project-files/55555555-5555-5555-5555-555555555555/proj0003/final-site.zip', ARRAY['ecommerce', 'web', 'payment'], '[{"path": "project-files/55555555-5555-5555-5555-555555555555/proj0003/documentation.pdf", "type": "application/pdf", "name": "Site Documentation"}, {"path": "project-files/55555555-5555-5555-5555-555555555555/proj0003/admin-guide.pdf", "type": "application/pdf", "name": "Admin Guide"}]', 'Successfully launched on time. Client very happy with results. Site handling 500+ orders/day.', NOW() - INTERVAL '90 days', NOW()),

('d4040004-0000-0000-0000-000000000004', 'Marketing Campaign', 'Q3 marketing campaign for new product launch including social media, email, and print materials.', 'Marketing', '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'in_progress', 'urgent', '2025-07-25', '2025-07-10', NULL, 60.00, 25.00, 12000.00, 'project-files/44444444-4444-4444-4444-444444444444/proj0004/campaign-brief.pdf', ARRAY['marketing', 'social-media', 'print'], '[{"path": "project-files/44444444-4444-4444-4444-444444444444/proj0004/social-templates.ai", "type": "application/vnd.adobe.illustrator", "name": "Social Media Templates"}]', 'Rush project. Client needs materials by end of month for trade show.', NOW() - INTERVAL '5 days', NOW()),

('e5050005-0000-0000-0000-000000000005', 'Logo Design', 'Simple logo design for new coffee shop brand.', 'Branding', '55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'completed', 'low', '2025-05-15', '2025-05-01', '2025-05-12', 16.00, 14.50, 2500.00, 'project-files/55555555-5555-5555-5555-555555555555/proj0005/logo-final.ai', ARRAY['logo', 'coffee', 'branding'], '[{"path": "project-files/55555555-5555-5555-5555-555555555555/proj0005/logo-variations.ai", "type": "application/vnd.adobe.illustrator", "name": "Logo Variations"}]', 'Client loved the minimalist approach. Logo works well on packaging and signage.', NOW() - INTERVAL '60 days', NOW()),

('f6060006-0000-0000-0000-000000000006', 'Project with Very Long Name That Tests Database Field Limits and UI Display Capabilities', 'This project has an extremely long name to test how our system handles edge cases in project naming and ensures proper display in various UI components without breaking layouts or causing database issues.', 'Consulting', '66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'on_hold', 'medium', '2025-12-31', NULL, NULL, 40.00, 0.00, 5000.00, '', ARRAY['consulting', 'long-name', 'edge-case'], '[]', 'This is a test project to ensure our system can handle projects with extremely long names and descriptions.', NOW() - INTERVAL '30 days', NOW()),

('a7070007-0000-0000-0000-000000000007', 'Cancelled Project', 'Project that was started but later cancelled due to budget constraints.', 'Web Development', '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'cancelled', 'low', '2025-08-01', '2025-07-15', NULL, 100.00, 12.00, 0.00, '', ARRAY['cancelled', 'budget-issue'], '[]', 'Project cancelled after initial planning phase due to client budget constraints. Partial work completed.', NOW() - INTERVAL '2 days', NOW()),

('b8080008-0000-0000-0000-000000000008', 'Quick Fix', 'Minor website update.', 'Web Development', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'pending', 'low', '2025-07-20', NULL, NULL, 2.00, 0.00, 150.00, '', ARRAY['quick-fix'], '[]', 'Minor website updates and fixes.', NOW() - INTERVAL '1 day', NOW()),

('c9090009-0000-0000-0000-000000000009', 'Holiday Campaign 2025', 'Annual holiday marketing campaign preparation and execution.', 'Marketing', '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'pending', 'medium', '2025-11-01', NULL, NULL, 120.00, 0.00, 18000.00, '', ARRAY['holiday', 'marketing', 'seasonal'], '[]', 'Plan holiday campaign early. Need to coordinate with client sales team.', NOW(), NOW()),

('d1010010-0000-0000-0000-000000000010', 'Enterprise Dashboard', 'Complex enterprise dashboard with real-time analytics, user management, and reporting capabilities.', 'Web Development', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'in_progress', 'high', '2025-10-15', '2025-07-01', NULL, 300.00, 85.00, 45000.00, 'project-files/22222222-2222-2222-2222-222222222222/proj0010/requirements.pdf', ARRAY['enterprise', 'dashboard', 'analytics', 'complex'], '[{"path": "project-files/22222222-2222-2222-2222-222222222222/proj0010/wireframes.pdf", "type": "application/pdf", "name": "Wireframes"}, {"path": "project-files/22222222-2222-2222-2222-222222222222/proj0010/database-schema.sql", "type": "text/plain", "name": "Database Schema"}]', 'Large-scale enterprise project with multiple stakeholders. Weekly progress meetings scheduled.', NOW() - INTERVAL '16 days', NOW());

-- Display summary of seeded data
SELECT 
    'Database successfully seeded!' as message,
    NOW() as timestamp;

SELECT 
    'companies' as table_name, 
    COUNT(*) as record_count,
    'Diverse companies across industries with edge cases' as description
FROM companies
UNION ALL
SELECT 
    'brands' as table_name, 
    COUNT(*) as record_count,
    'Comprehensive brand data with colors, fonts, and imagery' as description
FROM brands
UNION ALL
SELECT 
    'projects' as table_name, 
    COUNT(*) as record_count,
    'Projects in various states (no user assignments)' as description
FROM projects;