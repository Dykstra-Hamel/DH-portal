import { NextRequest, NextResponse } from 'next/server';
import { sendEvent } from '@/lib/inngest/client';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Test data for automation
    const testLeadData = {
      leadId: 'test-lead-' + Date.now(),
      companyId: body.companyId || 'test-company-id',
      customerId: 'test-customer-' + Date.now(),
      leadData: {
        customerName: body.customerName || 'Test Customer',
        customerEmail: body.customerEmail || 'test@example.com',
        customerPhone: body.customerPhone || '+1234567890',
        pestType: body.pestType || 'ants',
        urgency: body.urgency || 'medium',
        address: body.address || '123 Test St, Test City, TS 12345',
        homeSize: body.homeSize || 1500,
        selectedPlan: body.selectedPlan || 'Basic Pest Control',
        estimatedPrice: {
          min: 150,
          max: 300,
          service_type: 'Professional pest control service',
        },
      },
      attribution: {
        leadSource: 'organic',
        utmSource: 'test',
        utmMedium: 'api',
        utmCampaign: 'automation-test',
      },
      createdAt: new Date().toISOString(),
    };

    // Send the Inngest event
    await sendEvent({
      name: 'lead/created',
      data: testLeadData,
    });

    return NextResponse.json({
      success: true,
      message: 'Test automation event triggered successfully',
      testData: testLeadData,
    });
  } catch (error) {
    console.error('Error triggering test automation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}