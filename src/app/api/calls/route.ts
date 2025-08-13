import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is global admin
    const isAdmin = await isAuthorizedAdmin(user);

    // Get optional company_id filter from query params
    const url = new URL(request.url);
    const companyIdFilter = url.searchParams.get('company_id');
    
    // Validate company_id format if provided
    if (companyIdFilter && companyIdFilter !== 'all') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(companyIdFilter)) {
        return NextResponse.json(
          { error: 'Invalid company ID format' },
          { status: 400 }
        );
      }
    }

    let query = supabase
      .from('call_records')
      .select(
        `
        *,
        leads (
          id,
          customer_id,
          company_id,
          customers (
            id,
            first_name,
            last_name,
            email
          )
        )
      `
      );

    if (isAdmin) {
      // Global admin: can see all calls or filter by specific company
      if (companyIdFilter && companyIdFilter !== 'all') {
        query = query.eq('leads.company_id', companyIdFilter);
      }
      // If no filter or 'all' selected, return all calls (no additional filtering)
    } else {
      // Regular user: only see calls from their associated companies
      const { data: userCompanies, error: companiesError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (companiesError) {
        console.error('Error fetching user companies:', companiesError);
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      if (!userCompanies || userCompanies.length === 0) {
        return NextResponse.json(
          { error: 'User not associated with any company' },
          { status: 403 }
        );
      }

      // Extract company IDs
      const companyIds = userCompanies.map(uc => uc.company_id);

      if (companyIdFilter && companyIds.includes(companyIdFilter)) {
        // Filter by specific company if user has access to it
        query = query.eq('leads.company_id', companyIdFilter);
      } else if (companyIdFilter) {
        // User requested a company they don't have access to
        return NextResponse.json(
          { error: 'Access denied to requested company' },
          { status: 403 }
        );
      } else {
        // No company filter provided - require company selection for regular users
        return NextResponse.json(
          { error: 'Company selection required' },
          { status: 400 }
        );
      }
    }

    const { data: calls, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching calls:', error);
      return NextResponse.json(
        { error: 'Unable to retrieve data' },
        { status: 500 }
      );
    }

    // Filter out calls that don't have leads (shouldn't happen but safety check)
    const filteredCalls = calls?.filter(call => call.leads) || [];

    return NextResponse.json(filteredCalls);
  } catch (error) {
    console.error('Error in calls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}