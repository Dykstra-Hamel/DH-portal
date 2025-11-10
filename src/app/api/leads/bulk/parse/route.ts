import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { parseCSVLeads } from '@/lib/gemini/csv-parser';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Parse request body
    const body = await request.json();
    const { companyId, csvContent } = body;

    console.log('Bulk parse request:', {
      companyId,
      csvContentLength: csvContent?.length,
      hasCompanyId: !!companyId,
      hasCsvContent: !!csvContent
    });

    // Validate required fields
    if (!companyId || !csvContent) {
      console.error('Missing required fields:', { companyId: !!companyId, csvContent: !!csvContent });
      return NextResponse.json(
        { error: 'Company ID and CSV content are required' },
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

    // Get existing leads for duplicate detection
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, customer:customers(email, phone)')
      .eq('company_id', companyId);

    // Flatten customer data for duplicate detection
    const existingLeadsData = (existingLeads || [])
      .map((lead: any) => ({
        email: lead.customer?.email,
        phone_number: lead.customer?.phone,
      }))
      .filter((lead: any) => lead.email || lead.phone_number);

    // Parse CSV using AI
    const parseResult = await parseCSVLeads(csvContent, existingLeadsData);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error || 'Failed to parse CSV' },
        { status: 400 }
      );
    }

    return NextResponse.json(parseResult);
  } catch (error) {
    console.error('Error in bulk parse API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
