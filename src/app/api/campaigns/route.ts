import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    let companyIds: string[] = [];

    if (isGlobalAdmin) {
      // Global admins can see all campaigns from all companies
      const { data: allCompanies } = await supabase
        .from('companies')
        .select('id');
      companyIds = allCompanies?.map(c => c.id) || [];
    } else {
      // Regular users only see campaigns from their companies
      const { data: userCompanies, error: companiesError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (companiesError || !userCompanies || userCompanies.length === 0) {
        return NextResponse.json({ error: 'No companies found' }, { status: 404 });
      }

      companyIds = userCompanies.map(uc => uc.company_id);
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const companyId = searchParams.get('company_id');

    // Build query
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        workflow:automation_workflows(
          id,
          name,
          workflow_type
        ),
        created_by_user:created_by(
          id,
          full_name,
          email
        )
      `)
      .in('company_id', companyIds)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (companyId && companyIds.includes(companyId)) {
      query = query.eq('company_id', companyId);
    }

    const { data: campaigns, error } = await query;

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaigns });

  } catch (error) {
    console.error('Error in campaigns GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    const body = await request.json();
    const {
      company_id,
      name,
      description,
      campaign_id,
      discount_id,
      start_datetime,
      end_datetime,
      workflow_id,
      target_audience_type,
      audience_filter_criteria,
    } = body;

    // Validate required fields
    if (!company_id || !name || !campaign_id || !start_datetime || !workflow_id) {
      return NextResponse.json(
        { error: 'Missing required fields: company_id, name, campaign_id, start_datetime, workflow_id' },
        { status: 400 }
      );
    }

    // Check user has access to company (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: companyError } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', company_id)
        .single();

      if (companyError || !userCompany) {
        return NextResponse.json(
          { error: 'Unauthorized - user not associated with company' },
          { status: 403 }
        );
      }

      // Allow admin, manager, owner, and member roles to create campaigns
      if (!['admin', 'manager', 'owner', 'member'].includes(userCompany.role)) {
        return NextResponse.json(
          { error: 'Unauthorized - insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Create campaign
    const { data: campaign, error: createError } = await supabase
      .from('campaigns')
      .insert({
        company_id,
        name,
        description,
        campaign_id,
        discount_id: discount_id || null,
        status: 'draft',
        start_datetime,
        end_datetime: end_datetime && end_datetime.trim() !== '' ? end_datetime : null,
        workflow_id,
        target_audience_type: target_audience_type || 'custom_list',
        audience_filter_criteria: audience_filter_criteria || {},
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating campaign:', createError);
      return NextResponse.json(
        { error: 'Failed to create campaign', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, campaign }, { status: 201 });

  } catch (error) {
    console.error('Error in campaigns POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
