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

    // Parse request body - support both FormData and JSON for backwards compatibility
    const contentType = request.headers.get('content-type') || '';
    let companyId: string;
    let csvContent: string;
    let skipDatabaseDuplicateCheck: boolean = false;

    if (contentType.includes('multipart/form-data')) {
      // New FormData approach (handles large files better)
      const formData = await request.formData();
      companyId = formData.get('companyId') as string;
      const csvFile = formData.get('csvFile') as File;
      skipDatabaseDuplicateCheck = formData.get('skipDatabaseDuplicateCheck') === 'true';

      if (!csvFile) {
        return NextResponse.json(
          { error: 'CSV file is required' },
          { status: 400 }
        );
      }

      csvContent = await csvFile.text();
    } else {
      // Legacy JSON approach (kept for backwards compatibility)
      const body = await request.json();
      companyId = body.companyId;
      csvContent = body.csvContent;
      skipDatabaseDuplicateCheck = body.skipDatabaseDuplicateCheck;
    }

    // Validate required fields
    if (!companyId || !csvContent) {
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

    // Get existing leads for duplicate detection (only if not skipped)
    let existingLeadsData: Array<{ email?: string; phone_number?: string }> = [];

    if (!skipDatabaseDuplicateCheck) {
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('id, customer:customers(email, phone)')
        .eq('company_id', companyId);

      // Flatten customer data for duplicate detection
      existingLeadsData = (existingLeads || [])
        .map((lead: any) => ({
          email: lead.customer?.email,
          phone_number: lead.customer?.phone,
        }))
        .filter((lead: any) => lead.email || lead.phone_number);
    }

    // Parse CSV using AI (with or without database duplicate checking)
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
