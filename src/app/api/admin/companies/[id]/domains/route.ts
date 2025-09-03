import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';

interface AddDomainRequest {
  domain: string;
}

// Get all domains for a specific company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication first
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }

    const { id: company_id } = await params;
    
    // Use admin client for database operations
    const adminSupabase = createAdminClient();

    // Check if company exists
    const { data: company, error: companyError } = await adminSupabase
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get domains for this company
    const { data: domains, error } = await adminSupabase
      .from('widget_domains')
      .select(`
        id,
        domain,
        is_active,
        created_at,
        updated_at
      `)
      .eq('company_id', company_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching company domains:', error);
      return NextResponse.json(
        { error: 'Failed to fetch domains' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      company,
      domains: domains || []
    });
  } catch (error) {
    console.error('Error in company domains GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add a new domain to a specific company
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication first
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }

    const { id: company_id } = await params;
    const { domain }: AddDomainRequest = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Validate domain format
    const trimmed = domain.trim();
    let validatedDomain: string;

    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return NextResponse.json(
          { error: 'Invalid protocol - must be http or https' },
          { status: 400 }
        );
      }
      validatedDomain = trimmed.toLowerCase().replace(/\/+$/, ''); // Remove trailing slashes
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format. Please enter a full URL like https://example.com' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    
    // Check if company exists
    const { data: companyExists } = await adminSupabase
      .from('companies')
      .select('id')
      .eq('id', company_id)
      .single();

    if (!companyExists) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Insert the domain
    const { data, error } = await adminSupabase
      .from('widget_domains')
      .insert({
        domain: validatedDomain,
        company_id,
        created_by: user.id,
        is_active: true
      })
      .select(`
        id,
        domain,
        is_active,
        created_at
      `)
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Domain already exists' },
          { status: 409 }
        );
      }
      console.error('Error adding company domain:', error);
      return NextResponse.json(
        { error: 'Failed to add domain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      domain: data,
      message: `Added domain ${validatedDomain}`
    });
  } catch (error) {
    console.error('Error in company domains POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a domain from a specific company
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication first
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - authentication required' },
        { status: 401 }
      );
    }

    const { id: company_id } = await params;
    const { searchParams } = new URL(request.url);
    const domain_id = searchParams.get('domain_id');

    if (!domain_id) {
      return NextResponse.json(
        { error: 'Domain ID is required' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    
    // Delete the domain (only if it belongs to this company)
    const { error } = await adminSupabase
      .from('widget_domains')
      .delete()
      .eq('id', domain_id)
      .eq('company_id', company_id);

    if (error) {
      console.error('Error deleting company domain:', error);
      return NextResponse.json(
        { error: 'Failed to delete domain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully'
    });
  } catch (error) {
    console.error('Error in company domains DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}