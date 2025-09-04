import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading companies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/admin/companies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      console.error('Authorization failed:', { authError });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    let companyData;
    
    // Validate request body
    try {
      companyData = await request.json();
    } catch (parseError) {
      console.error('Invalid JSON in request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body - must be valid JSON' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!companyData.name || typeof companyData.name !== 'string' || companyData.name.trim().length === 0) {
      console.error('Validation failed: missing or invalid company name', { 
        hasName: !!companyData.name, 
        nameType: typeof companyData.name 
      });
      return NextResponse.json(
        { error: 'Company name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Sanitize and prepare data
    const sanitizedData = {
      ...companyData,
      name: companyData.name.trim(),
      country: companyData.country || 'United States',
      // Handle website as either array (new format) or string (backward compatibility)
      website: Array.isArray(companyData.website) 
        ? companyData.website
            .filter((url: string) => url && typeof url === 'string' && url.trim().length > 0)
            .map((url: string) => url.trim())
        : companyData.website && typeof companyData.website === 'string' && companyData.website.trim()
          ? [companyData.website.trim()]
          : []
    };


    const { data, error } = await supabase
      .from('companies')
      .insert([sanitizedData])
      .select();

    if (error) {
      console.error('Supabase error creating company:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        companyName: sanitizedData.name
      });
      return NextResponse.json(
        { 
          error: 'Failed to create company',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error('No data returned from company creation');
      return NextResponse.json(
        { error: 'Company creation failed - no data returned' },
        { status: 500 }
      );
    }

    
    // Return the company data directly to match frontend expectations
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error in POST /api/admin/companies:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
