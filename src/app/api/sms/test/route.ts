import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const { 
      companyId, 
      customerNumber, 
      agentId,
      retellNumber,
      dynamicVariables = {}
    } = await request.json();

    // Basic validation
    if (!companyId || !customerNumber) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: companyId, customerNumber' 
        },
        { status: 400 }
      );
    }


    // Test SMS creation - force new conversation for testing
    const result = await smsService.createConversation({
      companyId,
      customerNumber,
      agentId,
      retellNumber,
      forceNew: true, // Always create new conversation for testing
      metadata: {
        test: true,
        created_via: 'test_endpoint',
        timestamp: new Date().toISOString()
      },
      dynamicVariables
    });

    return NextResponse.json({
      success: result.success,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in SMS test endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET method to test service status
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      status: 'SMS service is ready',
      note: 'Retell API keys are configured per-company in company_settings',
      timestamp: new Date().toISOString(),
      endpoints: {
        send_sms: '/api/sms/send',
        webhook: '/api/webhooks/retell-sms',
        conversations: '/api/sms/conversations',
        test: '/api/sms/test'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Configuration error' 
      },
      { status: 500 }
    );
  }
}