import { NextRequest, NextResponse } from 'next/server';
import { sendEvent } from '@/lib/inngest/client';
import type { InngestEvent } from '@/lib/inngest/client';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { event } = await request.json() as { event: InngestEvent };

    if (!event || !event.name || !event.data) {
      return NextResponse.json({ 
        error: 'Invalid event format. Expected: { event: { name: string, data: object } }' 
      }, { status: 400 });
    }


    // Send the event to Inngest
    await sendEvent(event);

    return NextResponse.json({
      success: true,
      message: `Event ${event.name} sent successfully`,
      eventId: Date.now().toString() // Simple ID for tracking
    });

  } catch (error) {
    console.error('❌ Error triggering event:', error);
    
    return NextResponse.json({
      error: 'Failed to trigger event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    message: 'Event trigger endpoint',
    usage: {
      method: 'POST',
      body: {
        event: {
          name: 'lead/created | automation/trigger | email/scheduled | workflow/test',
          data: {
            description: 'Event-specific data structure'
          }
        }
      }
    },
    examples: [
      {
        name: 'Lead Created Event',
        event: {
          name: 'lead/created',
          data: {
            leadId: 'uuid',
            companyId: 'uuid',
            customerId: 'uuid',
            leadData: {
              customerName: 'John Doe',
              customerEmail: 'john@example.com',
              customerPhone: '+1234567890',
              pestType: 'ants',
              urgency: 'high',
              address: '123 Main St'
            },
            attribution: {
              leadSource: 'website'
            },
            createdAt: new Date().toISOString()
          }
        }
      },
      {
        name: 'Workflow Test Event',
        event: {
          name: 'workflow/test',
          data: {
            workflowId: 'uuid',
            companyId: 'uuid',
            testData: {
              sampleLead: {
                customerName: 'Test Customer',
                customerEmail: 'test@example.com',
                pestType: 'roaches'
              },
              skipActualExecution: true
            },
            userId: 'uuid'
          }
        }
      }
    ]
  });
}