import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { getSuppressionStats } from '@/lib/suppression';

/**
 * GET /api/admin/suppression-list/stats
 *
 * Get suppression list statistics for a company
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Check user has access to this company (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (!userCompany) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }

    // Get stats
    const result = await getSuppressionStats(companyId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    console.error('Error in suppression stats GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
