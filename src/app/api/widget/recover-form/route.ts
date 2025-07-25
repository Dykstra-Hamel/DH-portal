import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface RecoverFormRequest {
  companyId: string;
  sessionId: string;
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Recover partial form data for continuation
export async function POST(request: NextRequest) {
  try {
    const body: RecoverFormRequest = await request.json();
    const { companyId, sessionId } = body;

    // Validate required fields
    if (!companyId || !sessionId) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: companyId and sessionId are required',
          success: false
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId) || !uuidRegex.test(sessionId)) {
      return NextResponse.json(
        { 
          error: 'Invalid UUID format for companyId or sessionId',
          success: false
        },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    const supabase = createAdminClient();

    // Look up partial lead by session ID and company ID
    const { data: partialLead, error: partialLeadError } = await supabase
      .from('partial_leads')
      .select(`
        id,
        session_id,
        form_data,
        step_completed,
        service_area_data,
        attribution_data,
        created_at,
        updated_at,
        expires_at,
        converted_to_lead_id
      `)
      .eq('session_id', sessionId)
      .eq('company_id', companyId)
      .is('converted_to_lead_id', null) // Only return non-converted partial leads
      .single();

    if (partialLeadError) {
      // If no partial lead found, that's not necessarily an error
      if (partialLeadError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: true,
            hasPartialLead: false,
            message: 'No partial lead found for this session'
          },
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          }
        );
      }

      console.error('Error retrieving partial lead:', partialLeadError);
      return NextResponse.json(
        {
          error: 'Failed to retrieve partial lead data',
          success: false
        },
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Check if partial lead has expired
    const now = new Date();
    const expiresAt = new Date(partialLead.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        {
          success: true,
          hasPartialLead: false,
          expired: true,
          message: 'Partial lead has expired'
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    // Also get the widget session data for additional context
    const { data: widgetSession } = await supabase
      .from('widget_sessions')
      .select(`
        session_id,
        user_agent,
        referrer_url,
        page_url,
        first_visit_at,
        last_activity_at
      `)
      .eq('session_id', sessionId)
      .eq('company_id', companyId)
      .single();

    // Prepare the response data
    const recoveryData = {
      success: true,
      hasPartialLead: true,
      partialLeadId: partialLead.id,
      sessionId: partialLead.session_id,
      stepCompleted: partialLead.step_completed,
      formData: partialLead.form_data,
      serviceAreaData: partialLead.service_area_data,
      attributionData: partialLead.attribution_data,
      sessionInfo: widgetSession ? {
        firstVisit: widgetSession.first_visit_at,
        lastActivity: widgetSession.last_activity_at,
        referrerUrl: widgetSession.referrer_url,
        pageUrl: widgetSession.page_url
      } : null,
      timestamps: {
        created: partialLead.created_at,
        updated: partialLead.updated_at,
        expires: partialLead.expires_at
      }
    };

    // Update the last activity timestamp for the session
    if (widgetSession) {
      await supabase
        .from('widget_sessions')
        .update({
          last_activity_at: new Date().toISOString(),
          is_active: true
        })
        .eq('session_id', sessionId);
    }


    return NextResponse.json(
      recoveryData,
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );

  } catch (error) {
    console.error('Error in recover-form endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}