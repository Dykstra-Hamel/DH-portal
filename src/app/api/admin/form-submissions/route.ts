import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * Helper function to get form submission counts for all tabs
 */
async function getFormSubmissionTabCounts(
  companyId: string | null,
  companyIds: string[] | null,
  isGlobalAdmin: boolean
): Promise<{ all: number; processed: number; pending: number; failed: number }> {
  const adminSupabase = createAdminClient();

  // Build base query
  let allQuery = adminSupabase.from('form_submissions').select('id', { count: 'exact', head: true });
  let processedQuery = adminSupabase.from('form_submissions').select('id', { count: 'exact', head: true }).eq('processing_status', 'processed');
  let pendingQuery = adminSupabase.from('form_submissions').select('id', { count: 'exact', head: true }).eq('processing_status', 'pending');
  let failedQuery = adminSupabase.from('form_submissions').select('id', { count: 'exact', head: true }).eq('processing_status', 'failed');

  // Apply company filtering
  if (companyId) {
    allQuery = allQuery.eq('company_id', companyId);
    processedQuery = processedQuery.eq('company_id', companyId);
    pendingQuery = pendingQuery.eq('company_id', companyId);
    failedQuery = failedQuery.eq('company_id', companyId);
  } else if (!isGlobalAdmin && companyIds && companyIds.length > 0) {
    allQuery = allQuery.in('company_id', companyIds);
    processedQuery = processedQuery.in('company_id', companyIds);
    pendingQuery = pendingQuery.in('company_id', companyIds);
    failedQuery = failedQuery.in('company_id', companyIds);
  }

  const [allCount, processedCount, pendingCount, failedCount] = await Promise.all([
    allQuery,
    processedQuery,
    pendingQuery,
    failedQuery,
  ]);

  return {
    all: allCount.count || 0,
    processed: processedCount.count || 0,
    pending: pendingCount.count || 0,
    failed: failedCount.count || 0,
  };
}

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

    // Store company IDs for tab counts
    let userCompanyIds: string[] | null = null;

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

      userCompanyIds = userCompanies.map(uc => uc.company_id);
      query = query.in('company_id', userCompanyIds);
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

    // Get tab counts for all submission statuses
    const counts = await getFormSubmissionTabCounts(companyId, userCompanyIds, isGlobalAdmin);

    return NextResponse.json({
      formSubmissions: formSubmissions || [],
      total: count || 0,
      page,
      limit,
      hasMore: count ? (page * limit) < count : false,
      counts,
    });
  } catch (error) {
    console.error('Error in form submissions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
