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


    // Test SMS creation
    const result = await smsService.createConversation({
      companyId,
      customerNumber,
      agentId,
      retellNumber,
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
    const retellApiKey = process.env.RETELL_API_KEY;
    
    return NextResponse.json({
      success: true,
      status: 'SMS service is ready',
      retell_configured: !!retellApiKey,
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