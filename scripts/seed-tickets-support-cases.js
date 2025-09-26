#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Supabase client
const localClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Utility functions
const log = message => console.log(`[${new Date().toISOString()}] ${message}`);
const error = message => console.error(`[${new Date().toISOString()}] ERROR: ${message}`);

// Generate random UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Pest control service types
const serviceTypes = [
  'General Pest Control',
  'Ant Control', 
  'Roach Control',
  'Spider Control',
  'Rodent Control',
  'Termite Inspection',
  'Termite Treatment',
  'Bed Bug Treatment',
  'Wasp & Hornet Removal',
  'Flea Control',
  'Tick Control',
  'Mosquito Control',
  'Wildlife Removal',
  'Commercial Pest Control'
];

// Ticket sources and types (based on database constraints)
const ticketSources = ['organic', 'referral', 'google_cpc', 'facebook_ads', 'linkedin', 'email_campaign', 'cold_call', 'trade_show', 'webinar', 'content_marketing', 'internal', 'other'];
const ticketTypes = ['phone_call', 'web_form', 'email', 'chat', 'social_media', 'in_person', 'internal_task', 'bug_report', 'feature_request', 'other'];
const ticketStatuses = ['new', 'contacted', 'qualified', 'quoted', 'in_progress', 'resolved', 'closed', 'won', 'lost', 'unqualified'];
const priorities = ['low', 'medium', 'high', 'urgent'];

// Support case issue types and statuses
const supportIssueTypes = ['billing', 'scheduling', 'complaint', 'service_quality', 'treatment_request', 're_service', 'general_inquiry', 'warranty_claim'];
const supportStatuses = ['unassigned', 'in_progress', 'awaiting_response', 'resolved'];

// Generate realistic ticket descriptions (no title field in current schema)
function generateTicketContent(serviceType, source, status) {
  const scenarios = {
    'Ant Control': [
      'Customer reports seeing small black ants around kitchen sink and food areas. Issue started about a week ago and is getting worse.',
      'Large ants found in multiple rooms of the house. Customer is concerned about food contamination and wants immediate treatment.',
      'Carpenter ants discovered in basement near moisture areas. Customer worried about structural damage.',
      'Follow-up needed for ant treatment that didn\'t fully resolve the issue. Customer requesting re-service.',
      'Aggressive fire ants in yard are creating safety concerns for children and pets.'
    ],
    'Termite Treatment': [
      'Real estate transaction requires professional termite inspection. Need report within 3 business days.',
      'Homeowner found what appears to be termite damage in basement support beams. Urgent inspection needed.',
      'Yearly termite inspection is due for active protection plan. Schedule routine service.',
      'Contractor found evidence of termite activity during bathroom renovation. Assessment needed immediately.',
      'Customer saw flying insects that appear to be termite swarmers. Need identification and treatment plan.'
    ],
    'General Pest Control': [
      'New homeowner requesting comprehensive pest control service. No specific issues but wants preventive treatment.',
      'Commercial client reporting various pest sightings. Need full property assessment and treatment plan.',
      'Scheduled quarterly service for ongoing pest prevention. Check all stations and perimeter treatment.',
      'Customer moving into new home and wants baseline pest control established before furniture arrives.',
      'Restaurant owner needs ongoing pest management program to maintain health department compliance.'
    ]
  };

  const descriptions = scenarios[serviceType] || scenarios['General Pest Control'];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Generate realistic support case content
function generateSupportCaseContent(issueType) {
  const scenarios = {
    'billing': {
      summaries: [
        'Billing discrepancy on last invoice',
        'Payment not processed correctly',
        'Request for service credit',
        'Incorrect charges on account',
        'Need billing statement copy'
      ],
      descriptions: [
        'Customer was charged for services not performed. Invoice shows termite treatment but only inspection was done.',
        'Auto-payment failed but customer was charged late fee. Credit card was valid and had sufficient funds.',
        'Service was incomplete due to weather. Customer requesting partial refund or credit towards next service.',
        'Bill includes charges for additional areas that were not treated during the service call.',
        'Customer needs copy of billing statements for the past 6 months for tax purposes.'
      ]
    },
    'scheduling': {
      summaries: [
        'Need to reschedule appointment',
        'Technician was late for service',
        'Service window too broad',
        'Emergency service request',
        'Recurring service schedule change'
      ],
      descriptions: [
        'Customer needs to move Thursday appointment to Friday due to work conflict. Flexible on time.',
        'Technician arrived 2 hours late without notification. Customer had to leave for another commitment.',
        '8am-5pm service window is too broad. Customer works from home and needs more specific timing.',
        'Wasp nest discovered near child\'s play area. Need emergency removal today if possible.',
        'Customer wants to change monthly service from Tuesdays to Saturdays for convenience.'
      ]
    },
    'complaint': {
      summaries: [
        'Treatment was ineffective',
        'Technician professionalism concern',
        'Property damage during service',
        'Chemical sensitivity reaction',
        'Service not performed as promised'
      ],
      descriptions: [
        'Ant problem returned within a week of treatment. Customer expected longer-lasting results.',
        'Technician did not wear shoe covers and tracked mud through the house. Customer upset about cleanliness.',
        'Sprayer damaged customer\'s flower bed during perimeter treatment. Requesting compensation.',
        'Customer developed respiratory irritation after indoor treatment. Concerned about chemical exposure.',
        'Service was supposed to include attic inspection but technician only treated exterior. Want full service completed.'
      ]
    },
    'service_quality': {
      summaries: [
        'Treatment missed target areas',
        'Insufficient explanation of service',
        'Follow-up not performed',
        'Service seemed rushed',
        'Equipment left behind'
      ],
      descriptions: [
        'Technician treated main floor but missed basement where most of the activity was reported.',
        'Customer received no explanation of what treatments were applied or what to expect.',
        'Two-week follow-up visit was scheduled but technician never came. No communication received.',
        'Service took only 15 minutes for a house with significant pest issues. Customer feels service was inadequate.',
        'Technician left equipment in backyard. Customer found it the next day and returned it to office.'
      ]
    },
    'treatment_request': {
      summaries: [
        'Additional treatment needed',
        'Request for specific pest control',
        'Upgrade to stronger treatment',
        'Seasonal treatment request',
        'Preventive treatment inquiry'
      ],
      descriptions: [
        'Customer wants additional perimeter treatment after seeing new ant activity.',
        'Requesting bed bug heat treatment instead of chemical treatment for bedroom.',
        'Current monthly service not sufficient for heavy roach infestation. Need stronger approach.',
        'Customer wants to add mosquito control for summer season.',
        'Inquiring about preventive termite treatment before spring swarming season.'
      ]
    },
    're_service': {
      summaries: [
        'Pest problem returned',
        'Service guarantee claim',
        'Follow-up treatment needed',
        'Ineffective treatment complaint',
        'Request for re-treatment'
      ],
      descriptions: [
        'Ants returned within warranty period. Customer requesting re-service under guarantee.',
        'Roaches still visible 3 days after treatment. Requesting return visit.',
        'Original treatment was 2 weeks ago but spider problem has returned.',
        'Termite treatment guarantee covers re-treatment if activity returns.',
        'Customer reports seeing new rodent droppings after recent service.'
      ]
    },
    'general_inquiry': {
      summaries: [
        'Questions about service',
        'Product information request',
        'Service availability inquiry',
        'General pest control advice',
        'Quote request follow-up'
      ],
      descriptions: [
        'Customer has questions about what products were used during last treatment.',
        'Inquiring about organic pest control options for family with allergies.',
        'Asking about service availability for upcoming holiday weekend.',
        'Customer wants advice on DIY prevention between professional treatments.',
        'Following up on quote provided last week. Ready to schedule service.'
      ]
    },
    'warranty_claim': {
      summaries: [
        'Service warranty claim',
        'Product guarantee issue',
        'Treatment effectiveness claim',
        'Damage claim from service',
        'Warranty coverage question'
      ],
      descriptions: [
        'Termite activity detected within 12-month warranty period. Claiming free re-treatment.',
        'Chemical treatment failed within guarantee period. Customer requesting refund.',
        'Service agreement includes 90-day guarantee but pests returned after 30 days.',
        'Landscaping damaged during service. Warranty should cover replacement costs.',
        'Customer unclear about what is covered under current service warranty.'
      ]
    }
  };

  const caseData = scenarios[issueType] || scenarios['general_inquiry'];
  const index = Math.floor(Math.random() * caseData.summaries.length);
  
  return {
    summary: caseData.summaries[index],
    description: caseData.descriptions[index]
  };
}

// Generate resolution actions based on issue type
function generateResolutionAction(issueType, status) {
  if (status !== 'resolved' && status !== 'closed') {
    return null;
  }

  const resolutions = {
    'billing': [
      'Issued credit for $75 to customer account for billing error',
      'Processed refund for duplicate charge within 3-5 business days',
      'Applied service credit to next scheduled treatment',
      'Corrected billing records and sent updated invoice'
    ],
    'scheduling': [
      'Rescheduled appointment for preferred date and time',
      'Implemented 2-hour service window for future appointments',
      'Completed emergency service same day',
      'Updated recurring service schedule per customer request'
    ],
    'complaint': [
      'Scheduled re-treatment at no charge within 48 hours',
      'Provided additional technician training on customer service protocols',
      'Compensated customer for property damage and arranged repair',
      'Switched to organic treatment options for sensitive customer'
    ],
    'service_quality': [
      'Returned to complete missed areas of treatment',
      'Provided detailed service report and explanation of treatments',
      'Completed follow-up service and scheduled additional check',
      'Extended service time and provided thorough re-treatment'
    ]
  };

  const options = resolutions[issueType] || resolutions['billing'];
  return options[Math.floor(Math.random() * options.length)];
}

// Create test tickets
async function createTestTickets() {
  try {
    log('Creating test tickets...');

    // Get existing companies, customers, and users
    const { data: companies, error: companyError } = await localClient
      .from('companies')
      .select('id, name')
      .limit(10);

    if (companyError) {
      error(`Failed to fetch companies: ${companyError.message}`);
      return false;
    }

    const { data: customers, error: customerError } = await localClient
      .from('customers')
      .select('id, company_id, first_name, last_name')
      .limit(50);

    if (customerError) {
      error(`Failed to fetch customers: ${customerError.message}`);
      return false;
    }

    const { data: users, error: userError } = await localClient
      .from('profiles')
      .select('id, email')
      .limit(10);

    if (userError) {
      error(`Failed to fetch users: ${userError.message}`);
      return false;
    }

    if (companies.length === 0 || customers.length === 0 || users.length === 0) {
      error('Insufficient existing data. Please run main seed script first.');
      return false;
    }

    // Clear existing tickets
    const { error: clearError } = await localClient
      .from('tickets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (clearError) {
      error(`Failed to clear existing tickets: ${clearError.message}`);
      return false;
    }

    // Generate 20 test tickets
    const tickets = [];
    for (let i = 1; i <= 20; i++) {
      const randomCompany = companies[Math.floor(Math.random() * companies.length)];
      const companyCustomers = customers.filter(c => c.company_id === randomCompany.id);
      const randomCustomer = companyCustomers.length > 0 
        ? companyCustomers[Math.floor(Math.random() * companyCustomers.length)]
        : customers[Math.floor(Math.random() * customers.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      const source = ticketSources[Math.floor(Math.random() * ticketSources.length)];
      const type = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const status = ticketStatuses[Math.floor(Math.random() * ticketStatuses.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      
      const description = generateTicketContent(serviceType, source, status);
      
      // Generate realistic timestamps
      const daysAgo = Math.floor(Math.random() * 30); // Last 30 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 12) + 8); // Business hours

      let lastContactedAt = null;
      let nextFollowUpAt = null;
      let resolvedAt = null;

      if (['contacted', 'qualified', 'quoted', 'in_progress'].includes(status)) {
        lastContactedAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      }

      if (['new', 'contacted', 'qualified'].includes(status)) {
        nextFollowUpAt = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      }

      if (['resolved', 'won', 'lost'].includes(status)) {
        resolvedAt = new Date(createdAt.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000);
      }

      tickets.push({
        id: generateUUID(),
        company_id: randomCompany.id,
        customer_id: randomCustomer.id,
        source: source,
        type: type,
        service_type: serviceType,
        status: status,
        description: description,
        assigned_to: Math.random() > 0.3 ? randomUser.id : null, // 70% assigned
        priority: priority,
        pest_type: serviceType.includes('Ant') ? 'ants' : 
                  serviceType.includes('Termite') ? 'termites' :
                  serviceType.includes('Rodent') ? 'rodents' : 'general',
        estimated_value: Math.floor(Math.random() * 2000) + 200, // $200-$2200
        last_contacted_at: lastContactedAt?.toISOString(),
        next_follow_up_at: nextFollowUpAt?.toISOString(),
        resolved_at: resolvedAt?.toISOString(),
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString()
      });
    }

    // Insert tickets
    const { error: insertError } = await localClient
      .from('tickets')
      .insert(tickets);

    if (insertError) {
      error(`Failed to create tickets: ${insertError.message}`);
      return false;
    }

    log(`Successfully created ${tickets.length} test tickets`);
    return true;
  } catch (err) {
    error(`Error creating test tickets: ${err.message}`);
    return false;
  }
}

// Create test support cases
async function createTestSupportCases() {
  try {
    log('Creating test support cases...');

    // Get existing companies, customers, users, and some tickets
    const { data: companies, error: companyError } = await localClient
      .from('companies')
      .select('id, name')
      .limit(10);

    const { data: customers, error: customerError } = await localClient
      .from('customers')
      .select('id, company_id, first_name, last_name')
      .limit(50);

    const { data: users, error: userError } = await localClient
      .from('profiles')
      .select('id, email')
      .limit(10);

    const { data: tickets, error: ticketError } = await localClient
      .from('tickets')
      .select('id, company_id, customer_id')
      .limit(10);

    if (companyError || customerError || userError) {
      error('Failed to fetch required data');
      return false;
    }

    // Clear existing support cases
    const { error: clearError } = await localClient
      .from('support_cases')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (clearError) {
      error(`Failed to clear existing support cases: ${clearError.message}`);
      return false;
    }

    // Generate 15 test support cases
    const supportCases = [];
    for (let i = 1; i <= 15; i++) {
      const randomCompany = companies[Math.floor(Math.random() * companies.length)];
      const companyCustomers = customers.filter(c => c.company_id === randomCompany.id);
      const randomCustomer = companyCustomers.length > 0 
        ? companyCustomers[Math.floor(Math.random() * companyCustomers.length)]
        : customers[Math.floor(Math.random() * customers.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      const issueType = supportIssueTypes[Math.floor(Math.random() * supportIssueTypes.length)];
      const status = supportStatuses[Math.floor(Math.random() * supportStatuses.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      
      const content = generateSupportCaseContent(issueType);
      const resolution = generateResolutionAction(issueType, status);
      
      // Link some cases to tickets (30% chance)
      const linkedTicket = tickets && tickets.length > 0 && Math.random() < 0.3 
        ? tickets[Math.floor(Math.random() * tickets.length)]
        : null;

      // Generate realistic timestamps
      const daysAgo = Math.floor(Math.random() * 14); // Last 14 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 12) + 8); // Business hours

      let firstResponseAt = null;
      let resolvedAt = null;
      let closedAt = null;
      let satisfactionRating = null;
      let satisfactionFeedback = null;

      if (['in_progress', 'awaiting_response', 'resolved'].includes(status)) {
        firstResponseAt = new Date(createdAt.getTime() + Math.random() * 4 * 60 * 60 * 1000); // Within 4 hours
      }

      if (status === 'resolved') {
        resolvedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000); // Within a week
        
        // Add satisfaction rating for resolved cases (60% chance)
        if (Math.random() < 0.6) {
          satisfactionRating = Math.floor(Math.random() * 5) + 1; // 1-5 rating
          satisfactionFeedback = satisfactionRating >= 4 
            ? 'Very satisfied with the quick resolution and professional service.'
            : satisfactionRating === 3
            ? 'Service was okay, could have been faster.'
            : 'Not completely satisfied with the resolution process.';
        }
      }

      // Note: 'closed' status no longer exists in the new system
      // All resolved cases are considered complete

      supportCases.push({
        id: generateUUID(),
        company_id: randomCompany.id,
        customer_id: randomCustomer.id,
        ticket_id: linkedTicket?.id || null,
        issue_type: issueType,
        summary: content.summary,
        description: content.description,
        resolution_action: resolution,
        notes: Math.random() > 0.5 ? 'Customer follow-up scheduled for next week.' : null,
        status: status,
        assigned_to: status === 'unassigned' ? null : (Math.random() > 0.2 ? randomUser.id : null), // Unassigned cases have no assignment, otherwise 80% assigned
        priority: priority,
        first_response_at: firstResponseAt?.toISOString(),
        resolved_at: resolvedAt?.toISOString(),
        closed_at: status === 'resolved' && resolvedAt ? new Date(resolvedAt.getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
        satisfaction_rating: satisfactionRating,
        satisfaction_feedback: satisfactionFeedback,
        satisfaction_collected_at: satisfactionRating ? resolvedAt?.toISOString() : null,
        created_at: createdAt.toISOString(),
        updated_at: (resolvedAt || firstResponseAt || createdAt).toISOString()
      });
    }

    // Insert support cases
    const { error: insertError } = await localClient
      .from('support_cases')
      .insert(supportCases);

    if (insertError) {
      error(`Failed to create support cases: ${insertError.message}`);
      return false;
    }

    log(`Successfully created ${supportCases.length} test support cases`);
    return true;
  } catch (err) {
    error(`Error creating test support cases: ${err.message}`);
    return false;
  }
}

// Main execution function
async function main() {
  try {
    log('Starting tickets and support cases test data seeding...');

    // Create test tickets
    const ticketsSuccess = await createTestTickets();
    if (!ticketsSuccess) {
      process.exit(1);
    }

    // Create test support cases
    const supportCasesSuccess = await createTestSupportCases();
    if (!supportCasesSuccess) {
      process.exit(1);
    }

    log('Test data seeding completed successfully!');
    log('Summary:');
    log('- 20 test tickets created with various statuses and scenarios');
    log('- 15 test support cases created with different issue types');
    log('- Data includes realistic pest control scenarios');
    log('- Workflows can be tested across all status states');
    log('- Ready for testing tickets and support cases features');
  } catch (err) {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main();
}

module.exports = { main };