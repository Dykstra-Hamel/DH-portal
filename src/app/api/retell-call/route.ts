import { NextRequest, NextResponse } from 'next/server';
import {
  getCompanyRetellConfig,
  logRetellConfigError,
} from '@/lib/retell-config';

interface RetellCallRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  pestType?: string;
  urgency?: string;
  selectedPlan?: string;
  recommendedPlan?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  companyId: string;
}

interface RetellCallPayload {
  from_number: string;
  to_number: string;
  agent_id: string;
  retell_llm_dynamic_variables?: {
    customer_first_name: string;
    customer_last_name: string;
    customer_name: string;
    customer_email: string;
    customer_comments: string;
    customer_pest_problem?: string;
    customer_urgency?: string;
    customer_selected_plan?: string;
    customer_recommended_plan?: string;
    customer_street_address?: string;
    customer_city?: string;
    customer_state?: string;
    customer_zip?: string;
    company_id: string;
    company_name: string;
    company_url?: string;
    is_follow_up: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RetellCallRequest = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      message,
      pestType,
      urgency,
      selectedPlan,
      recommendedPlan,
      streetAddress,
      city,
      state,
      zipCode,
      companyId,
    } = body;

    // Note: Knowledge base functionality has been simplified to direct Retell AI integration

    // Validate and sanitize required fields
    if (!firstName || !lastName || !email || !phone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Input validation
    if (firstName.length > 100 || lastName.length > 100) {
      return NextResponse.json(
        { error: 'Name fields cannot exceed 100 characters' },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message cannot exceed 2000 characters' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Phone number validation (more permissive for various formats)
    const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{7,20}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Company ID is required - no fallback to environment variables
    if (!companyId) {
      logRetellConfigError('unknown', 'Company ID is required for all calls');
      return NextResponse.json(
        { error: 'Company ID is required for making calls' },
        { status: 400 }
      );
    }

    // Get company-specific Retell configuration and company info in a single operation
    const { createAdminClient } = await import('@/lib/supabase/server-admin');
    const supabase = createAdminClient();

    // Fetch both company settings and company info in parallel
    const [configResult, companyResult] = await Promise.all([
      getCompanyRetellConfig(companyId),
      supabase
        .from('companies')
        .select('name, website')
        .eq('id', companyId)
        .single(),
    ]);

    if (configResult.error || !configResult.config) {
      logRetellConfigError(
        companyId,
        configResult.error || 'Unknown error',
        configResult.missingSettings
      );

      // Provide specific error message for frontend
      let errorMessage =
        'Retell configuration is not complete for this company.';
      if (
        configResult.missingSettings &&
        configResult.missingSettings.length > 0
      ) {
        errorMessage += ` Missing: ${configResult.missingSettings.join(', ')}.`;
      }
      errorMessage += ' Please configure Call Settings in the admin dashboard.';

      return NextResponse.json(
        {
          error: errorMessage,
          missingSettings: configResult.missingSettings,
        },
        { status: 400 }
      );
    }

    // Company lookup is required - no fallbacks allowed
    if (companyResult.error) {
      console.error('Failed to fetch company information:', {
        companyId,
        error: companyResult.error,
        errorCode: companyResult.error.code,
        errorDetails: companyResult.error.details,
      });
      return NextResponse.json(
        { error: 'Failed to load company information' },
        { status: 500 }
      );
    }

    if (!companyResult.data) {
      console.error('Company not found in database:', { companyId });
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = companyResult.data;

    const {
      apiKey: retellApiKey,
      agentId: retellAgentId,
      phoneNumber: retellFromNumber,
    } = configResult.config;

    // Clean phone number (remove formatting)
    const cleanPhoneNumber = phone.replace(/[\s\-\(\)\.]/g, '');

    // Ensure phone number starts with + if not present
    const formattedPhoneNumber = cleanPhoneNumber.startsWith('+')
      ? cleanPhoneNumber
      : `+1${cleanPhoneNumber}`;

    // Prepare the payload for Retell API
    const payload: RetellCallPayload = {
      from_number: retellFromNumber,
      to_number: formattedPhoneNumber,
      agent_id: retellAgentId,
      retell_llm_dynamic_variables: {
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_name: `${firstName} ${lastName}`,
        customer_email: email,
        customer_comments: message,
        customer_pest_problem: pestType || '',
        customer_urgency: urgency || '',
        customer_selected_plan: selectedPlan || '',
        customer_recommended_plan: recommendedPlan || '',
        customer_street_address: streetAddress || '',
        customer_city: city || '',
        customer_state: state || '',
        customer_zip: zipCode || '',
        company_id: companyId,
        company_name: company.name,
        company_url: company.website || '',
        is_follow_up: 'false', // Default to false, can be overridden by caller
      },
    };

    // Make the API call to Retell
    const response = await fetch(
      'https://api.retellai.com/v2/create-phone-call',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${retellApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Retell API failed: ${response.status}`, {
        companyId,
        phoneNumber: formattedPhoneNumber.slice(0, -4) + '****', // Log only partial phone number
        errorMessage: errorText,
      });

      // Handle specific error cases
      if (response.status === 401) {
        return NextResponse.json(
          {
            error:
              'Authentication failed with Retell service. Please check your configuration.',
          },
          { status: 500 }
        );
      } else if (response.status === 400) {
        return NextResponse.json(
          {
            error:
              'Invalid phone number or request data. Please verify the phone number format.',
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: 'Failed to initiate call. Please try again later.' },
          { status: 500 }
        );
      }
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Call initiated successfully',
      callId: result.call_id,
      callStatus: result.call_status,
    });
  } catch (error) {
    console.error('Error initiating Retell call:', error);

    // Log error details for debugging
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
