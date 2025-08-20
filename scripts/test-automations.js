const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test data
const TEST_COMPANY_ID = '33333333-3333-3333-3333-333333333333';
const TEST_USER_ID = '1ec0cbf5-444b-4cc8-a825-e6ad449661fb'; // Your user ID

async function testWorkflowTrigger() {
  console.log('🧪 Testing workflow trigger...');
  
  try {
    // Get available workflows
    const { data: workflows, error: workflowError } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('company_id', TEST_COMPANY_ID)
      .eq('is_active', true);

    if (workflowError || !workflows.length) {
      console.error('❌ No active workflows found. Run npm run seed-automations first.');
      return;
    }

    console.log(`📋 Found ${workflows.length} active workflows:`);
    workflows.forEach(w => console.log(`   • ${w.name} (${w.workflow_type})`));

    // Test data for workflow
    const testWorkflow = workflows[0];
    const sampleLead = {
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '+1234567890',
      pestType: 'ants',
      urgency: 'medium',
      address: '123 Test St, Test City, TS 12345',
      companyName: 'Green Shield Exterminators',
      companyPhone: '+1234567800'
    };

    console.log(`\\n🚀 Triggering test for workflow: ${testWorkflow.name}`);

    // Make request to trigger workflow test
    const response = await fetch('http://localhost:3000/api/companies/' + TEST_COMPANY_ID + '/workflows/' + testWorkflow.id + '/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        sampleLead,
        skipActualExecution: false, // Set to true to skip sending real emails/calls
        triggerActualEvents: true // Enable actual Inngest event triggering
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Workflow test triggered successfully');
      console.log('📊 Execution ID:', result.testResult?.executionId);
      if (result.testResult?.inngestEventTriggered) {
        console.log('🚀 Inngest event sent:', result.testResult?.inngestEventId);
        console.log('\\n💡 Check your Inngest dev server dashboard to see the execution');
      } else {
        console.log('\\n💡 This was a validation/simulation test only (no Inngest events sent)');
      }
    } else {
      console.error('❌ Failed to trigger workflow test:', result.error);
      if (result.validationErrors) {
        console.error('📋 Validation errors:');
        result.validationErrors.forEach(error => console.error(`   • ${error}`));
      }
    }

  } catch (error) {
    console.error('❌ Error testing workflow:', error.message);
  }
}

async function testLeadCreation() {
  console.log('\\n👤 Testing lead creation automation...');
  
  try {
    // Create a test lead that should trigger automations
    const testLead = {
      customer_name: 'Automation Test Lead',
      customer_email: 'automation.test@example.com',
      customer_phone: '+1234567892',
      pest_type: 'termites',
      urgency: 'high',
      address: '789 Automation Blvd, Test City, TS 12345',
      home_size: 2500,
      lead_source: 'organic',
      company_id: TEST_COMPANY_ID,
      status: 'new'
    };

    const { data: newLead, error } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating test lead:', error);
      return;
    }

    console.log('✅ Test lead created:', newLead.customer_name);
    console.log('📧 Email:', newLead.customer_email);
    console.log('🐛 Pest type:', newLead.pest_type);
    console.log('⚠️ Urgency:', newLead.urgency);

    // Trigger lead created event
    console.log('\\n📢 Triggering lead/created event...');
    
    const eventResponse = await fetch('http://localhost:3000/api/debug/trigger-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          name: 'lead/created',
          data: {
            leadId: newLead.id,
            companyId: TEST_COMPANY_ID,
            customerId: newLead.customer_id || newLead.id,
            leadData: {
              customerName: newLead.customer_name,
              customerEmail: newLead.customer_email,
              customerPhone: newLead.customer_phone,
              pestType: newLead.pest_type,
              urgency: newLead.urgency,
              address: newLead.address,
              homeSize: newLead.home_size
            },
            attribution: {
              leadSource: newLead.lead_source,
              utmSource: null,
              utmMedium: null,
              utmCampaign: null
            },
            createdAt: new Date().toISOString()
          }
        }
      })
    });

    if (eventResponse.ok) {
      console.log('✅ Lead created event sent to Inngest');
      console.log('\\n💡 Check your Inngest dev server to see automation execution');
    } else {
      console.log('⚠️ Could not send event to Inngest - make sure dev server is running');
    }

  } catch (error) {
    console.error('❌ Error in lead creation test:', error.message);
  }
}

async function listAutomationData() {
  console.log('\\n📋 Current automation test data:');
  
  try {
    // List workflows
    const { data: workflows } = await supabase
      .from('automation_workflows')
      .select('name, workflow_type, trigger_type, is_active')
      .eq('company_id', TEST_COMPANY_ID);

    console.log('\\n🔄 Workflows:');
    if (workflows && workflows.length > 0) {
      workflows.forEach(w => {
        console.log(`   • ${w.name} (${w.workflow_type}) - ${w.is_active ? 'Active' : 'Inactive'}`);
      });
    } else {
      console.log('   No workflows found. Run: npm run seed-automations');
    }

    // List templates
    const { data: templates } = await supabase
      .from('email_templates')
      .select('name, template_type, is_active')
      .eq('company_id', TEST_COMPANY_ID)
      .like('name', '%Test%');

    console.log('\\n📧 Test Templates:');
    if (templates && templates.length > 0) {
      templates.forEach(t => {
        console.log(`   • ${t.name} (${t.template_type}) - ${t.is_active ? 'Active' : 'Inactive'}`);
      });
    } else {
      console.log('   No test templates found. Run: npm run seed-automations');
    }

    // List recent test leads
    const { data: leads } = await supabase
      .from('leads')
      .select('customer_name, customer_email, pest_type, urgency, created_at')
      .eq('company_id', TEST_COMPANY_ID)
      .or('customer_email.like.%test%,customer_email.like.%automation%')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('\\n👥 Recent Test Leads:');
    if (leads && leads.length > 0) {
      leads.forEach(l => {
        const date = new Date(l.created_at).toLocaleString();
        console.log(`   • ${l.customer_name} (${l.pest_type}, ${l.urgency}) - ${date}`);
      });
    } else {
      console.log('   No test leads found.');
    }

  } catch (error) {
    console.error('❌ Error listing data:', error.message);
  }
}

async function main() {
  console.log('🧪 DH Portal Automation Testing Suite');
  console.log('=====================================\\n');

  const command = process.argv[2];

  switch (command) {
    case 'workflow':
      await testWorkflowTrigger();
      break;
    case 'lead':
      await testLeadCreation();
      break;
    case 'list':
      await listAutomationData();
      break;
    default:
      console.log('Available commands:');
      console.log('  npm run inngest:test workflow  - Test workflow trigger');
      console.log('  npm run inngest:test lead      - Test lead creation automation');
      console.log('  npm run inngest:test list      - List current test data');
      console.log('\\nExample: npm run inngest:test workflow');
  }
}

if (require.main === module) {
  main().catch(console.error);
}