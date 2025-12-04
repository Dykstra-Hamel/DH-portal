import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';
import { getSuppressionList, addToSuppressionList, addPhoneToSuppressionList, getSuppressionStats } from '@/lib/suppression';

/**
 * GET /api/admin/suppression-list
 *
 * Get suppression list for a company with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const getStats = searchParams.get('stats') === 'true';

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

    // Get suppression list
    const result = await getSuppressionList(companyId, limit, offset);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Get stats if requested
    let stats = null;
    if (getStats) {
      const statsResult = await getSuppressionStats(companyId);
      if (statsResult.success) {
        stats = statsResult.data;
      }
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: result.count,
      stats,
    });

  } catch (error) {
    console.error('Error in suppression list GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/suppression-list
 *
 * Manually add an email or phone to the suppression list
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    const body = await request.json();
    const { companyId, email, phoneNumber, communicationType, notes } = body;

    // Validate required fields
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    if (!email && !phoneNumber) {
      return NextResponse.json(
        { error: 'Either email or phone number is required' },
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

    // Add to suppression list
    let result;

    if (email) {
      result = await addToSuppressionList(
        email,
        companyId,
        'manual',
        'unsubscribe',
        null,
        notes || 'Manually added by admin'
      );
    } else if (phoneNumber) {
      result = await addPhoneToSuppressionList(
        phoneNumber,
        companyId,
        communicationType || 'all',
        'manual',
        'unsubscribe',
        notes || 'Manually added by admin'
      );
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Failed to add to suppression list' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully added to suppression list',
    });

  } catch (error) {
    console.error('Error in suppression list POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
