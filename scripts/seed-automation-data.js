const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedAutomationData() {
  console.log('🌱 Seeding automation test data...');

  try {
    // Create test workflows
    const testWorkflows = [
      {
        name: 'Standard Lead Nurturing',
        description: 'Standard lead nurturing sequence',
        workflow_type: 'lead_nurturing',
        trigger_type: 'lead_created',
        trigger_conditions: {
          pest_types: ['ants', 'roaches', 'spiders', 'termites'],
          urgency: 'all'
        },
        workflow_steps: [
          {
            id: 'step-1',
            type: 'email',
            delay_minutes: 0,
            template_id: null,
            conditions: {}
          },
          {
            id: 'step-2',
            type: 'email',
            delay_minutes: 120,
            template_id: null,
            conditions: {}
          }
        ],
        is_active: true,
        business_hours_only: false,
        company_id: '33333333-3333-3333-3333-333333333333'
      },
      {
        name: 'Welcome Sequence',
        description: 'Automated welcome sequence for new leads',
        workflow_type: 'email_sequence',
        trigger_type: 'lead_created',
        trigger_conditions: {
          pest_types: ['ants', 'roaches', 'termites'],
          urgency: 'all'
        },
        workflow_steps: [
          {
            id: 'step-1',
            type: 'email',
            delay_minutes: 0,
            template_id: null, // Will be set to first template
            conditions: {}
          },
          {
            id: 'step-2',
            type: 'email',
            delay_minutes: 60,
            template_id: null, // Will be set to second template
            conditions: {}
          },
          {
            id: 'step-3',
            type: 'call',
            delay_minutes: 1440, // 24 hours
            call_type: 'follow_up',
            conditions: {
              email_not_opened: true
            }
          }
        ],
        is_active: true,
        business_hours_only: false,
        company_id: '33333333-3333-3333-3333-333333333333' // Green Shield Exterminators
      },
      {
        name: 'High Urgency Response',
        description: 'Immediate response for high urgency leads',
        workflow_type: 'immediate_response',
        trigger_type: 'lead_created',
        trigger_conditions: {
          urgency: 'high'
        },
        workflow_steps: [
          {
            id: 'step-1',
            type: 'call',
            delay_minutes: 0,
            call_type: 'immediate',
            conditions: {}
          },
          {
            id: 'step-2',
            type: 'email',
            delay_minutes: 5,
            template_id: null,
            conditions: {
              call_outcome: 'no_answer'
            }
          }
        ],
        is_active: true,
        business_hours_only: true,
        company_id: '33333333-3333-3333-3333-333333333333'
      }
    ];

    // Create test email templates
    const testTemplates = [
      {
        name: 'Welcome Email - Test',
        description: 'Test welcome email for automation',
        template_type: 'welcome',
        subject_line: 'Welcome to {{companyName}} - We\'re Here to Help!',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome {{customerName}}!</h1>
            <p>Thank you for contacting {{companyName}} about your {{pestType}} issue.</p>
            <p>Our team will contact you shortly to schedule your service.</p>
            <p>Best regards,<br>{{companyName}} Team</p>
          </div>
        `,
        text_content: 'Welcome {{customerName}}! Thank you for contacting {{companyName}} about your {{pestType}} issue. Our team will contact you shortly.',
        variables: ['customerName', 'companyName', 'pestType'],
        is_active: true,
        company_id: '33333333-3333-3333-3333-333333333333'
      },
      {
        name: 'Follow-up Email - Test',
        description: 'Test follow-up email for automation',
        template_type: 'followup',
        subject_line: 'Still need help with your {{pestType}} problem?',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Don\'t let {{pestType}} take over!</h1>
            <p>Hi {{customerName}},</p>
            <p>We noticed you inquired about {{pestType}} treatment. Our specialists are ready to help!</p>
            <p>Call us now at {{companyPhone}} to schedule your free inspection.</p>
            <p>{{companyName}} Team</p>
          </div>
        `,
        text_content: 'Hi {{customerName}}, we noticed you inquired about {{pestType}} treatment. Call us at {{companyPhone}} to schedule your free inspection.',
        variables: ['customerName', 'pestType', 'companyPhone', 'companyName'],
        is_active: true,
        company_id: '33333333-3333-3333-3333-333333333333'
      }
    ];

    // Create test customers first
    const testCustomers = [
      {
        first_name: 'John Test',
        last_name: 'Smith',
        email: 'john.test@example.com',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip_code: '12345',
        company_id: '33333333-3333-3333-3333-333333333333'
      },
      {
        first_name: 'Jane Test',
        last_name: 'Doe',
        email: 'jane.test@example.com',
        phone: '+1234567891',
        address: '456 Test Ave',
        city: 'Test City',
        state: 'TS',
        zip_code: '12345',
        company_id: '33333333-3333-3333-3333-333333333333'
      }
    ];

    // Insert templates first
    console.log('📧 Creating test email templates...');
    const { data: insertedTemplates, error: templateError } = await supabase
      .from('email_templates')
      .upsert(testTemplates, { onConflict: 'name,company_id' })
      .select();

    if (templateError) {
      console.error('Error creating templates:', templateError);
      throw templateError;
    }

    console.log(`✅ Created ${insertedTemplates.length} email templates`);

    // Update workflows with template IDs
    if (insertedTemplates.length >= 2) {
      // Update all workflows to properly assign template IDs to email steps
      for (let i = 0; i < testWorkflows.length; i++) {
        const workflow = testWorkflows[i];
        let templateIndex = 0;
        
        // Assign template IDs to all email steps
        for (let j = 0; j < workflow.workflow_steps.length; j++) {
          const step = workflow.workflow_steps[j];
          if (step.type === 'email' && step.template_id === null) {
            // Cycle through available templates
            step.template_id = insertedTemplates[templateIndex % insertedTemplates.length].id;
            templateIndex++;
          }
        }
      }
    }

    // Insert workflows
    console.log('🔄 Creating test workflows...');
    const { data: insertedWorkflows, error: workflowError } = await supabase
      .from('automation_workflows')
      .upsert(testWorkflows, { onConflict: 'name,company_id' })
      .select();

    if (workflowError) {
      console.error('Error creating workflows:', workflowError);
      throw workflowError;
    }

    console.log(`✅ Created ${insertedWorkflows.length} automation workflows`);

    // Insert test customers first
    console.log('👤 Creating test customers...');
    const { data: insertedCustomers, error: customerError } = await supabase
      .from('customers')
      .upsert(testCustomers, { onConflict: 'email,company_id' })
      .select();

    if (customerError) {
      console.error('Error creating customers:', customerError);
      throw customerError;
    }

    console.log(`✅ Created ${insertedCustomers.length} test customers`);

    // Create test leads using the customer IDs
    const testLeads = [
      {
        company_id: '33333333-3333-3333-3333-333333333333',
        customer_id: insertedCustomers[0]?.id,
        lead_source: 'organic',
        lead_type: 'web_form',
        service_type: 'Ant Treatment',
        lead_status: 'new',
        priority: 'medium',
        comments: 'Customer reported ant issues in kitchen area'
      },
      {
        company_id: '33333333-3333-3333-3333-333333333333',
        customer_id: insertedCustomers[1]?.id,
        lead_source: 'google_cpc',
        lead_type: 'web_form',
        service_type: 'Roach Elimination',
        lead_status: 'new',
        priority: 'high',
        comments: 'Urgent roach infestation in restaurant'
      }
    ];

    // Insert test leads
    console.log('👥 Creating test leads...');
    const { data: insertedLeads, error: leadError } = await supabase
      .from('leads')
      .insert(testLeads)
      .select();

    if (leadError) {
      console.error('Error creating leads:', leadError);
      throw leadError;
    }

    console.log(`✅ Created ${insertedLeads.length} test leads`);

    console.log('\\n🎉 Automation test data seeding completed!');
    console.log('\\n📋 What was created:');
    console.log(`   • ${insertedTemplates.length} Email Templates`);
    console.log(`   • ${insertedWorkflows.length} Automation Workflows`);
    console.log(`   • ${insertedCustomers.length} Test Customers`);
    console.log(`   • ${insertedLeads.length} Test Leads`);
    console.log('\\n🚀 You can now test automations using these workflows and data.');

  } catch (error) {
    console.error('❌ Error seeding automation data:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedAutomationData();
}

module.exports = { seedAutomationData };