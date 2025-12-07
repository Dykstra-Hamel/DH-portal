import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this company
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

    // Fetch bulk upload history
    const { data: uploads, error } = await supabase
      .from('bulk_lead_uploads')
      .select(
        `
        id,
        file_name,
        status,
        scheduled_at,
        executed_at,
        total_rows,
        successful_count,
        failed_count,
        skipped_count,
        error_message,
        created_at,
        created_by,
        creator:profiles!created_by(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bulk upload history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch upload history' },
        { status: 500 }
      );
    }

    return NextResponse.json(uploads || []);
  } catch (error) {
    console.error('Error in bulk history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
