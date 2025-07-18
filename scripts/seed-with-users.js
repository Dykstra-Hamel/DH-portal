#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const CONFIG = {
  // Production Supabase config
  PROD_SUPABASE_URL: `https://${process.env.PROD_SUPABASE_URL}`,
  PROD_SUPABASE_SERVICE_KEY: process.env.PROD_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Local Supabase config
  LOCAL_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  LOCAL_SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Seeding options
  MAX_USERS: 50, // Limit number of users to pull from production
  ASSIGN_RANDOM_USERS: true, // Randomly assign users to companies/projects
};

// Initialize Supabase clients
const prodClient = createClient(CONFIG.PROD_SUPABASE_URL, CONFIG.PROD_SUPABASE_SERVICE_KEY);
const localClient = createClient(CONFIG.LOCAL_SUPABASE_URL, CONFIG.LOCAL_SUPABASE_SERVICE_KEY);

// Utility functions
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Generate random UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Shuffle array utility
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Pull users from production database
async function pullUsersFromProduction() {
  try {
    log('Pulling users from production database...');
    
    if (!CONFIG.PROD_SUPABASE_URL || !CONFIG.PROD_SUPABASE_SERVICE_KEY) {
      error('Production Supabase credentials not found. Please set PROD_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
      process.exit(1);
    }
    
    const { data: users, error: userError } = await prodClient.auth.admin.listUsers({
      perPage: CONFIG.MAX_USERS
    });
    
    if (userError) {
      error(`Failed to fetch users from production: ${userError.message}`);
      return [];
    }
    
    log(`Successfully pulled ${users.users.length} users from production`);
    return users.users;
    
  } catch (err) {
    error(`Error pulling users from production: ${err.message}`);
    return [];
  }
}

// Create auth users and profiles in local database
async function createUsersAndProfiles(users) {
  try {
    log('Creating auth users and profiles in local database...');
    
    const createdUsers = [];
    
    // Create auth users first
    for (const user of users) {
      try {
        const { data: authUser, error: authError } = await localClient.auth.admin.createUser({
          user_id: user.id,
          email: user.email,
          password: 'temporary-password-123', // Users will need to reset
          email_confirm: true,
          user_metadata: user.user_metadata || {}
        });
        
        if (authError) {
          // If user already exists, that's ok - skip this user
          if (authError.message.includes('already exists') || authError.message.includes('already registered')) {
            log(`User ${user.email} already exists, skipping...`);
            createdUsers.push(user);
            continue;
          }
          error(`Failed to create auth user ${user.email}: ${authError.message}`);
          continue;
        }
        
        if (authUser.user) {
          createdUsers.push(user);
          log(`Created auth user: ${user.email}`);
        }
        
      } catch (authErr) {
        error(`Error creating auth user ${user.email}: ${authErr.message}`);
        continue;
      }
    }
    
    // Wait a moment for auth triggers to create profiles, then update them
    if (createdUsers.length > 0) {
      // Wait for auth triggers to create profiles
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if profiles were created automatically
      const { data: existingProfiles, error: checkError } = await localClient
        .from('profiles')
        .select('id')
        .in('id', createdUsers.map(u => u.id));
      
      if (checkError) {
        error(`Failed to check existing profiles: ${checkError.message}`);
        return false;
      }
      
      log(`Found ${existingProfiles.length} existing profiles`);
      
      // Update profiles with additional data
      const profiles = createdUsers.map(user => {
        const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
        const nameParts = fullName.split(' ');
        
        return {
          id: user.id,
          email: user.email,
          first_name: nameParts[0] || user.email.split('@')[0],
          last_name: nameParts.slice(1).join(' ') || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          role: 'user', // Default role
          updated_at: new Date().toISOString()
        };
      });
      
      // Update profiles (not insert, since they should exist from triggers)
      for (const profile of profiles) {
        const { error: profileError } = await localClient
          .from('profiles')
          .update(profile)
          .eq('id', profile.id);
        
        if (profileError) {
          error(`Failed to update profile for ${profile.email}: ${profileError.message}`);
          // Continue with other profiles
        }
      }
      
      log(`Successfully processed ${profiles.length} user profiles`);
    }
    
    return true;
    
  } catch (err) {
    error(`Error creating users and profiles: ${err.message}`);
    return false;
  }
}

// Create companies with random users assigned from production users
async function createCompaniesWithUsers(users) {
  try {
    log('Creating companies with random users assigned from production users...');
    
    // First, clear existing companies
    const { error: clearError } = await localClient
      .from('companies')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep a dummy record if needed
    
    if (clearError) {
      error(`Failed to clear existing companies: ${clearError.message}`);
      return false;
    }
    
    // Define companies to create
    const companies = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Dykstra Hamel',
        description: 'Full-service creative agency specializing in brand development, web design, and digital marketing solutions.',
        website: 'https://dykstrahamel.com',
        email: 'hello@dykstrahamel.com',
        phone: '(555) 123-4567',
        address: '123 Creative St',
        city: 'Grand Rapids',
        state: 'Michigan',
        zip_code: '49503',
        country: 'United States',
        industry: 'Creative Services',
        size: '10-50'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'TechStart Inc',
        description: 'Innovative technology startup focused on AI solutions for small businesses.',
        website: 'https://techstart.com',
        email: 'info@techstart.com',
        phone: '(555) 987-6543',
        address: '456 Innovation Ave',
        city: 'Austin',
        state: 'Texas',
        zip_code: '78701',
        country: 'United States',
        industry: 'Technology',
        size: '1-10'
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'GreenLeaf Organics',
        description: 'Sustainable organic food producer committed to environmental responsibility.',
        website: 'https://greenleaforganics.com',
        email: 'contact@greenleaforganics.com',
        phone: '(555) 456-7890',
        address: '789 Organic Way',
        city: 'Portland',
        state: 'Oregon',
        zip_code: '97201',
        country: 'United States',
        industry: 'Food & Beverage',
        size: '50-100'
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Metro Financial Services',
        description: 'Full-service financial planning and investment management firm.',
        website: 'https://metrofinancial.com',
        email: 'support@metrofinancial.com',
        phone: '(555) 321-0987',
        address: '321 Wall Street',
        city: 'New York',
        state: 'New York',
        zip_code: '10005',
        country: 'United States',
        industry: 'Financial Services',
        size: '100-500'
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        name: 'Artisan Coffee Co',
        description: 'Small-batch coffee roaster with a passion for quality and community.',
        website: 'https://artisancoffee.co',
        email: 'hello@artisancoffee.co',
        phone: '(555) 654-3210',
        address: '987 Coffee Lane',
        city: 'Seattle',
        state: 'Washington',
        zip_code: '98101',
        country: 'United States',
        industry: 'Food & Beverage',
        size: '10-50'
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        name: 'Edge Case Company',
        description: 'Company with special characters: Café & Résumé',
        website: 'https://edge-case.com',
        email: 'info@edge-case.com',
        phone: '(555) 000-0000',
        address: '123 Special St',
        city: 'Test City',
        state: 'Test State',
        zip_code: '00000',
        country: 'United States',
        industry: 'Testing',
        size: '1-10'
      }
    ];
    
    // Insert companies
    const { error: companyError } = await localClient
      .from('companies')
      .insert(companies);
    
    if (companyError) {
      error(`Failed to create companies: ${companyError.message}`);
      return false;
    }
    
    log(`Successfully created ${companies.length} companies`);
    
    // Get local user profiles (not production IDs)
    const { data: localUsers, error: localUserError } = await localClient
      .from('profiles')
      .select('id, email');
    
    if (localUserError) {
      error(`Failed to fetch local users: ${localUserError.message}`);
      return false;
    }
    
    if (localUsers.length === 0) {
      log('No local users found, skipping user-company assignments');
      return true;
    }
    
    // Now assign random users to companies
    const assignments = [];
    for (const company of companies) {
      // Assign 1-3 random users to each company
      const numUsers = Math.floor(Math.random() * 3) + 1;
      const shuffledUsers = [...localUsers].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < numUsers && i < shuffledUsers.length; i++) {
        assignments.push({
          user_id: shuffledUsers[i].id,
          company_id: company.id
        });
      }
    }
    
    // Insert user-company assignments
    if (assignments.length > 0) {
      const { error: assignError } = await localClient
        .from('user_companies')
        .insert(assignments);
      
      if (assignError) {
        error(`Failed to assign users to companies: ${assignError.message}`);
        return false;
      }
      
      log(`Successfully assigned ${assignments.length} user-company relationships`);
    }
    
    return true;
  } catch (err) {
    error(`Error creating companies with users: ${err.message}`);
    return false;
  }
}

// Assign users to companies
async function assignUsersToCompanies(users) {
  try {
    log('Assigning users to companies...');
    
    // Get all companies
    const { data: companies, error: companyError } = await localClient
      .from('companies')
      .select('id, name');
    
    if (companyError) {
      error(`Failed to fetch companies: ${companyError.message}`);
      return false;
    }
    
    if (companies.length === 0) {
      log('No companies found, skipping user-company assignments');
      return true;
    }
    
    // Create user-company assignments
    const assignments = [];
    const shuffledUsers = shuffleArray(users);
    
    shuffledUsers.forEach((user, index) => {
      // Assign each user to 1-3 companies
      const numAssignments = Math.floor(Math.random() * 3) + 1;
      const shuffledCompanies = shuffleArray(companies);
      
      for (let i = 0; i < Math.min(numAssignments, shuffledCompanies.length); i++) {
        const company = shuffledCompanies[i];
        assignments.push({
          user_id: user.id,
          company_id: company.id,
          role: ['admin', 'member', 'viewer'][Math.floor(Math.random() * 3)],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
    
    // Insert assignments
    const { error: assignmentError } = await localClient
      .from('user_companies')
      .upsert(assignments);
    
    if (assignmentError) {
      error(`Failed to create user-company assignments: ${assignmentError.message}`);
      return false;
    }
    
    log(`Successfully created ${assignments.length} user-company assignments`);
    return true;
    
  } catch (err) {
    error(`Error assigning users to companies: ${err.message}`);
    return false;
  }
}

// Create brands for companies
async function createBrandsForCompanies() {
  try {
    log('Creating brands for companies...');
    
    // First, clear existing brands
    const { error: clearError } = await localClient
      .from('brands')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep a dummy record if needed
    
    if (clearError) {
      error(`Failed to clear existing brands: ${clearError.message}`);
      return false;
    }
    
    // Define brands to create
    const brands = [
      {
        id: 'a1a1a001-0000-0000-0000-000000000001',
        company_id: '11111111-1111-1111-1111-111111111111',
        brand_guidelines: 'Our brand represents creativity, professionalism, and innovation. We use clean lines, bold typography, and a carefully curated color palette to convey trust and expertise in creative services.',
        brand_strategy: 'Position ourselves as the go-to creative partner for businesses seeking authentic, impactful brand experiences.',
        personality: 'Professional yet approachable, innovative but grounded, creative with purpose.',
        logo_url: '',
        logo_description: 'Primary logo featuring our custom wordmark in Montserrat Bold with subtle geometric elements.',
        primary_color_hex: '#2B5CE6',
        primary_color_cmyk: '85,65,0,10',
        primary_color_pantone: 'Process Blue C',
        secondary_color_hex: '#FF6B35',
        secondary_color_cmyk: '0,65,85,0',
        secondary_color_pantone: 'Orange 021 C',
        alternative_colors: [
          {"hex": "#F8F9FA", "cmyk": "3,2,3,0", "pantone": "Cool Gray 1 C", "name": "Light Gray"},
          {"hex": "#343A40", "cmyk": "0,0,0,85", "pantone": "Black 6 C", "name": "Dark Gray"},
          {"hex": "#28A745", "cmyk": "70,0,100,0", "pantone": "355 C", "name": "Success Green"}
        ],
        font_primary_name: 'Montserrat',
        font_primary_example: 'Montserrat Bold 24px - Professional and modern sans-serif for headings',
        font_primary_url: 'https://fonts.google.com/specimen/Montserrat',
        font_secondary_name: 'Inter',
        font_secondary_example: 'Inter Regular 16px - Clean and readable for body text',
        font_secondary_url: 'https://fonts.google.com/specimen/Inter',
        photography_description: 'Clean, modern photography with natural lighting. Focus on people in their environments, showcasing authenticity and professionalism.',
        photography_images: []
      },
      {
        id: 'b2b2b002-0000-0000-0000-000000000002',
        company_id: '22222222-2222-2222-2222-222222222222',
        brand_guidelines: 'Bold, innovative brand identity reflecting cutting-edge technology and forward-thinking solutions.',
        brand_strategy: 'Establish TechStart as the leading AI solution provider for small businesses.',
        personality: 'Innovative, trustworthy, accessible, future-focused.',
        logo_url: '',
        logo_description: 'Minimalist logo with geometric AI-inspired elements in gradient blue.',
        primary_color_hex: '#0066CC',
        primary_color_cmyk: '100,50,0,20',
        primary_color_pantone: 'Process Blue C',
        secondary_color_hex: '#00D4FF',
        secondary_color_cmyk: '75,0,20,0',
        secondary_color_pantone: 'Process Cyan C',
        alternative_colors: [
          {"hex": "#FF3366", "cmyk": "0,80,60,0", "pantone": "192 C", "name": "Accent Red"},
          {"hex": "#FFFFFF", "cmyk": "0,0,0,0", "pantone": "White", "name": "White"},
          {"hex": "#1A1A1A", "cmyk": "0,0,0,90", "pantone": "Black C", "name": "Black"}
        ],
        font_primary_name: 'Roboto',
        font_primary_example: 'Roboto Medium 28px - Tech-focused sans-serif',
        font_primary_url: 'https://fonts.google.com/specimen/Roboto',
        font_secondary_name: 'Source Sans Pro',
        font_secondary_example: 'Source Sans Pro Regular 16px - Clean body text',
        font_secondary_url: 'https://fonts.google.com/specimen/Source+Sans+Pro',
        photography_description: 'High-tech, futuristic imagery with blue color grading. Focus on innovation, AI concepts, and modern technology.',
        photography_images: []
      },
      {
        id: 'c3c3c003-0000-0000-0000-000000000003',
        company_id: '33333333-3333-3333-3333-333333333333',
        brand_guidelines: 'Earth-friendly brand focused on sustainability, organic farming, and environmental responsibility.',
        brand_strategy: 'Position as the premier organic food producer that doesn&apos;t compromise on taste or environmental impact.',
        personality: 'Natural, sustainable, healthy, community-focused, authentic.',
        logo_url: '',
        logo_description: 'Hand-drawn leaf logo in earthy green tones symbolizing growth and nature.',
        primary_color_hex: '#4A7C59',
        primary_color_cmyk: '50,0,30,70',
        primary_color_pantone: '5535 C',
        secondary_color_hex: '#8FBC8F',
        secondary_color_cmyk: '30,0,30,25',
        secondary_color_pantone: '5555 C',
        alternative_colors: [
          {"hex": "#D2B48C", "cmyk": "20,25,50,5", "pantone": "4525 C", "name": "Natural Tan"},
          {"hex": "#8B4513", "cmyk": "30,70,100,35", "pantone": "4695 C", "name": "Earth Brown"},
          {"hex": "#F5F5DC", "cmyk": "5,5,15,0", "pantone": "Cream", "name": "Cream"}
        ],
        font_primary_name: 'Merriweather',
        font_primary_example: 'Merriweather Bold 26px - Friendly serif for organic feel',
        font_primary_url: 'https://fonts.google.com/specimen/Merriweather',
        font_secondary_name: 'Open Sans',
        font_secondary_example: 'Open Sans Regular 16px - Readable and approachable',
        font_secondary_url: 'https://fonts.google.com/specimen/Open+Sans',
        photography_description: 'Natural, organic photography with warm lighting. Focus on fresh produce, farming, and sustainable practices.',
        photography_images: []
      },
      {
        id: 'd4d4d004-0000-0000-0000-000000000004',
        company_id: '66666666-6666-6666-6666-666666666666',
        brand_guidelines: 'Minimal brand setup for testing edge cases.',
        brand_strategy: 'TBD - Brand strategy in development',
        personality: 'Testing various edge cases.',
        logo_url: '',
        logo_description: '',
        primary_color_hex: '#000000',
        primary_color_cmyk: '',
        primary_color_pantone: '',
        secondary_color_hex: '#FFFFFF',
        secondary_color_cmyk: '',
        secondary_color_pantone: '',
        alternative_colors: [],
        font_primary_name: '',
        font_primary_example: '',
        font_primary_url: '',
        font_secondary_name: '',
        font_secondary_example: '',
        font_secondary_url: '',
        photography_description: '',
        photography_images: []
      }
    ];
    
    // Insert brands
    const { error: brandError } = await localClient
      .from('brands')
      .insert(brands);
    
    if (brandError) {
      error(`Failed to create brands: ${brandError.message}`);
      return false;
    }
    
    log(`Successfully created ${brands.length} brands`);
    return true;
  } catch (err) {
    error(`Error creating brands: ${err.message}`);
    return false;
  }
}

// Update projects with real user IDs (reassign to random users)
async function updateProjectsWithUsers(users) {
  try {
    log('Reassigning projects to random users...');
    
    if (users.length === 0) {
      log('No users available to assign to projects');
      return true;
    }
    
    // Get all projects
    const { data: projects, error: projectError } = await localClient
      .from('projects')
      .select('id, name, requested_by');
    
    if (projectError) {
      error(`Failed to fetch projects: ${projectError.message}`);
      return false;
    }
    
    if (projects.length === 0) {
      log('No projects found to update');
      return true;
    }
    
    // Reassign each project to random users
    for (const project of projects) {
      const randomRequester = users[Math.floor(Math.random() * users.length)];
      const randomAssignee = users[Math.floor(Math.random() * users.length)];
      
      const { error: updateError } = await localClient
        .from('projects')
        .update({ 
          requested_by: randomRequester.id,
          assigned_to: randomAssignee.id
        })
        .eq('id', project.id);
      
      if (updateError) {
        error(`Failed to update project ${project.name}: ${updateError.message}`);
        continue;
      }
    }
    
    log(`Successfully reassigned ${projects.length} projects to random users`);
    return true;
    
  } catch (err) {
    error(`Error updating projects: ${err.message}`);
    return false;
  }
}

// Create projects for companies
async function createProjectsForCompanies(users) {
  try {
    log('Creating projects for companies...');
    
    // First, clear existing projects
    const { error: clearError } = await localClient
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep a dummy record if needed
    
    if (clearError) {
      error(`Failed to clear existing projects: ${clearError.message}`);
      return false;
    }
    
    // Get all companies
    const { data: companies, error: companyError } = await localClient
      .from('companies')
      .select('id, name');
    
    if (companyError) {
      error(`Failed to fetch companies: ${companyError.message}`);
      return false;
    }
    
    if (companies.length === 0) {
      log('No companies found to create projects for');
      return true;
    }
    
    // Get local user profiles (not production IDs)
    const { data: localUsers, error: localUserError } = await localClient
      .from('profiles')
      .select('id, email');
    
    if (localUserError) {
      error(`Failed to fetch local users: ${localUserError.message}`);
      return false;
    }
    
    if (localUsers.length === 0) {
      log('No local users found, cannot create projects');
      return false;
    }
    
    // Define project types and statuses
    const projectTypes = ['website', 'branding', 'marketing', 'application', 'consultation'];
    const statuses = ['pending', 'in_progress', 'completed', 'on_hold'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    
    // Create 2-4 projects for each company
    const projects = [];
    let projectIndex = 1;
    
    for (const company of companies) {
      const numProjects = Math.floor(Math.random() * 3) + 2; // 2-4 projects
      
      for (let i = 0; i < numProjects; i++) {
        const randomRequester = localUsers[Math.floor(Math.random() * localUsers.length)];
        const randomAssignee = localUsers[Math.floor(Math.random() * localUsers.length)];
        const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        
        projects.push({
          id: `${projectIndex.toString().padStart(8, '0')}-0000-0000-0000-000000000000`,
          name: `${company.name} ${projectType.charAt(0).toUpperCase() + projectType.slice(1)} Project`,
          description: `${projectType.charAt(0).toUpperCase() + projectType.slice(1)} project for ${company.name}`,
          project_type: projectType,
          company_id: company.id,
          requested_by: randomRequester.id,
          assigned_to: randomAssignee.id,
          status: status,
          priority: priority,
          start_date: new Date().toISOString(),
          due_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() // Random date within 90 days
        });
        
        projectIndex++;
      }
    }
    
    // Insert projects
    const { error: projectError } = await localClient
      .from('projects')
      .insert(projects);
    
    if (projectError) {
      error(`Failed to create projects: ${projectError.message}`);
      return false;
    }
    
    log(`Successfully created ${projects.length} projects for ${companies.length} companies`);
    return true;
    
  } catch (err) {
    error(`Error creating projects: ${err.message}`);
    return false;
  }
}

// Create customers for companies
async function createCustomersForCompanies() {
  try {
    log('Creating customers for companies...');
    
    // First, clear existing customers
    const { error: clearError } = await localClient
      .from('customers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep a dummy record if needed
    
    if (clearError) {
      error(`Failed to clear existing customers: ${clearError.message}`);
      return false;
    }
    
    // Get all companies
    const { data: companies, error: companyError } = await localClient
      .from('companies')
      .select('id, name');
    
    if (companyError) {
      error(`Failed to fetch companies: ${companyError.message}`);
      return false;
    }
    
    if (companies.length === 0) {
      log('No companies found to create customers for');
      return true;
    }
    
    // Sample customer data
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Amanda', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
    const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];
    const statuses = ['active', 'inactive'];
    
    // Create 3-5 customers for each company
    const customers = [];
    let customerIndex = 1;
    
    for (const company of companies) {
      const numCustomers = Math.floor(Math.random() * 3) + 3; // 3-5 customers
      
      for (let i = 0; i < numCustomers; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const cityIndex = Math.floor(Math.random() * cities.length);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        customers.push({
          id: `${customerIndex.toString().padStart(8, '0')}-1111-1111-1111-111111111111`,
          company_id: company.id,
          first_name: firstName,
          last_name: lastName,
          phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          address: `${Math.floor(Math.random() * 9999) + 1} ${lastName} St`,
          city: cities[cityIndex],
          state: states[cityIndex],
          zip_code: `${Math.floor(Math.random() * 90000) + 10000}`,
          customer_status: status,
          notes: `Customer of ${company.name}. ${status === 'active' ? 'Regular customer with ongoing business.' : 'Inactive customer, potential for reactivation.'}`
        });
        
        customerIndex++;
      }
    }
    
    // Insert customers
    const { error: customerError } = await localClient
      .from('customers')
      .insert(customers);
    
    if (customerError) {
      error(`Failed to create customers: ${customerError.message}`);
      return false;
    }
    
    log(`Successfully created ${customers.length} customers for ${companies.length} companies`);
    return true;
    
  } catch (err) {
    error(`Error creating customers: ${err.message}`);
    return false;
  }
}

// Helper function to generate realistic comments based on lead status
function getLeadComments(serviceType, leadSource, leadStatus) {
  const comments = {
    'new': [
      `Initial ${serviceType} inquiry from ${leadSource}. Awaiting initial contact.`,
      `${serviceType} request submitted. Need to schedule discovery call.`,
      `Interested in ${serviceType} services. Requires follow-up within 24 hours.`,
      `New lead for ${serviceType}. High priority based on project scope.`,
      `${serviceType} inquiry via ${leadSource}. Client mentioned tight deadline.`
    ],
    'contacted': [
      `Had initial conversation about ${serviceType} project. Sent proposal draft.`,
      `Discovery call completed. Client interested in ${serviceType} services.`,
      `First contact made. Scheduled follow-up meeting for next week.`,
      `Discussed ${serviceType} requirements. Awaiting additional project details.`,
      `Initial consultation completed. Client reviewing our ${serviceType} portfolio.`
    ],
    'quoted': [
      `Formal quote sent for ${serviceType} project. Awaiting client decision.`,
      `Proposal delivered. Client comparing our ${serviceType} quote with competitors.`,
      `Quote approved by client. Working on contract details.`,
      `${serviceType} proposal under review. Client requested minor revisions.`,
      `Submitted comprehensive quote for ${serviceType} services. Follow-up scheduled.`
    ],
    'won': [
      `Successfully converted! ${serviceType} project signed and initiated.`,
      `Won the ${serviceType} project. Contract signed, project kickoff scheduled.`,
      `Client chose us for ${serviceType} services. Project starting next month.`,
      `${serviceType} project secured. Initial payment received, work beginning.`,
      `Successful close on ${serviceType} project. Team assigned and project launched.`
    ],
    'lost': [
      `Lost ${serviceType} project to competitor. Price was the deciding factor.`,
      `Client decided to go with another agency for ${serviceType} services.`,
      `${serviceType} project awarded to competitor. Client cited better timeline.`,
      `Lost to competitor. Client felt their ${serviceType} approach was better fit.`,
      `Project lost due to budget constraints. Client postponing ${serviceType} work.`
    ],
    'unqualified': [
      `Lead disqualified. Budget too small for ${serviceType} project scope.`,
      `Not qualified lead. Client timeline doesn't match our ${serviceType} availability.`,
      `Unqualified inquiry. Client needs DIY solution, not professional ${serviceType}.`,
      `Lead disqualified after discovery. Project scope too small for our ${serviceType} services.`,
      `Not a good fit. Client expectations don't align with our ${serviceType} approach.`
    ]
  };
  
  const statusComments = comments[leadStatus] || comments['new'];
  return statusComments[Math.floor(Math.random() * statusComments.length)];
}

// Helper function to generate realistic estimated values based on service type and status
function getEstimatedValue(leadStatus, serviceType) {
  const serviceValues = {
    'General Pest Control': { min: 150, max: 500 },
    'Ant Control': { min: 200, max: 400 },
    'Roach Control': { min: 250, max: 600 },
    'Spider Control': { min: 180, max: 450 },
    'Rodent Control': { min: 300, max: 800 },
    'Termite Inspection': { min: 100, max: 300 },
    'Termite Treatment': { min: 1500, max: 5000 },
    'Bed Bug Treatment': { min: 500, max: 2000 },
    'Wasp & Hornet Removal': { min: 200, max: 600 },
    'Flea Control': { min: 250, max: 500 },
    'Tick Control': { min: 300, max: 700 },
    'Mosquito Control': { min: 400, max: 1200 },
    'Wildlife Removal': { min: 500, max: 1500 },
    'Attic Insulation': { min: 2000, max: 8000 },
    'Crawl Space Treatment': { min: 1000, max: 4000 },
    'Commercial Pest Control': { min: 500, max: 3000 }
  };
  
  const defaultRange = { min: 200, max: 800 };
  const range = serviceValues[serviceType] || defaultRange;
  
  // Base value calculation
  let baseValue = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  
  // Adjust based on lead status
  switch(leadStatus) {
    case 'quoted':
    case 'won':
      // More accurate estimates for quoted/won leads
      baseValue = Math.floor(baseValue * (0.9 + Math.random() * 0.2)); // 90-110% of base
      break;
    case 'lost':
    case 'unqualified':
      // Lower estimates for lost/unqualified leads
      baseValue = Math.floor(baseValue * (0.7 + Math.random() * 0.4)); // 70-110% of base
      break;
    default:
      // New/contacted leads have wider range
      baseValue = Math.floor(baseValue * (0.8 + Math.random() * 0.5)); // 80-130% of base
  }
  
  // Round to nearest 25 for pest control pricing
  return Math.round(baseValue / 25) * 25;
}

// Create leads for companies
async function createLeadsForCompanies(users) {
  try {
    log('Creating leads for companies...');
    
    // First, clear existing leads
    const { error: clearError } = await localClient
      .from('leads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep a dummy record if needed
    
    if (clearError) {
      error(`Failed to clear existing leads: ${clearError.message}`);
      return false;
    }
    
    // Get all companies and customers
    const { data: companies, error: companyError } = await localClient
      .from('companies')
      .select('id, name');
    
    if (companyError) {
      error(`Failed to fetch companies: ${companyError.message}`);
      return false;
    }
    
    const { data: customers, error: customerError } = await localClient
      .from('customers')
      .select('id, company_id');
    
    if (customerError) {
      error(`Failed to fetch customers: ${customerError.message}`);
      return false;
    }
    
    // Get local user profiles
    const { data: localUsers, error: localUserError } = await localClient
      .from('profiles')
      .select('id, email');
    
    if (localUserError) {
      error(`Failed to fetch local users: ${localUserError.message}`);
      return false;
    }
    
    if (companies.length === 0 || localUsers.length === 0) {
      log('No companies or users found to create leads for');
      return true;
    }
    
    // Lead configuration arrays
    const leadSources = ['organic', 'referral', 'google_cpc', 'facebook_ads', 'linkedin', 'email_campaign', 'cold_call', 'trade_show', 'webinar', 'content_marketing'];
    const leadTypes = ['phone_call', 'web_form', 'email', 'chat', 'social_media', 'in_person'];
    const serviceTypes = ['General Pest Control', 'Ant Control', 'Roach Control', 'Spider Control', 'Rodent Control', 'Termite Inspection', 'Termite Treatment', 'Bed Bug Treatment', 'Wasp & Hornet Removal', 'Flea Control', 'Tick Control', 'Mosquito Control', 'Wildlife Removal', 'Attic Insulation', 'Crawl Space Treatment', 'Commercial Pest Control'];
    const leadStatuses = ['new', 'contacted', 'quoted', 'won', 'lost', 'unqualified'];
    const priorities = ['low', 'medium', 'high', 'urgent'];
    
    // Sample customer data for creating customers on-demand
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Amanda', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    // Create 5-8 leads for each company to ensure good coverage of all statuses
    const leads = [];
    let leadIndex = 1;
    
    for (const company of companies) {
      const numLeads = Math.floor(Math.random() * 4) + 5; // 5-8 leads
      const companyCustomers = customers.filter(c => c.company_id === company.id);
      
      // Track customers to ensure some get multiple leads
      const customersWithLeads = new Set();
      
      for (let i = 0; i < numLeads; i++) {
        const randomUser = localUsers[Math.floor(Math.random() * localUsers.length)];
        const leadSource = leadSources[Math.floor(Math.random() * leadSources.length)];
        const leadType = leadTypes[Math.floor(Math.random() * leadTypes.length)];
        const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
        
        // Ensure we have at least one lead of each status for the first 6 leads
        const leadStatus = i < leadStatuses.length ? leadStatuses[i] : leadStatuses[Math.floor(Math.random() * leadStatuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        
        // Always link to an existing customer - create additional customer if needed
        let linkedCustomer = null;
        if (companyCustomers.length > 0) {
          // For the first few leads, prefer customers who already have leads (multi-lead scenario)
          if (i < 3 && customersWithLeads.size > 0 && Math.random() > 0.3) {
            const customersWithLeadsArray = Array.from(customersWithLeads);
            const customerId = customersWithLeadsArray[Math.floor(Math.random() * customersWithLeadsArray.length)];
            linkedCustomer = companyCustomers.find(c => c.id === customerId);
          } else {
            linkedCustomer = companyCustomers[Math.floor(Math.random() * companyCustomers.length)];
          }
        } else {
          // If no customers exist for this company, create one
          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
          linkedCustomer = {
            id: `${leadIndex.toString().padStart(8, '0')}-CUST-TEMP-${company.id.substring(0, 8)}`,
            company_id: company.id,
            first_name: firstName,
            last_name: lastName,
            phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            customer_status: 'active'
          };
          companyCustomers.push(linkedCustomer);
        }
        
        // Track this customer as having leads
        customersWithLeads.add(linkedCustomer.id);
        
        leads.push({
          id: `${leadIndex.toString().padStart(8, '0')}-2222-2222-2222-222222222222`,
          company_id: company.id,
          customer_id: linkedCustomer.id,
          lead_source: leadSource,
          lead_type: leadType,
          service_type: serviceType,
          lead_status: leadStatus,
          comments: getLeadComments(serviceType, leadSource, leadStatus),
          assigned_to: randomUser.id,
          last_contacted_at: leadStatus !== 'new' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          next_follow_up_at: ['new', 'contacted', 'quoted'].includes(leadStatus) ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString() : null,
          estimated_value: getEstimatedValue(leadStatus, serviceType),
          priority: priority,
          utm_source: leadSource === 'google_cpc' ? 'google' : leadSource === 'facebook_ads' ? 'facebook' : null,
          utm_medium: leadSource.includes('ads') || leadSource === 'google_cpc' ? 'cpc' : leadSource === 'organic' ? 'organic' : null,
          utm_campaign: leadSource.includes('ads') ? `${company.name.toLowerCase()}-campaign` : null
        });
        
        leadIndex++;
      }
    }
    
    // Insert leads
    const { error: leadError } = await localClient
      .from('leads')
      .insert(leads);
    
    if (leadError) {
      error(`Failed to create leads: ${leadError.message}`);
      return false;
    }
    
    log(`Successfully created ${leads.length} leads for ${companies.length} companies`);
    return true;
    
  } catch (err) {
    error(`Error creating leads: ${err.message}`);
    return false;
  }
}

// Assign users to projects
async function assignUsersToProjects(users) {
  try {
    log('Assigning users to projects...');
    
    // Get all projects
    const { data: projects, error: projectError } = await localClient
      .from('projects')
      .select('id, name, company_id');
    
    if (projectError) {
      error(`Failed to fetch projects: ${projectError.message}`);
      return false;
    }
    
    if (projects.length === 0) {
      log('No projects found, skipping user-project assignments');
      return true;
    }
    
    // Get user-company relationships to ensure project assignments make sense
    const { data: userCompanies, error: ucError } = await localClient
      .from('user_companies')
      .select('user_id, company_id');
    
    if (ucError) {
      error(`Failed to fetch user-company relationships: ${ucError.message}`);
      return false;
    }
    
    // Create user-project assignments
    const assignments = [];
    
    projects.forEach(project => {
      // Find users who have access to this project's company
      const eligibleUsers = userCompanies
        .filter(uc => uc.company_id === project.company_id)
        .map(uc => uc.user_id);
      
      if (eligibleUsers.length === 0) {
        // If no users assigned to company, assign a random user
        const randomUser = users[Math.floor(Math.random() * users.length)];
        eligibleUsers.push(randomUser.id);
      }
      
      // Assign 1-4 users to each project
      const numAssignments = Math.floor(Math.random() * 4) + 1;
      const shuffledEligible = shuffleArray(eligibleUsers);
      
      for (let i = 0; i < Math.min(numAssignments, shuffledEligible.length); i++) {
        const userId = shuffledEligible[i];
        assignments.push({
          id: generateUUID(),
          user_id: userId,
          project_id: project.id,
          role: ['manager', 'contributor', 'viewer'][Math.floor(Math.random() * 3)],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
    
    // Insert assignments (assuming there's a user_projects table)
    const { error: assignmentError } = await localClient
      .from('user_projects')
      .upsert(assignments);
    
    if (assignmentError) {
      // If user_projects table doesn't exist, we'll update projects table with assigned_users
      log('user_projects table not found, updating projects with assigned_users...');
      
      // Group assignments by project
      const projectAssignments = {};
      assignments.forEach(assignment => {
        if (!projectAssignments[assignment.project_id]) {
          projectAssignments[assignment.project_id] = [];
        }
        projectAssignments[assignment.project_id].push(assignment.user_id);
      });
      
      // Update projects with assigned users
      for (const [projectId, userIds] of Object.entries(projectAssignments)) {
        const { error: updateError } = await localClient
          .from('projects')
          .update({ assigned_users: userIds })
          .eq('id', projectId);
        
        if (updateError) {
          error(`Failed to update project ${projectId}: ${updateError.message}`);
        }
      }
    } else {
      log(`Successfully created ${assignments.length} user-project assignments`);
    }
    
    return true;
    
  } catch (err) {
    error(`Error assigning users to projects: ${err.message}`);
    return false;
  }
}

// Run the existing seed.sql first
async function runBaseSeed() {
  try {
    log('Running base seed.sql...');
    
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    // Split SQL file into individual statements, handling multi-line INSERT statements
    const statements = [];
    let currentStatement = '';
    let inInsert = false;
    
    const lines = seedSQL.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
        continue;
      }
      
      // Skip SELECT statements used for display
      if (trimmedLine.startsWith('SELECT')) {
        continue;
      }
      
      currentStatement += line + '\n';
      
      // Check if this is an INSERT statement
      if (trimmedLine.toUpperCase().startsWith('INSERT')) {
        inInsert = true;
      }
      
      // End of statement
      if (trimmedLine.endsWith(';')) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
        inInsert = false;
      }
    }
    
    log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error: sqlError } = await localClient.rpc('exec_sql', { 
            sql: statement
          });
          
          if (sqlError && !sqlError.message.includes('already exists') && !sqlError.message.includes('duplicate key')) {
            error(`Failed to execute SQL: ${sqlError.message}`);
            log(`Statement was: ${statement.substring(0, 100)}...`);
          }
        } catch (execError) {
          error(`Error executing statement: ${execError.message}`);
          log(`Statement was: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    log('Base seed completed successfully');
    return true;
    
  } catch (err) {
    error(`Error running base seed: ${err.message}`);
    return false;
  }
}

// Get existing local user to use for initial assignments
async function getExistingLocalUser() {
  try {
    log('Looking for existing local user...');
    
    const { data: profiles, error: profileError } = await localClient
      .from('profiles')
      .select('id, email, first_name, last_name')
      .limit(1);
    
    if (profileError) {
      error(`Failed to fetch existing profiles: ${profileError.message}`);
      return null;
    }
    
    if (profiles.length === 0) {
      error('No existing users found. Please add at least one user first.');
      return null;
    }
    
    const user = profiles[0];
    log(`Found existing user: ${user.email} (${user.first_name} ${user.last_name})`);
    return user;
    
  } catch (err) {
    error(`Error getting existing user: ${err.message}`);
    return null;
  }
}

// Create seed data using existing user
async function createSeedWithExistingUser(existingUser) {
  try {
    log('Creating seed data with existing user...');
    
    // Read and execute the seed.sql but replace dummy user ID with real one
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    // Replace dummy user ID with existing user ID
    const modifiedSQL = seedSQL.replace(/00000000-0000-0000-0000-000000000000/g, existingUser.id);
    
    // Execute the SQL
    const statements = modifiedSQL
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('--') && 
               !trimmed.startsWith('SELECT');
      })
      .join('\n')
      .split(';')
      .filter(stmt => stmt.trim().length > 0);
    
    log(`Executing ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error: sqlError } = await localClient.rpc('exec_sql', { 
            sql: statement.trim() + ';'
          });
          
          if (sqlError && !sqlError.message.includes('already exists') && !sqlError.message.includes('duplicate key')) {
            error(`SQL Error: ${sqlError.message}`);
          }
        } catch (execError) {
          error(`Execution Error: ${execError.message}`);
        }
      }
    }
    
    log('Seed data created successfully');
    return true;
    
  } catch (err) {
    error(`Error creating seed data: ${err.message}`);
    return false;
  }
}

// Main execution function
async function main() {
  try {
    log('Starting database seeding with production users...');
    
    // Step 1: Pull users from production database
    const users = await pullUsersFromProduction();
    if (users.length === 0) {
      log('No users found or failed to pull from production. Exiting...');
      process.exit(1);
    }
    
    // Create auth users and profiles for production users
    const profileSuccess = await createUsersAndProfiles(users);
    if (!profileSuccess) {
      log('Failed to create some users, continuing with existing ones...');
    }
    
    // Step 2: Create companies with random users assigned from production users
    const companySuccess = await createCompaniesWithUsers(users);
    if (!companySuccess) {
      process.exit(1);
    }
    
    // Step 3: Create brands for companies
    const brandSuccess = await createBrandsForCompanies();
    if (!brandSuccess) {
      process.exit(1);
    }
    
    // Step 4: Create projects for companies
    const projectSuccess = await createProjectsForCompanies(users);
    if (!projectSuccess) {
      process.exit(1);
    }
    
    // Step 5: Create customers for companies
    const customerSuccess = await createCustomersForCompanies();
    if (!customerSuccess) {
      process.exit(1);
    }
    
    // Step 6: Create leads for companies
    const leadSuccess = await createLeadsForCompanies(users);
    if (!leadSuccess) {
      process.exit(1);
    }
    
    log('Database seeding completed successfully!');
    log('Summary:');
    log(`- ${users.length} total users pulled from production`);
    log('- Companies created with random user assignments');
    log('- Brands created for all companies');
    log('- Projects created for all companies');
    log('- Customers created for all companies');
    log('- Leads created for all companies');
    log('- All seed data ready for development');
    
  } catch (err) {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  main();
}

module.exports = { main };