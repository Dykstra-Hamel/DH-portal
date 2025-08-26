import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/client';
import { sendEvent } from '@/lib/inngest/client';
import { normalizePhoneNumber } from '@/lib/utils';

interface TestLeadData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pestType: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  address: string;
  homeSize?: number;
  selectedPlan?: string;
  leadSource: string;
  comments?: string;
}

interface TestRequest {
  companyId: string;
  triggerType: string;
  testData: TestLeadData;
}

// Helper function to create appropriate attribution data based on lead source
function createAttributionData(leadSource: string, testData: TestLeadData) {
  const baseAttribution = {
    test_data: true,
    generated_by: 'automation_test_page',
    timestamp: new Date().toISOString(),
    source_type: leadSource,
  };

  switch (leadSource) {
    case 'widget_submission':
      return {
        ...baseAttribution,
        leadSource: 'widget_submission',
        traffic_source: 'widget_form',
        utm_source: 'widget',
        utm_medium: 'form',
        utm_campaign: 'automation_test',
        page_url: '/widget',
        form_type: 'pest_control_widget',
        pest_type: testData.pestType,
        urgency: testData.urgency,
      };

    case 'referral':
      return {
        ...baseAttribution,
        leadSource: 'referral',
        traffic_source: 'referral',
        utm_source: 'referral',
        utm_medium: 'customer_referral',
        utm_campaign: 'automation_test',
        referrer_type: 'existing_customer',
        referrer_name: 'Test Customer Referral',
      };

    case 'google_cpc':
      return {
        ...baseAttribution,
        leadSource: 'google_cpc',
        traffic_source: 'paid_search',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'automation_test_campaign',
        gclid: 'test_gclid_' + Date.now(),
        referrer_domain: 'google.com',
      };

    case 'facebook_ads':
      return {
        ...baseAttribution,
        leadSource: 'facebook_ads',
        traffic_source: 'social_paid',
        utm_source: 'facebook',
        utm_medium: 'paid',
        utm_campaign: 'automation_test_fb',
        referrer_domain: 'facebook.com',
      };

    case 'organic':
      return {
        ...baseAttribution,
        leadSource: 'organic',
        traffic_source: 'organic',
        utm_source: 'google',
        utm_medium: 'organic',
        referrer_domain: 'google.com',
        search_query: `${testData.pestType} control services`,
      };

    case 'social_media':
      return {
        ...baseAttribution,
        leadSource: 'social_media',
        traffic_source: 'social',
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: 'automation_test',
        referrer_domain: 'facebook.com',
      };

    default:
      // For 'other' and any unlisted sources
      return {
        ...baseAttribution,
        leadSource: leadSource,
        traffic_source: 'direct',
        utm_source: 'direct',
        utm_medium: 'none',
        utm_campaign: 'automation_test',
      };
  }
}

export async function POST(request: NextRequest) {
  // Only allow test automation in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test automation not available in production' },
      { status: 404 }
    );
  }

  try {
    const startTime = Date.now();
    const { companyId, triggerType, testData }: TestRequest = await request.json();

    // Basic validation
    if (!companyId || !triggerType || !testData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testData.customerEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate database constraints
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const validLeadTypes = ['phone_call', 'web_form', 'email', 'chat', 'social_media', 'in_person', 'other'];
    const validLeadSources = ['organic', 'referral', 'google_cpc', 'facebook_ads', 'linkedin', 'email_campaign', 'cold_call', 'trade_show', 'webinar', 'content_marketing', 'paid', 'social_media', 'widget_submission', 'other'];

    if (!validPriorities.includes(testData.urgency)) {
      return NextResponse.json(
        { success: false, error: `Invalid urgency level. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validLeadSources.includes(testData.leadSource)) {
      return NextResponse.json(
        { success: false, error: `Invalid lead source. Must be one of: ${validLeadSources.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Create test customer
    const nameParts = testData.customerName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const normalizedPhone = normalizePhoneNumber(testData.customerPhone);

    // Check for existing customer by email (to avoid duplicates in testing)
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', testData.customerEmail)
      .eq('company_id', companyId)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new test customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            company_id: companyId,
            first_name: firstName,
            last_name: lastName,
            email: testData.customerEmail,
            phone: normalizedPhone || testData.customerPhone,
            customer_status: 'active',
            // Parse address if provided
            address: testData.address,
          },
        ])
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        console.error('Error creating test customer:', customerError);
        return NextResponse.json(
          { success: false, error: 'Failed to create test customer' },
          { status: 500 }
        );
      }

      customerId = newCustomer.id;
    }

    // Create test lead
    let notes = `🧪 AUTOMATION TEST LEAD 🧪\n`;
    notes += `Generated: ${new Date().toISOString()}\n`;
    notes += `Trigger: ${triggerType}\n`;
    notes += `Company: ${company.name}\n\n`;
    notes += `--- Test Data ---\n`;
    notes += `Pest Type: ${testData.pestType}\n`;
    notes += `Urgency: ${testData.urgency}\n`;
    if (testData.selectedPlan) {
      notes += `Selected Plan: ${testData.selectedPlan}\n`;
    }
    if (testData.homeSize) {
      notes += `Home Size: ${testData.homeSize} sq ft\n`;
    }
    if (testData.address) {
      notes += `Address: ${testData.address}\n`;
    }
    if (testData.comments) {
      notes += `Customer Comments: ${testData.comments}\n`;
    }
    notes += `\n⚠️  THIS IS TEST DATA - DO NOT CONTACT ⚠️`;
    notes += `\n📝 Generated via automation test page for workflow testing`;
    notes += `\n🗑️  Safe to delete after testing`;

    // Create attribution data that will prevent the trigger from overriding lead_source
    const attributionData = createAttributionData(testData.leadSource, testData);

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([
        {
          company_id: companyId,
          customer_id: customerId,
          lead_source: testData.leadSource,
          lead_type: 'web_form',
          lead_status: 'new',
          priority: testData.urgency, // Use urgency directly since it's already validated
          comments: notes,
          estimated_value: testData.homeSize ? Math.round(testData.homeSize * 0.15) : null, // Rough estimate
          // Attribution fields to work with the database trigger
          attribution_data: attributionData,
          utm_source: (attributionData as any).utm_source,
          utm_medium: (attributionData as any).utm_medium,
          utm_campaign: (attributionData as any).utm_campaign,
          gclid: (attributionData as any).gclid || null,
        },
      ])
      .select('id')
      .single();

    if (leadError || !lead) {
      console.error('Error creating test lead:', {
        error: leadError,
        testData,
        companyId,
        customerId,
        notes: notes.substring(0, 200) + '...' // Log first 200 chars of notes
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create test lead',
          details: leadError?.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }

    // Check for existing workflows before triggering
    const { data: existingWorkflows } = await supabase
      .from('automation_workflows')
      .select('id, name, trigger_type, is_active, workflow_steps')
      .eq('company_id', companyId)
      .eq('trigger_type', triggerType === 'widget/schedule-completed' ? 'widget_schedule_completed' : triggerType.replace('/', '_'))
      .eq('is_active', true);

    console.log(`🔍 FOUND ${existingWorkflows?.length || 0} active workflows`);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify lead exists before triggering automation
    const { data: verifyLead, error: verifyError } = await supabase
      .from('leads')
      .select('id, customer_id, company_id')
      .eq('id', lead.id)
      .single();

    if (verifyError || !verifyLead) {
      console.error('Lead verification failed:', { leadId: lead.id, error: verifyError });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Lead not found after creation - database transaction may not have committed',
          leadId: lead.id
        },
        { status: 500 }
      );
    }

    console.log(`✅ LEAD VERIFIED: ${verifyLead.id}`);

    // Trigger automation based on trigger type
    let triggerResult = null;
    const baseEventData = {
      leadId: lead.id,
      companyId,
      customerId,
      leadData: {
        customerName: testData.customerName,
        customerEmail: testData.customerEmail,
        customerPhone: testData.customerPhone,
        pestType: testData.pestType,
        urgency: testData.urgency,
        address: testData.address,
        homeSize: testData.homeSize,
        selectedPlan: testData.selectedPlan,
      },
      attribution: {
        leadSource: testData.leadSource,
      },
      createdAt: new Date().toISOString(),
    };

    try {
      console.log(`🚀 TRIGGERING EVENT: ${triggerType}`);
      
      switch (triggerType) {
        case 'widget/schedule-completed':
          await sendEvent({
            name: 'widget/schedule-completed',
            data: baseEventData,
          });
          break;

        case 'lead/created':
          await sendEvent({
            name: 'lead/created',
            data: baseEventData,
          });
          break;

        case 'lead/status-changed':
          await sendEvent({
            name: 'lead/status-changed',
            data: {
              leadId: lead.id,
              companyId,
              fromStatus: 'new',
              toStatus: 'contacted',
              leadData: baseEventData.leadData,
              userId: 'test-automation',
              timestamp: new Date().toISOString(),
            },
          });
          break;

        default:
          throw new Error(`Unsupported trigger type: ${triggerType}`);
      }

      console.log(`Successfully sent ${triggerType} event to Inngest`);
      triggerResult = { 
        success: true, 
        triggered: triggerType,
        workflowsFound: existingWorkflows?.length || 0,
        workflows: existingWorkflows?.map(w => ({ id: w.id, name: w.name, steps: w.workflow_steps?.length || 0 })) || []
      };
    } catch (triggerError) {
      console.error('Error triggering automation:', triggerError);
      triggerResult = { 
        success: false, 
        error: triggerError instanceof Error ? triggerError.message : 'Unknown trigger error' 
      };
    }

    const executionTime = Date.now() - startTime;

    // Wait longer to allow automation processing (increased from 1s to 3s)
    console.log('Waiting 3 seconds for workflow processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check for any workflow executions with detailed logging
    const { data: executions, error: executionsError } = await supabase
      .from('automation_executions')
      .select('*')
      .eq('lead_id', lead.id)
      .order('started_at', { ascending: false })
      .limit(5);

    console.log(`Workflow executions query result:`, {
      executions: executions?.length || 0,
      error: executionsError,
      leadId: lead.id
    });

    if (executions && executions.length > 0) {
      console.log('Found workflow executions:', executions.map(e => ({
        id: e.id,
        status: e.execution_status,
        workflowId: e.workflow_id,
        stepIndex: e.step_index,
        startedAt: e.started_at,
        completedAt: e.completed_at,
        errorMessage: e.error_message
      })));
    } else {
      console.log('No workflow executions found for lead', lead.id);
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      customerId,
      companyName: company.name,
      triggerResult,
      workflowResults: executions || [],
      executionTime,
      message: `Test automation triggered successfully! Created lead ${lead.id}`,
    });

  } catch (error) {
    console.error('Error in test automation trigger:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET method for checking test capabilities
export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Get available companies for testing
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');

    if (error) {
      throw error;
    }

    // Get available trigger types (you could expand this to check actual workflow triggers)
    const triggerTypes = [
      {
        value: 'widget/schedule-completed',
        label: 'Widget Schedule Completed',
        description: 'Triggers when widget form is completed',
        available: true,
      },
      {
        value: 'lead/created',
        label: 'New Lead Created',
        description: 'Triggers when any new lead is created',
        available: true,
      },
      {
        value: 'lead/status-changed',
        label: 'Lead Status Changed',
        description: 'Triggers when lead status changes',
        available: true,
      },
    ];

    return NextResponse.json({
      success: true,
      companies: companies || [],
      triggerTypes,
      testScenarios: [
        'urgent-termites',
        'standard-ants',
        'commercial-bedbugs',
        'referral-mice',
      ],
    });

  } catch (error) {
    console.error('Error getting test automation info:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}