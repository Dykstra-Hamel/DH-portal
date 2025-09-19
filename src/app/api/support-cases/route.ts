import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupportCaseFormData } from '@/types/support-case';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const issueType = searchParams.get('issueType');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    console.log('Support cases API called with params:', { companyId, status, issueType, priority, assignedTo, includeArchived, dateFrom, dateTo });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth result:', { user: user?.id, authError });
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query with joins for related data
    let query = supabase
      .from('support_cases')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code
        ),
        company:companies(
          id,
          name,
          website
        ),
        ticket:tickets!support_cases_ticket_id_fkey(
          id,
          type,
          source,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (issueType) {
      query = query.eq('issue_type', issueType);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    
    if (!includeArchived) {
      query = query.eq('archived', false);
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    console.log('Executing query...');
    const { data: supportCases, error } = await query;

    if (error) {
      console.error('Error fetching support cases:', error);
      return NextResponse.json({ error: 'Failed to fetch support cases', details: error }, { status: 500 });
    }

    console.log('Support cases fetched successfully:', supportCases?.length || 0, 'cases');
    return NextResponse.json(supportCases);
  } catch (error) {
    console.error('Unexpected error in support cases GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supportCaseData: SupportCaseFormData = await request.json();

    // Validate required fields
    if (!supportCaseData.issue_type || !supportCaseData.summary) {
      return NextResponse.json(
        { error: 'Missing required fields: issue_type and summary are required' },
        { status: 400 }
      );
    }

    // Insert the support case
    const { data: newSupportCase, error: insertError } = await supabase
      .from('support_cases')
      .insert([{
        ...supportCaseData,
        status: supportCaseData.status || 'new',
        priority: supportCaseData.priority || 'medium',
        archived: false,
      }])
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code
        ),
        company:companies(
          id,
          name,
          website
        ),
        ticket:tickets!support_cases_ticket_id_fkey(
          id,
          type,
          source,
          created_at
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating support case:', insertError);
      return NextResponse.json({ error: 'Failed to create support case' }, { status: 500 });
    }

    return NextResponse.json(newSupportCase, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in support cases POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}