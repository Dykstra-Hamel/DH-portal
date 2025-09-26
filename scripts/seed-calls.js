#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// STRICT LOCAL ONLY CONFIGURATION
const CONFIG = {
  LOCAL_ONLY: true,
  LOCAL_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  LOCAL_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DEFAULT_COUNT: 15
};

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
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDateInLast30Days = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
  return new Date(randomTime).toISOString();
};

// Static data as requested
const STATIC_RECORDING_URL = "https://dxc03zgurdly9.cloudfront.net/66cdb7eebc779aa46af6f6cd2ec2448d6a49cf13558cef22a091d476eb370826/recording.wav";

const STATIC_TRANSCRIPT = `Agent: Thanks for calling North west exterminating termite warranty department! I'm Andi, and I'm here to make things easy—whether that's answering your questions or getting you to the right person. Do you have questions about your renewal?
User: No.
Agent: Great! Would you like me to send you a payment link by text to the number you called from, so you can renew your warranty quickly and easily?
User: Set up an inspection.
Agent: I can help with that! I'll need to get you over to one of our customer service pros who can schedule your inspection. Hang tight while I connect you.
Agent: Looks like I wasn't able to get you through to customer service just now. Would you like me to try again, or would you prefer to have someone call you back to set up your inspection?
User: I will try again.
User: Send me a payment link.
Agent: No problem! I'll text
Agent: you the payment link right now so you can renew your warranty whenever it's convenient.You should see that payment link pop up on your phone any second now. If you need anything else, just let me know!
User: Thank you.
Agent: You're welcome! Have a fantastic day, and don't hesitate to reach out if you need anything else.`;

const STATIC_CALL_ANALYSIS = {
  "call_summary": "The user called to inquire about their termite warranty renewal but initially declined to renew. They requested to set up an inspection instead. The agent attempted to transfer the call to customer service but was unsuccessful, so they sent a payment link via SMS as requested by the user.",
  "in_voicemail": false,
  "user_sentiment": "Positive",
  "call_successful": true,
  "custom_analysis_data": {
    "Phone": "{{Phone}}",
    "LocationID": "not provided",
    "pest_issue": "Termite Renewal",
    "RenewalDate": "{{RenDate}}",
    "is_qualified": true,
    "payment_link": "{{PayLink}}",
    "RenewalAmount": 0,
    "call_analysis": "This call is in regard to a Termite Renewal. The user initially did not have questions about the renewal but requested to set up an inspection. The agent attempted to transfer the call to customer service but was unable to do so. Instead, the agent sent a payment link via SMS successfully. The user expressed gratitude at the end of the call. LocationID: not provided.",
    "action_required": false,
    "customer_last_name": "{{Name}}",
    "customer_first_name": "{{Name}}",
    "customer_street_address": "{{Address}}"
  }
};

// Lead data variations
const leadVariations = [
  { source: 'google_cpc', type: 'phone_call', status: 'unassigned', service: 'Termite Inspection' },
  { source: 'facebook_ads', type: 'web_form', status: 'contacting', service: 'General Pest Control' },
  { source: 'organic', type: 'phone_call', status: 'quoted', service: 'Ant Control' },
  { source: 'referral', type: 'phone_call', status: 'ready_to_schedule', service: 'Roach Control' },
  { source: 'google_cpc', type: 'phone_call', status: 'unassigned', service: 'Termite Treatment' },
  { source: 'linkedin', type: 'email', status: 'contacting', service: 'Rodent Control' },
  { source: 'email_campaign', type: 'web_form', status: 'quoted', service: 'Spider Control' },
  { source: 'cold_call', type: 'phone_call', status: 'unassigned', service: 'Bed Bug Treatment' },
  { source: 'organic', type: 'web_form', status: 'contacting', service: 'Wasp Removal' },
  { source: 'referral', type: 'phone_call', status: 'ready_to_schedule', service: 'Flea Control' },
  { source: 'facebook_ads', type: 'social_media', status: 'quoted', service: 'Tick Control' },
  { source: 'google_cpc', type: 'phone_call', status: 'unassigned', service: 'Mosquito Control' },
  { source: 'webinar', type: 'web_form', status: 'contacting', service: 'Wildlife Removal' },
  { source: 'trade_show', type: 'in_person', status: 'quoted', service: 'Commercial Pest Control' },
  { source: 'content_marketing', type: 'web_form', status: 'ready_to_schedule', service: 'Termite Inspection' }
];

const pestIssues = [
  'Termite Renewal', 'Ant Control', 'Roach Control',
  'General Pest Control', 'Rodent Control', 'Spider Control',
  'Bed Bug Treatment', 'Wasp Removal', 'Flea Control',
  'Tick Control', 'Mosquito Control', 'Wildlife Removal'
];

const sentiments = ['positive', 'neutral', 'negative'];
const serviceTimes = ['AM', 'PM', 'anytime'];
const disconnectReasons = ['agent_hangup', 'user_hangup', 'completed', 'technical_issue'];

// Fetch prerequisites from database
async function fetchPrerequisites(client) {
  log('Fetching existing data from database...');

  try {
    // Get existing companies
    const { data: companies, error: companiesError } = await client
      .from('companies')
      .select('id, name')
      .limit(5);

    if (companiesError) {
      error(`Failed to fetch companies: ${companiesError.message}`);
      return null;
    }

    // Get existing customers
    const { data: customers, error: customersError } = await client
      .from('customers')
      .select('id, first_name, last_name, phone')
      .limit(10);

    if (customersError) {
      error(`Failed to fetch customers: ${customersError.message}`);
      return null;
    }

    log(`Found ${companies?.length || 0} companies and ${customers?.length || 0} customers`);

    return { companies: companies || [], customers: customers || [] };
  } catch (err) {
    error(`Error fetching prerequisites: ${err.message}`);
    return null;
  }
}

// Generate lead data
function generateLead(companyId, customerId, variation) {
  const estimatedValues = [250, 350, 450, 650, 850, 1200, 1500, 2000];

  return {
    company_id: companyId,
    customer_id: customerId,
    lead_source: variation.source,
    lead_type: variation.type,
    service_type: variation.service,
    lead_status: variation.status,
    priority: randomChoice(['low', 'medium', 'high', 'urgent']),
    comments: `Customer interested in ${variation.service}. Contact via ${variation.type}.`,
    estimated_value: randomChoice(estimatedValues),
    utm_source: variation.source === 'google_cpc' ? 'google' : null,
    utm_campaign: variation.source === 'google_cpc' ? 'pest-control-2024' : null,
    utm_medium: variation.source === 'google_cpc' ? 'cpc' : null,
  };
}

// Generate call record data
function generateCallRecord(leadId, customerId, phoneNumber) {
  const startTime = randomDateInLast30Days();
  const startDate = new Date(startTime);
  const duration = randomBetween(120, 900); // 2-15 minutes
  const endDate = new Date(startDate.getTime() + duration * 1000);

  return {
    call_id: `call_${generateUUID().slice(0, 8)}`,
    lead_id: leadId,
    customer_id: customerId,
    phone_number: phoneNumber || `555-010${randomBetween(1, 9)}`,
    from_number: '555-COMPANY',
    call_status: 'completed',
    start_timestamp: startTime,
    end_timestamp: endDate.toISOString(),
    duration_seconds: duration,
    recording_url: STATIC_RECORDING_URL,
    transcript: STATIC_TRANSCRIPT,
    call_analysis: STATIC_CALL_ANALYSIS,

    // Extracted structured data
    sentiment: randomChoice(sentiments),
    pest_issue: randomChoice(pestIssues),
    preferred_service_time: randomChoice(serviceTimes),
    disconnect_reason: randomChoice(disconnectReasons),
    contacted_other_companies: Math.random() < 0.3, // 30% chance
    opt_out_sensitive_data_storage: false
  };
}

// Create leads in database
async function createLeads(client, prerequisites, count) {
  log(`Creating ${count} leads...`);

  const { companies, customers } = prerequisites;
  const createdLeads = [];

  for (let i = 0; i < count; i++) {
    const variation = leadVariations[i % leadVariations.length];
    const company = randomChoice(companies);
    const customer = randomChoice(customers);

    const leadData = generateLead(company.id, customer.id, variation);

    try {
      const { data: lead, error: leadError } = await client
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (leadError) {
        error(`Failed to create lead ${i + 1}: ${leadError.message}`);
        continue;
      }

      createdLeads.push({
        ...lead,
        customer_phone: customer.phone
      });

      log(`Created lead ${i + 1}: ${variation.service} (${variation.status})`);
    } catch (err) {
      error(`Error creating lead ${i + 1}: ${err.message}`);
    }
  }

  return createdLeads;
}

// Create call records for leads
async function createCallRecords(client, leads) {
  log(`Creating call records for ${leads.length} leads...`);

  const createdCallRecords = [];

  // Create call records for 80% of leads (to have some variety)
  const leadsWithCalls = leads.slice(0, Math.floor(leads.length * 0.8));

  for (const lead of leadsWithCalls) {
    const callData = generateCallRecord(lead.id, lead.customer_id, lead.customer_phone);

    try {
      const { data: callRecord, error: callError } = await client
        .from('call_records')
        .insert([callData])
        .select()
        .single();

      if (callError) {
        error(`Failed to create call record for lead ${lead.id}: ${callError.message}`);
        continue;
      }

      createdCallRecords.push(callRecord);
      log(`Created call record for lead: ${lead.service_type} (${callRecord.sentiment})`);
    } catch (err) {
      error(`Error creating call record for lead ${lead.id}: ${err.message}`);
    }
  }

  return createdCallRecords;
}

// Associate call records with tickets
async function associateWithTickets(client, callRecords) {
  log('Associating call records with existing tickets...');

  try {
    // Get some existing tickets
    const { data: tickets, error: ticketsError } = await client
      .from('tickets')
      .select('id, lead_id')
      .limit(5);

    if (ticketsError) {
      error(`Failed to fetch tickets: ${ticketsError.message}`);
      return;
    }

    if (!tickets || tickets.length === 0) {
      log('No existing tickets found - skipping ticket association');
      return;
    }

    // Associate first few call records with tickets
    const associationsCount = Math.min(callRecords.length, tickets.length, 3);

    for (let i = 0; i < associationsCount; i++) {
      try {
        const { error: updateError } = await client
          .from('call_records')
          .update({ ticket_id: tickets[i].id })
          .eq('id', callRecords[i].id);

        if (updateError) {
          error(`Failed to associate call record ${callRecords[i].id} with ticket: ${updateError.message}`);
          continue;
        }

        log(`Associated call record with ticket ${tickets[i].id}`);
      } catch (err) {
        error(`Error associating call record: ${err.message}`);
      }
    }
  } catch (err) {
    error(`Error in ticket association: ${err.message}`);
  }
}

// Verify created data
async function verifyData(client) {
  log('Verifying created data...');

  try {
    // Count leads
    const { count: leadCount, error: leadCountError } = await client
      .from('leads')
      .select('*', { count: 'exact', head: true });

    // Count call records
    const { count: callCount, error: callCountError } = await client
      .from('call_records')
      .select('*', { count: 'exact', head: true });

    // Get sample data
    const { data: sampleLeadWithCall, error: sampleError } = await client
      .from('leads')
      .select(`
        id,
        service_type,
        lead_status,
        call_record:call_records!call_records_lead_id_fkey(
          id,
          sentiment,
          pest_issue,
          recording_url
        )
      `)
      .not('call_record.id', 'is', null)
      .limit(1)
      .single();

    log('📊 Data Summary:');
    log(`   Total leads: ${leadCount || 'unknown'}`);
    log(`   Total call records: ${callCount || 'unknown'}`);

    if (sampleLeadWithCall && sampleLeadWithCall.call_record) {
      log(`   Sample lead with call: ${sampleLeadWithCall.service_type} (${sampleLeadWithCall.call_record.sentiment})`);
      log(`   Recording URL set: ${sampleLeadWithCall.call_record.recording_url ? '✅' : '❌'}`);
    }

  } catch (err) {
    error(`Error verifying data: ${err.message}`);
  }
}

// Main execution function
async function main() {
  console.log('🚀 Starting Call Records Seeding (LOCAL ONLY)');
  console.log('================================================');

  // Safety validation
  validateLocalOnly();

  // Get count from command line args
  const args = process.argv.slice(2);
  const countArg = args.find(arg => arg.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1]) : CONFIG.DEFAULT_COUNT;

  log(`Will create ${count} leads with associated call records`);

  // Initialize client
  const client = initializeClient();

  try {
    // Fetch prerequisites
    const prerequisites = await fetchPrerequisites(client);
    if (!prerequisites) {
      error('Failed to fetch prerequisites. Exiting.');
      process.exit(1);
    }

    if (prerequisites.companies.length === 0 || prerequisites.customers.length === 0) {
      error('No companies or customers found. Please run seed-with-users.js first.');
      process.exit(1);
    }

    // Create leads
    const leads = await createLeads(client, prerequisites, count);
    if (leads.length === 0) {
      error('No leads created. Exiting.');
      process.exit(1);
    }

    // Create call records
    const callRecords = await createCallRecords(client, leads);

    // Associate with tickets
    await associateWithTickets(client, callRecords);

    // Verify data
    await verifyData(client);

    console.log('');
    console.log('✅ Seeding completed successfully!');
    console.log(`📝 Created ${leads.length} leads and ${callRecords.length} call records`);
    console.log('🎯 You can now test the Call Information InfoCard');

  } catch (err) {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(err => {
    error(`Unhandled error: ${err.message}`);
    process.exit(1);
  });
}