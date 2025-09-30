#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// STRICT LOCAL ONLY CONFIGURATION
const CONFIG = {
  LOCAL_ONLY: true,
  LOCAL_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  LOCAL_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  TARGET_CUSTOMERS: 20,
  TARGET_SERVICE_ADDRESSES: 15,
  TARGET_ADDITIONAL_ADDRESSES: 10,
  TARGET_LEADS_WITH_ADDRESSES: 20,
  TARGET_LEADS_CUSTOMER_ONLY: 20,
  TARGET_LEADS_MINIMAL: 20,
};

// Utility functions
const log = message => console.log(`[${new Date().toISOString()}] ${message}`);
const error = message =>
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Generate random UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Safety check - prevent production usage
function validateLocalOnly() {
  const url = CONFIG.LOCAL_SUPABASE_URL;
  if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
    console.error('❌ SAFETY ERROR: This script can only run on localhost');
    console.error('Current URL:', url);
    process.exit(1);
  }
  console.log('✅ Local environment confirmed');
  console.log('🔧 Supabase URL:', url);
}

// Initialize Supabase client (local only)
function initializeClient() {
  if (!CONFIG.LOCAL_SERVICE_KEY) {
    error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
    process.exit(1);
  }

  return createClient(CONFIG.LOCAL_SUPABASE_URL, CONFIG.LOCAL_SERVICE_KEY);
}

// Random helper functions
const randomChoice = array => array[Math.floor(Math.random() * array.length)];
const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;
const randomBoolean = (probability = 0.5) => Math.random() < probability;

// Regional address data (converted from SQL temp table)
const REGIONAL_ADDRESS_DATA = {
  michigan: {
    state: 'Michigan',
    streetNumbers: [
      '100',
      '234',
      '567',
      '890',
      '1234',
      '2345',
      '3456',
      '4567',
      '5678',
      '6789',
    ],
    streetNames: [
      'Main St',
      'Oak Ave',
      'Pine Rd',
      'Cedar Dr',
      'Maple Lane',
      'Elm St',
      'Cherry Ave',
      'Birch Dr',
      'Walnut St',
      'Hickory Ave',
    ],
    cities: ['Grand Rapids', 'Wyoming', 'Kentwood', 'Walker', 'Grandville'],
    zipCodes: ['49503', '49519', '49508', '49544', '49418'],
    latitudes: [42.9634, 42.9132, 42.8694, 43.0007, 42.9097],
    longitudes: [-85.6681, -85.6556, -85.5553, -85.7443, -85.7631],
  },
  texas: {
    state: 'Texas',
    streetNumbers: [
      '123',
      '456',
      '789',
      '1011',
      '1213',
      '1415',
      '1617',
      '1819',
      '2021',
      '2223',
    ],
    streetNames: [
      'S Lamar Blvd',
      'E 6th St',
      'W Anderson Ln',
      'S Congress Ave',
      'E Cesar Chavez St',
      'Burnet Rd',
      'S 1st St',
      'Guadalupe St',
      'Red River St',
      'Rainey St',
    ],
    cities: ['Austin', 'Cedar Park', 'Round Rock', 'Pflugerville', 'Leander'],
    zipCodes: ['78704', '78613', '78681', '78660', '78641'],
    latitudes: [30.2672, 30.5427, 30.5085, 30.4395, 30.5785],
    longitudes: [-97.7431, -97.8203, -97.6789, -97.6198, -97.8536],
  },
  oregon: {
    state: 'Oregon',
    streetNumbers: [
      '234',
      '567',
      '890',
      '1123',
      '1456',
      '1789',
      '2012',
      '2345',
      '2678',
      '2901',
    ],
    streetNames: [
      'NW 23rd Ave',
      'SE Division St',
      'NE Sandy Blvd',
      'SW Capitol Hwy',
      'N Mississippi Ave',
      'SE Hawthorne Blvd',
      'NE Alberta St',
      'SE Belmont St',
      'N Williams Ave',
      'SW Burnside St',
    ],
    cities: [
      'Portland',
      'Beaverton',
      'Lake Oswego',
      'Milwaukie',
      'Oregon City',
    ],
    zipCodes: ['97210', '97005', '97034', '97222', '97045'],
    latitudes: [45.5152, 45.4871, 45.4207, 45.4459, 45.3573],
    longitudes: [-122.6784, -122.8037, -122.6676, -122.6399, -122.6068],
  },
  newyork: {
    state: 'New York',
    streetNumbers: [
      '345',
      '678',
      '901',
      '1234',
      '1567',
      '1890',
      '2123',
      '2456',
      '2789',
      '3012',
    ],
    streetNames: [
      'Broadway',
      'Park Ave',
      'Madison Ave',
      'Lexington Ave',
      '5th Ave',
      '3rd Ave',
      '2nd Ave',
      '1st Ave',
      'Amsterdam Ave',
      'Columbus Ave',
    ],
    cities: ['New York', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
    zipCodes: ['10005', '11201', '11101', '10451', '10301'],
    latitudes: [40.7128, 40.6782, 40.7282, 40.8176, 40.5795],
    longitudes: [-74.006, -73.9442, -73.7949, -73.9482, -74.1502],
  },
  washington: {
    state: 'Washington',
    streetNumbers: [
      '456',
      '789',
      '1012',
      '1345',
      '1678',
      '1901',
      '2234',
      '2567',
      '2890',
      '3123',
    ],
    streetNames: [
      'Pike St',
      'Pine St',
      'Capitol Hill',
      'Queen Anne Ave',
      'Fremont Ave',
      'Ballard Ave',
      'Georgetown Rd',
      'Wallingford Ave',
      'Greenwood Ave',
      'Phinney Ave',
    ],
    cities: ['Seattle', 'Bellevue', 'Redmond', 'Kirkland', 'Bothell'],
    zipCodes: ['98101', '98004', '98052', '98033', '98011'],
    latitudes: [47.6062, 47.6101, 47.674, 47.6815, 47.762],
    longitudes: [-122.3321, -122.2015, -122.1215, -122.2087, -122.2054],
  },
  arizona: {
    state: 'Arizona',
    streetNumbers: [
      '567',
      '890',
      '1123',
      '1456',
      '1789',
      '2012',
      '2345',
      '2678',
      '2901',
      '3234',
    ],
    streetNames: [
      'E Camelback Rd',
      'N Central Ave',
      'W McDowell Rd',
      'E Indian School Rd',
      'N 7th St',
      'E Thomas Rd',
      'W Glendale Ave',
      'E Van Buren St',
      'N 16th St',
      'W Roosevelt St',
    ],
    cities: ['Phoenix', 'Scottsdale', 'Tempe', 'Mesa', 'Chandler'],
    zipCodes: ['85001', '85251', '85281', '85201', '85224'],
    latitudes: [33.4484, 33.4942, 33.4255, 33.4152, 33.3061],
    longitudes: [-112.074, -111.9261, -111.94, -111.8315, -111.8413],
  },
};

// Customer data arrays
const FIRST_NAMES = [
  'John',
  'Jane',
  'Michael',
  'Sarah',
  'David',
  'Lisa',
  'Chris',
  'Amanda',
  'Robert',
  'Jennifer',
  'William',
  'Jessica',
  'James',
  'Ashley',
  'Mark',
  'Emily',
  'Daniel',
  'Michelle',
  'Matthew',
  'Nicole',
  'Andrew',
  'Stephanie',
  'Joshua',
  'Angela',
  'Kenneth',
  'Melissa',
  'Paul',
  'Kimberly',
  'Steven',
  'Donna',
  'Timothy',
  'Carol',
];

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
];

const EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'email.com',
];

// Service and property data arrays
const ADDRESS_TYPES = ['residential', 'commercial', 'industrial', 'mixed_use'];
const APARTMENT_TYPES = ['Apt', 'Unit', 'Suite', '#'];
const PROPERTY_NOTES = [
  'Gate code: ',
  'Ring doorbell twice',
  'Dog on property - friendly',
  'Use side entrance',
  'Call before arrival',
  'Key under mat',
  'Business hours only',
];

const RELATIONSHIP_TYPES = ['owner', 'tenant', 'property_manager', 'family_member', 'authorized_contact', 'other'];

// Lead configuration arrays
const LEAD_SOURCES = [
  'organic',
  'referral',
  'google_cpc',
  'facebook_ads',
  'linkedin',
  'email_campaign',
  'cold_call',
  'trade_show',
  'webinar',
  'content_marketing',
  'other',
];
const LEAD_TYPES = [
  'phone_call',
  'web_form',
  'email',
  'chat',
  'social_media',
  'in_person',
];
const SERVICE_TYPES = [
  'Residential Pest Control',
  'Commercial Pest Control',
  'Termite Treatment',
  'Rodent Control',
  'Ant Control',
  'General Pest Control',
];
const LEAD_STATUSES = [
  'unassigned',
  'contacting',
  'quoted',
  'ready_to_schedule',
  'scheduled',
  'won',
];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Helper function to get region for a company state
function getCompanyRegion(companyState) {
  const stateRegionMap = {
    Michigan: 'michigan',
    Texas: 'texas',
    Oregon: 'oregon',
    'New York': 'newyork',
    Washington: 'washington',
    Arizona: 'arizona',
  };
  return stateRegionMap[companyState] || 'texas'; // default fallback
}

// Generate random phone number
function generatePhoneNumber() {
  const area = randomBetween(100, 999);
  const exchange = randomBetween(100, 999);
  const number = randomBetween(1000, 9999);
  return `(${area}) ${exchange}-${number}`;
}

// Generate random email
function generateEmail(firstName, lastName) {
  const domain = randomChoice(EMAIL_DOMAINS);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

// Generate random address from regional data
function generateAddress(regionData) {
  const streetNumber = randomChoice(regionData.streetNumbers);
  const streetName = randomChoice(regionData.streetNames);
  return `${streetNumber} ${streetName}`;
}

// Generate coordinates with small random offset
function generateCoordinates(baseLatitudes, baseLongitudes, offset = 0.02) {
  const baseLat = randomChoice(baseLatitudes);
  const baseLng = randomChoice(baseLongitudes);
  const lat = baseLat + randomFloat(-offset, offset);
  const lng = baseLng + randomFloat(-offset, offset);
  return { latitude: lat, longitude: lng };
}

// Generate apartment/unit number
function generateApartmentUnit() {
  if (!randomBoolean(0.3)) return null; // 30% chance of having apartment/unit

  const type = randomChoice(APARTMENT_TYPES);
  const number =
    type === '#'
      ? randomBetween(1, 999)
      : randomBetween(1, type === 'Suite' ? 25 : type === 'Unit' ? 50 : 99);
  return `${type} ${number}`;
}

// Generate property notes
function generatePropertyNotes() {
  if (!randomBoolean(0.6)) return null; // 60% chance of having notes

  const note = randomChoice(PROPERTY_NOTES);
  if (note === 'Gate code: ') {
    return note + String(randomBetween(1000, 9999)).padStart(4, '0');
  }
  return note;
}

// Generate lead comments based on service type and status
function generateLeadComments(serviceType, leadStatus) {
  const comments = {
    'Residential Pest Control': [
      'Customer reported pest activity in residential property',
      'Homeowner needs regular pest control service',
      'New homeowner requesting comprehensive pest control',
      'Follow-up from previous residential service',
    ],
    'Commercial Pest Control': [
      'Business owner needs commercial pest management',
      'Restaurant requires ongoing pest control program',
      'Office building pest control inquiry',
      'Retail location pest prevention needed',
    ],
    'Termite Treatment': [
      'Customer reported possible termite activity',
      'Real estate inspection required for termites',
      'Homeowner found termite damage evidence',
      'Yearly termite inspection due',
    ],
    'Ant Control': [
      'Customer reported ant infestation in kitchen',
      'Ants found throughout the property',
      'Carpenter ants discovered in basement',
      'Fire ants creating safety concerns',
    ],
  };

  const serviceComments = comments[serviceType] ||
    comments['General Pest Control'] || [
      'Customer inquiry about pest control services',
    ];
  return randomChoice(serviceComments);
}

// Clear existing service addresses and relationships (preserve customers and leads)
async function clearExistingData(client) {
  try {
    log('Clearing existing service addresses and relationships (preserving customers and leads)...');

    // Clear in order to respect foreign key constraints
    // NOTE: We preserve existing customers and leads, only clear service address data

    const { error: csaError } = await client
      .from('customer_service_addresses')
      .delete()
      .gte(
        'created_at',
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (csaError) {
      error(`Failed to clear customer_service_addresses: ${csaError.message}`);
      return false;
    }

    const { error: saError } = await client
      .from('service_addresses')
      .delete()
      .gte(
        'created_at',
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (saError) {
      error(`Failed to clear service_addresses: ${saError.message}`);
      return false;
    }

    log('✅ Service address data cleared successfully (customers and leads preserved)');
    return true;
  } catch (err) {
    error(`Error clearing existing data: ${err.message}`);
    return false;
  }
}

// Get companies for seeding
async function getCompanies(client) {
  try {
    const { data: companies, error } = await client
      .from('companies')
      .select('id, name, city, state');

    if (error) {
      throw new Error(`Failed to fetch companies: ${error.message}`);
    }

    if (!companies || companies.length === 0) {
      throw new Error(
        'No companies found. Please run the main seed script first.'
      );
    }

    log(`Found ${companies.length} companies`);
    return companies;
  } catch (err) {
    error(`Error getting companies: ${err.message}`);
    throw err;
  }
}

// Get existing customers from database
async function getExistingCustomers(client) {
  try {
    log('Getting existing customers from database...');

    const { data: customers, error } = await client
      .from('customers')
      .select('id, company_id, first_name, last_name, address, city, state');

    if (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }

    if (!customers || customers.length === 0) {
      throw new Error('No customers found. Please run the main seed script (seed-with-users.js) first to create customers.');
    }

    log(`Found ${customers.length} existing customers`);
    return customers;
  } catch (err) {
    error(`Error getting existing customers: ${err.message}`);
    throw err;
  }
}

// Create service addresses with coordinates and property details
async function createServiceAddresses(client, companies) {
  try {
    log('Creating service addresses...');

    const serviceAddresses = [];
    const targetAddresses = CONFIG.TARGET_SERVICE_ADDRESSES;
    let createdCount = 0;

    // Generate service addresses for each company based on their region
    for (const company of companies) {
      const region = getCompanyRegion(company.state);
      const regionData = REGIONAL_ADDRESS_DATA[region];

      if (!regionData) {
        continue;
      }

      // Create 25-35 service addresses per company
      const addressesForCompany = randomBetween(25, 35);

      for (
        let i = 0;
        i < addressesForCompany && createdCount < targetAddresses;
        i++
      ) {
        const coords = generateCoordinates(
          regionData.latitudes,
          regionData.longitudes,
          0.05
        );

        const serviceAddress = {
          id: generateUUID(),
          company_id: company.id,
          street_address: generateAddress(regionData),
          apartment_unit: generateApartmentUnit(),
          address_line_2: randomBoolean(0.15)
            ? randomChoice([
                'Building A',
                'Building B',
                'Building C',
                'Floor 2',
                'Floor 3',
                'Wing A',
                'Wing B',
              ])
            : null,
          city: randomChoice(regionData.cities),
          state: regionData.state,
          zip_code: randomChoice(regionData.zipCodes),
          latitude: coords.latitude,
          longitude: coords.longitude,
          address_type: randomChoice(ADDRESS_TYPES),
          property_notes: generatePropertyNotes(),
          created_at: new Date(
            Date.now() - randomBetween(0, 90) * 24 * 60 * 60 * 1000
          ).toISOString(), // Last 3 months
          updated_at: new Date().toISOString(),
        };

        serviceAddresses.push(serviceAddress);
        createdCount++;
      }
    }

    // Insert service addresses in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < serviceAddresses.length; i += batchSize) {
      const batch = serviceAddresses.slice(i, i + batchSize);

      const { error: insertError } = await client
        .from('service_addresses')
        .insert(batch);

      if (insertError) {
        error(
          `Failed to insert service addresses batch: ${insertError.message}`
        );
        return null;
      }

      insertedCount += batch.length;
      log(
        `Inserted service addresses batch: ${insertedCount}/${serviceAddresses.length}`
      );
    }

    log(`✅ Created ${serviceAddresses.length} service addresses`);
    return serviceAddresses;
  } catch (err) {
    error(`Error creating service addresses: ${err.message}`);
    return null;
  }
}

// Create additional service addresses for customers with multiple properties
async function createAdditionalServiceAddresses(client, companies) {
  try {
    log('Creating additional service addresses for multiple properties...');

    const additionalAddresses = [];
    const targetAdditional = CONFIG.TARGET_ADDITIONAL_ADDRESSES;
    let createdCount = 0;

    // Generate additional service addresses for each company
    for (const company of companies) {
      const region = getCompanyRegion(company.state);
      const regionData = REGIONAL_ADDRESS_DATA[region];

      if (!regionData) {
        continue;
      }

      // Create 8-12 additional addresses per company
      const additionalForCompany = randomBetween(8, 12);

      for (
        let i = 0;
        i < additionalForCompany && createdCount < targetAdditional;
        i++
      ) {
        const coords = generateCoordinates(
          regionData.latitudes,
          regionData.longitudes,
          0.05
        );

        const additionalAddress = {
          id: generateUUID(),
          company_id: company.id,
          street_address: generateAddress(regionData),
          apartment_unit: randomBoolean(0.4)
            ? `Unit ${randomBetween(1, 30)}`
            : null,
          address_line_2: null,
          city: randomChoice(regionData.cities),
          state: regionData.state,
          zip_code: randomChoice(regionData.zipCodes),
          latitude: coords.latitude,
          longitude: coords.longitude,
          address_type: randomChoice([
            'residential',
            'commercial',
            'mixed_use',
          ]),
          property_notes: randomChoice([
            'Rental property',
            'Vacation home',
            'Business location',
            'Investment property',
            'Secondary residence',
          ]),
          created_at: new Date(
            Date.now() - randomBetween(0, 60) * 24 * 60 * 60 * 1000
          ).toISOString(), // Last 2 months
          updated_at: new Date().toISOString(),
        };

        additionalAddresses.push(additionalAddress);
        createdCount++;
      }
    }

    // Insert additional service addresses in batches
    const batchSize = 30;
    let insertedCount = 0;

    for (let i = 0; i < additionalAddresses.length; i += batchSize) {
      const batch = additionalAddresses.slice(i, i + batchSize);

      const { error: insertError } = await client
        .from('service_addresses')
        .insert(batch);

      if (insertError) {
        error(
          `Failed to insert additional service addresses batch: ${insertError.message}`
        );
        return null;
      }

      insertedCount += batch.length;
      log(
        `Inserted additional addresses batch: ${insertedCount}/${additionalAddresses.length}`
      );
    }

    log(
      `✅ Created ${additionalAddresses.length} additional service addresses`
    );
    return additionalAddresses;
  } catch (err) {
    error(`Error creating additional service addresses: ${err.message}`);
    return null;
  }
}

// Link customers to service addresses
async function linkCustomersToServiceAddresses(client) {
  try {
    log('Linking customers to service addresses...');

    // Get all existing customers and newly created service addresses
    const { data: customers, error: customerError } = await client
      .from('customers')
      .select('id, company_id');

    if (customerError) {
      throw new Error(`Failed to fetch customers: ${customerError.message}`);
    }

    const { data: serviceAddresses, error: saError } = await client
      .from('service_addresses')
      .select('id, company_id')
      .gte(
        'created_at',
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (saError) {
      throw new Error(`Failed to fetch service addresses: ${saError.message}`);
    }

    const relationships = [];

    // Create customer-service address relationships (70% chance of linking)
    for (const customer of customers) {
      // Find service addresses in the same company
      const companyServiceAddresses = serviceAddresses.filter(
        sa => sa.company_id === customer.company_id
      );

      if (companyServiceAddresses.length === 0) continue;

      // Each customer gets linked to 1-3 service addresses
      const numLinks = randomBetween(
        1,
        Math.min(3, companyServiceAddresses.length)
      );
      const shuffled = companyServiceAddresses.sort(() => 0.5 - Math.random());

      for (let i = 0; i < numLinks; i++) {
        if (randomBoolean(0.7)) {
          // 70% chance of creating the link
          relationships.push({
            customer_id: customer.id,
            service_address_id: shuffled[i].id,
            relationship_type: randomChoice(RELATIONSHIP_TYPES),
            is_primary_address: i === 0, // First one is primary
            created_at: new Date(
              Date.now() - randomBetween(0, 60) * 24 * 60 * 60 * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    // Insert relationships in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < relationships.length; i += batchSize) {
      const batch = relationships.slice(i, i + batchSize);

      const { error: insertError } = await client
        .from('customer_service_addresses')
        .insert(batch);

      if (insertError) {
        error(
          `Failed to insert customer-service address relationships batch: ${insertError.message}`
        );
        return false;
      }

      insertedCount += batch.length;
      log(
        `Inserted relationships batch: ${insertedCount}/${relationships.length}`
      );
    }

    log(
      `✅ Created ${relationships.length} customer-service address relationships`
    );
    return true;
  } catch (err) {
    error(`Error linking customers to service addresses: ${err.message}`);
    return false;
  }
}

// Create leads with mixed scenarios (70% with service addresses, 20% customer-only, 10% minimal)
async function createLeadsWithMixedScenarios(client) {
  try {
    log('Creating leads with mixed scenarios...');

    // Get necessary data
    const { data: serviceAddresses, error: saError } = await client
      .from('service_addresses')
      .select('id, company_id')
      .gte(
        'created_at',
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (saError) {
      throw new Error(`Failed to fetch service addresses: ${saError.message}`);
    }

    const { data: customerServiceAddresses, error: csaError } = await client
      .from('customer_service_addresses')
      .select('customer_id, service_address_id')
      .gte(
        'created_at',
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (csaError) {
      throw new Error(
        `Failed to fetch customer-service address relationships: ${csaError.message}`
      );
    }

    const { data: customers, error: customerError } = await client
      .from('customers')
      .select('id, company_id');

    if (customerError) {
      throw new Error(`Failed to fetch customers: ${customerError.message}`);
    }

    const { data: companies, error: companyError } = await client
      .from('companies')
      .select('id, name');

    if (companyError) {
      throw new Error(`Failed to fetch companies: ${companyError.message}`);
    }

    const allLeads = [];

    // Scenario A: Leads with service addresses (70%)
    const leadsWithAddresses = [];
    for (const csa of customerServiceAddresses) {
      if (
        randomBoolean(0.35) &&
        leadsWithAddresses.length < CONFIG.TARGET_LEADS_WITH_ADDRESSES
      ) {
        const serviceAddress = serviceAddresses.find(
          sa => sa.id === csa.service_address_id
        );
        const customer = customers.find(c => c.id === csa.customer_id);

        if (serviceAddress && customer) {
          const serviceType = randomChoice(SERVICE_TYPES);
          const leadStatus = randomChoice(LEAD_STATUSES);

          const lead = {
            id: generateUUID(),
            company_id: serviceAddress.company_id,
            customer_id: customer.id,
            service_address_id: serviceAddress.id,
            lead_source: randomChoice(LEAD_SOURCES),
            lead_type: randomChoice(LEAD_TYPES),
            service_type: serviceType,
            lead_status: leadStatus,
            comments: generateLeadComments(serviceType, leadStatus),
            assigned_to: null,
            last_contacted_at: randomBoolean(0.6)
              ? new Date(
                  Date.now() - randomBetween(0, 30) * 24 * 60 * 60 * 1000
                ).toISOString()
              : null,
            next_follow_up_at:
              ['unassigned', 'contacting', 'quoted'].includes(leadStatus) &&
              randomBoolean(0.4)
                ? new Date(
                    Date.now() + randomBetween(1, 14) * 24 * 60 * 60 * 1000
                  ).toISOString()
                : null,
            estimated_value: randomBetween(100, 900),
            priority: randomChoice(PRIORITIES),
            utm_source: randomBoolean(0.3) ? 'google' : null,
            utm_medium: randomBoolean(0.3) ? 'cpc' : null,
            utm_campaign: randomBoolean(0.2) ? 'spring-campaign-2024' : null,
            created_at: new Date(
              Date.now() - randomBetween(0, 90) * 24 * 60 * 60 * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          };

          leadsWithAddresses.push(lead);
        }
      }
    }

    // Scenario B: Leads with customers but NO service addresses (20%)
    const leadsCustomerOnly = [];
    for (const customer of customers) {
      if (
        randomBoolean(0.4) &&
        leadsCustomerOnly.length < CONFIG.TARGET_LEADS_CUSTOMER_ONLY
      ) {
        const serviceType = randomChoice([
          'Residential Pest Control',
          'Ant Control',
          'Rodent Control',
          'General Pest Control',
        ]);
        const leadStatus = randomChoice([
          'unassigned',
          'contacting',
          'quoted',
          'ready_to_schedule',
          'scheduled',
        ]);

        const lead = {
          id: generateUUID(),
          company_id: customer.company_id,
          customer_id: customer.id,
          service_address_id: null,
          lead_source: randomChoice(LEAD_SOURCES),
          lead_type: randomChoice(LEAD_TYPES),
          service_type: serviceType,
          lead_status: leadStatus,
          comments: 'Initial inquiry - no service address setup yet',
          assigned_to: null,
          last_contacted_at: randomBoolean(0.5)
            ? new Date(
                Date.now() - randomBetween(0, 14) * 24 * 60 * 60 * 1000
              ).toISOString()
            : null,
          next_follow_up_at: randomBoolean(0.6)
            ? new Date(
                Date.now() + randomBetween(1, 7) * 24 * 60 * 60 * 1000
              ).toISOString()
            : null,
          estimated_value: randomBetween(150, 650),
          priority: randomChoice(['medium', 'high']),
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          created_at: new Date(
            Date.now() - randomBetween(0, 30) * 24 * 60 * 60 * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        };

        leadsCustomerOnly.push(lead);
      }
    }

    // Scenario C: Minimal data leads - no customer, no service address (10%)
    const leadsMinimal = [];
    for (let i = 0; i < CONFIG.TARGET_LEADS_MINIMAL; i++) {
      const randomCompany = randomChoice(companies);

      const lead = {
        id: generateUUID(),
        company_id: randomCompany.id,
        customer_id: null,
        service_address_id: null,
        lead_source: randomChoice([
          'organic',
          'google_cpc',
          'cold_call',
          'referral',
          'other',
        ]),
        lead_type: randomChoice(['phone_call', 'web_form', 'email']),
        service_type: 'General Pest Control',
        lead_status: 'unassigned',
        comments: 'Quick inquiry - limited information',
        assigned_to: null,
        last_contacted_at: null,
        next_follow_up_at: randomBoolean(0.3)
          ? new Date(
              Date.now() + randomBetween(1, 3) * 24 * 60 * 60 * 1000
            ).toISOString()
          : null,
        estimated_value: randomBetween(75, 375),
        priority: 'low',
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        created_at: new Date(
          Date.now() - randomBetween(0, 7) * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      };

      leadsMinimal.push(lead);
    }

    // Combine all leads
    allLeads.push(...leadsWithAddresses, ...leadsCustomerOnly, ...leadsMinimal);

    // Insert all leads in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < allLeads.length; i += batchSize) {
      const batch = allLeads.slice(i, i + batchSize);

      const { error: insertError } = await client.from('leads').insert(batch);

      if (insertError) {
        error(`Failed to insert leads batch: ${insertError.message}`);
        return null;
      }

      insertedCount += batch.length;
      log(`Inserted leads batch: ${insertedCount}/${allLeads.length}`);
    }

    log(`✅ Created ${allLeads.length} leads:`);
    log(
      `   - ${leadsWithAddresses.length} with service addresses (${Math.round((leadsWithAddresses.length / allLeads.length) * 100)}%)`
    );
    log(
      `   - ${leadsCustomerOnly.length} customer-only (${Math.round((leadsCustomerOnly.length / allLeads.length) * 100)}%)`
    );
    log(
      `   - ${leadsMinimal.length} minimal data (${Math.round((leadsMinimal.length / allLeads.length) * 100)}%)`
    );

    return {
      total: allLeads.length,
      withAddresses: leadsWithAddresses.length,
      customerOnly: leadsCustomerOnly.length,
      minimal: leadsMinimal.length,
    };
  } catch (err) {
    error(`Error creating leads: ${err.message}`);
    return null;
  }
}

// Generate summary statistics
async function generateSummaryStatistics(client) {
  try {
    log('Generating summary statistics...');

    // Get counts for recently created data
    const oneYearAgo = new Date(
      Date.now() - 365 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: customerCount, error: customerError } = await client
      .from('customers')
      .select('id', { count: 'exact' });

    const { data: serviceAddressCount, error: saError } = await client
      .from('service_addresses')
      .select('id', { count: 'exact' })
      .gte('created_at', oneYearAgo);

    const { data: relationshipCount, error: relError } = await client
      .from('customer_service_addresses')
      .select('customer_id', { count: 'exact' })
      .gte('created_at', oneYearAgo);

    const { data: leadCount, error: leadError } = await client
      .from('leads')
      .select('id', { count: 'exact' })
      .gte('created_at', oneYearAgo);

    // Company breakdown would require a custom function - skipping for now

    if (customerError || saError || relError || leadError) {
      log(
        '⚠️ Some statistics could not be generated, but seeding completed successfully'
      );
      return;
    }

    console.log('\n📊 SEEDING SUMMARY');
    console.log('==================');
    console.log(
      `✅ Service Address Seeding Complete! ${new Date().toISOString()}`
    );
    console.log('');
    console.log('📈 What was created:');
    console.log(
      `   📋 Used ${customerCount?.length || 0} existing customers (created by seed-with-users.js)`
    );
    console.log(
      `   🏠 ${serviceAddressCount?.length || 0} service addresses with coordinates and property details`
    );
    console.log(
      `   🔗 ${relationshipCount?.length || 0} customer-to-service-address relationships established`
    );
    console.log(
      `   📞 ${leadCount?.length || 0} leads with mixed service address scenarios for testing`
    );
    console.log('');
    console.log('🎯 Testing scenarios created:');
    console.log('   • Service Address System - Leads with full address data');
    console.log(
      '   • Customer Billing Fallback - Leads using customer billing address'
    );
    console.log(
      '   • Minimal Data (No Address) - Leads with minimal information'
    );
    console.log('');
    console.log('✨ Benefits:');
    console.log('   • Geographic distribution matching company locations');
    console.log('   • Realistic relationships and edge cases for testing');
    console.log(
      '   • Comprehensive test data with realistic pest control scenarios'
    );
    console.log('   • All seed data ready for development and testing');
  } catch (err) {
    error(`Error generating summary statistics: ${err.message}`);
    log('⚠️ Statistics generation failed, but seeding completed successfully');
  }
}

// Main execution function
async function main() {
  console.log('🌱 Starting Service Address & Lead Seeding...');
  console.log('🏠 Adding service addresses and leads to existing customers');
  console.log('================================================');

  try {
    // Validate environment
    validateLocalOnly();

    // Initialize client
    const client = initializeClient();

    // Step 1: Clear existing data
    const clearSuccess = await clearExistingData(client);
    if (!clearSuccess) {
      process.exit(1);
    }

    // Step 2: Get companies
    const companies = await getCompanies(client);

    // Step 3: Get existing customers (created by seed-with-users.js)
    const customers = await getExistingCustomers(client);

    // Step 4: Create service addresses
    const serviceAddresses = await createServiceAddresses(client, companies);
    if (!serviceAddresses) {
      process.exit(1);
    }

    // Step 5: Create additional service addresses for multiple properties
    const additionalAddresses = await createAdditionalServiceAddresses(
      client,
      companies
    );
    if (!additionalAddresses) {
      process.exit(1);
    }

    // Step 6: Link customers to service addresses
    const linkSuccess = await linkCustomersToServiceAddresses(client);
    if (!linkSuccess) {
      process.exit(1);
    }

    // Step 7: Create leads with mixed scenarios
    const leadStats = await createLeadsWithMixedScenarios(client);
    if (!leadStats) {
      process.exit(1);
    }

    // Step 8: Generate summary statistics
    await generateSummaryStatistics(client);

    console.log('\n🎉 All seeding operations completed successfully!');
  } catch (err) {
    error(`Fatal error during seeding: ${err.message}`);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
