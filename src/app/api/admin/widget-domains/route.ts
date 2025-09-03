import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';

interface AddDomainRequest {
  domain: string;
  company_id: string;
}

interface UpdateDomainRequest {
  id: string;
  domain?: string;
  company_id?: string;
  is_active?: boolean;
}

interface WidgetDomainWithCompany {
  id: string;
  domain: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  companies: {
    id: string;
    name: string;
  };
}

// Get all widget domains with company associations
export async function GET() {
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
    
    // Use admin client for database operations
    const adminSupabase = createAdminClient();

    const { data: domains, error } = await adminSupabase
      .from('widget_domains')
      .select(`
        id,
        domain,
        company_id,
        is_active,
        created_at,
        updated_at,
        companies (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false }) as { data: WidgetDomainWithCompany[] | null; error: any };

    if (error) {
      console.error('Error fetching widget domains:', error);
      return NextResponse.json(
        { error: 'Failed to fetch domains' },
        { status: 500 }
      );
    }

    // Also get companies for the dropdown
    const { data: companies, error: companiesError } = await adminSupabase
      .from('companies')
      .select('id, name')
      .order('name');

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      domains: domains || [],
      companies: companies || []
    });
  } catch (error) {
    console.error('Error in widget domains GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add new widget domain
export async function POST(request: NextRequest) {
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
    
    const { domain, company_id }: AddDomainRequest = await request.json();

    if (!domain || !company_id) {
      return NextResponse.json(
        { error: 'Domain and company_id are required' },
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
        company_id,
        is_active,
        created_at,
        companies (
          id,
          name
        )
      `)
      .single() as { data: WidgetDomainWithCompany | null; error: any };

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Domain already exists' },
          { status: 409 }
        );
      }
      console.error('Error adding widget domain:', error);
      return NextResponse.json(
        { error: 'Failed to add domain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      domain: data,
      message: `Added domain ${validatedDomain} for ${data?.companies?.name || 'Unknown Company'}`
    });
  } catch (error) {
    console.error('Error in widget domains POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update or delete widget domain
export async function PUT(request: NextRequest) {
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
    
    const { id, domain, company_id, is_active }: UpdateDomainRequest = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Domain ID is required' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    
    // Build update object
    const updateData: any = {
      updated_by: user.id
    };

    if (domain !== undefined) {
      // Validate domain if provided
      try {
        const url = new URL(domain.trim());
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return NextResponse.json(
            { error: 'Invalid protocol - must be http or https' },
            { status: 400 }
          );
        }
        updateData.domain = domain.trim().toLowerCase().replace(/\/+$/, '');
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    if (company_id !== undefined) {
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
      updateData.company_id = company_id;
    }

    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    // Update the domain
    const { data, error } = await adminSupabase
      .from('widget_domains')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        domain,
        company_id,
        is_active,
        created_at,
        updated_at,
        companies (
          id,
          name
        )
      `)
      .single() as { data: WidgetDomainWithCompany | null; error: any };

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Domain already exists' },
          { status: 409 }
        );
      }
      console.error('Error updating widget domain:', error);
      return NextResponse.json(
        { error: 'Failed to update domain' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      domain: data,
      message: 'Domain updated successfully'
    });
  } catch (error) {
    console.error('Error in widget domains PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete widget domain
export async function DELETE(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Domain ID is required' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    
    // Delete the domain
    const { error } = await adminSupabase
      .from('widget_domains')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting widget domain:', error);
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
    console.error('Error in widget domains DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}