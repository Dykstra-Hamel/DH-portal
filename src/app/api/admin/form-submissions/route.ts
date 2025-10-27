import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const archived = searchParams.get('archived') === 'true';

    // Use admin client for broader access
    const adminSupabase = createAdminClient();

    // Build query
    let query = adminSupabase
      .from('form_submissions')
      .select(
        `
        *,
        customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          company_id
        ),
        tickets(
          id,
          status
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Filter by company if specified
    if (companyId) {
      // For non-admin users, verify they have access to this company
      if (!isGlobalAdmin) {
        const { data: userCompany } = await supabase
          .from('user_companies')
          .select('id')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .single();

        if (!userCompany) {
          return NextResponse.json(
            { error: 'Access denied to this company' },
            { status: 403 }
          );
        }
      }

      query = query.eq('company_id', companyId);
    } else if (!isGlobalAdmin) {
      // Non-admin users without company filter - get all their companies
      const { data: userCompanies } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (!userCompanies || userCompanies.length === 0) {
        return NextResponse.json([]);
      }

      const companyIds = userCompanies.map(uc => uc.company_id);
      query = query.in('company_id', companyIds);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: formSubmissions, error, count } = await query;

    if (error) {
      console.error('Error fetching form submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch form submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      formSubmissions: formSubmissions || [],
      total: count || 0,
      page,
      limit,
      hasMore: count ? (page * limit) < count : false,
    });
  } catch (error) {
    console.error('Error in form submissions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
