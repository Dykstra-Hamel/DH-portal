import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: customerId } = await params;

    // First check if customer exists and user has access
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, company_id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this customer's company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', customer.company_id)
      .single();

    if (userCompanyError || !userCompany) {
      return NextResponse.json(
        { error: 'Access denied to this customer' },
        { status: 403 }
      );
    }

    // Get all support cases for this customer
    const { data: supportCases, error: supportCasesError } = await supabase
      .from('support_cases')
      .select(
        `
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
        )
      `
      )
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (supportCasesError) {
      console.error('Error fetching support cases:', supportCasesError);
      return NextResponse.json(
        { error: 'Failed to fetch support cases' },
        { status: 500 }
      );
    }

    // Fetch assigned users separately
    const assignedUserIds =
      supportCases?.filter(sc => sc.assigned_to).map(sc => sc.assigned_to) || [];
    let assignedUsers: any[] = [];

    if (assignedUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, avatar_url')
        .in('id', assignedUserIds);

      if (profilesData) {
        assignedUsers = profilesData;
      }
    }

    // Merge assigned user data with support cases
    const supportCasesWithUsers =
      supportCases?.map(sc => ({
        ...sc,
        assigned_user: sc.assigned_to
          ? assignedUsers.find(user => user.id === sc.assigned_to)
          : null,
      })) || [];

    return NextResponse.json({ supportCases: supportCasesWithUsers });
  } catch (error) {
    console.error('Error in customer support cases GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
