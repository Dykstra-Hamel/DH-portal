import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { getCompanyOutboundSMSRetellConfig } from '@/lib/retell-config';
import { smsService } from '@/lib/sms-service';

interface SMSSendRequest {
  companyId: string;
  customerNumber: string; // E.164 format
  agentId: string;
  retellNumber?: string; // Optional, will use default if not provided
  metadata?: Record<string, any>;
  dynamicVariables?: Record<string, any>; // Dynamic variables for Retell LLM personalization
}

export async function POST(request: NextRequest) {
  try {
    const {
      companyId,
      customerNumber,
      agentId,
      retellNumber,
      metadata = {},
      dynamicVariables = {},
    }: SMSSendRequest = await request.json();

    // Basic validation
    if (!companyId || !customerNumber || !agentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: companyId, customerNumber, agentId',
        },
        { status: 400 }
      );
    }

    // Validate phone number format (basic E.164 validation)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(customerNumber)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid phone number format. Must be in E.164 format (e.g., +1234567890)',
        },
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

    // Get SMS-specific Retell configuration
    const smsConfig = await getCompanyOutboundSMSRetellConfig(companyId);

    if (smsConfig.error) {
      return NextResponse.json(
        {
          success: false,
          error: smsConfig.error,
          missingSettings: smsConfig.missingSettings,
        },
        { status: 400 }
      );
    }

    // Use provided values or fallback to configuration
    const finalRetellNumber = retellNumber || smsConfig.config?.phoneNumber;
    let finalAgentId = agentId;

    // If no agent ID provided, use SMS-specific agent from configuration
    if (!finalAgentId && smsConfig.config?.agentId) {
      finalAgentId = smsConfig.config.agentId;
    }

    if (!finalRetellNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No Retell phone number configured for SMS. Please configure in Call Settings.',
        },
        { status: 400 }
      );
    }

    if (!finalAgentId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No SMS agent ID configured for this company. Please configure in Call Settings.',
        },
        { status: 400 }
      );
    }

    // Use SMS service to create conversation with improved Retell status checking
    const result = await smsService.createConversation({
      companyId,
      customerNumber,
      agentId: finalAgentId,
      retellNumber: finalRetellNumber,
      metadata: {
        ...metadata,
        source: 'dh_portal_api'
      },
      dynamicVariables
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      smsId: result.smsId,
      customerNumber: customerNumber,
      retellNumber: finalRetellNumber,
      agentId: finalAgentId,
      isExisting: result.isExisting || false,
      message: result.isExisting ? 'Reusing existing active conversation' : 'Created new SMS conversation'
    });
  } catch (error) {
    console.error('Error in SMS send API:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET method to check SMS service status
export async function GET() {
  try {
    const retellApiKey = process.env.RETELL_API_KEY;

    if (!retellApiKey) {
      return NextResponse.json(
        { success: false, error: 'Retell API key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      service: 'retell_sms',
      configured: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration error',
      },
      { status: 500 }
    );
  }
}
