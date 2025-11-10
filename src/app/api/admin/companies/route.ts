import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { generateSlug } from '@/lib/slug-utils';

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
      return NextResponse.json(
        { error: 'Company name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    let slug = companyData.slug?.trim();
    if (!slug) {
      slug = generateSlug(companyData.name);
    }

    // Ensure slug uniqueness by checking existing slugs
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existingCompany) {
      // Append a number to make slug unique
      let counter = 1;
      let uniqueSlug = `${slug}-${counter}`;

      while (true) {
        const { data: checkDuplicate } = await supabase
          .from('companies')
          .select('slug')
          .eq('slug', uniqueSlug)
          .single();

        if (!checkDuplicate) break;

        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }

      slug = uniqueSlug;
    }

    // Sanitize and prepare data
    const sanitizedData = {
      ...companyData,
      name: companyData.name.trim(),
      slug: slug,
      country: companyData.country || 'United States',
      // Handle website as either array (new format) or string (backward compatibility)
      website: Array.isArray(companyData.website)
        ? companyData.website
            .filter((url: string) => url && typeof url === 'string' && url.trim().length > 0)
            .map((url: string) => {
              // Normalize URL: strip http/https, trim, remove trailing slashes, add https://
              const normalized = url.replace(/^https?:\/\//i, '').trim().replace(/\/+$/, '');
              return `https://${normalized}`;
            })
        : companyData.website && typeof companyData.website === 'string' && companyData.website.trim()
          ? [companyData.website.replace(/^https?:\/\//i, '').trim().replace(/\/+$/, '')].map(url => `https://${url}`)
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
